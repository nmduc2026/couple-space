"""Rebuild map GeoJSON from HF sapnhap source with topology-safe simplify."""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

from shapely import make_valid
from shapely.geometry import mapping, shape
from shapely.ops import transform, unary_union

TMP = Path(os.environ["TEMP"]) / "sapnhap"
OUT = Path(r"C:\Work\couple-space\app\src\lib\geo")

MACRO_ZONE = {
    "red_river_delta": "bac",
    "northern_midlands": "bac",
    "northern_midlands_mountains": "bac",
    "northeast": "bac",
    "northwest": "bac",
    "central_coast": "trung",
    "north_central_coast": "trung",
    "south_central_coast": "trung",
    "central_highlands": "trung",
    "southeast": "nam",
    "mekong_delta": "nam",
}


def load_json(path: Path) -> dict:
    text = path.read_text(encoding="utf-8").replace("NaN", "null")
    return json.loads(text)


def mercator_project(geom, center_lon=106.5, center_lat=16.2, scale=1800, tx=200, ty=210):
    def proj(x, y, z=None):
        lam = math.radians(x - center_lon)
        y0 = math.log(math.tan(math.pi / 4 + math.radians(center_lat) / 2))
        y1 = math.log(math.tan(math.pi / 4 + math.radians(y) / 2))
        return (scale * lam + tx, ty - scale * (y1 - y0))

    return transform(lambda x, y, z=None: proj(x, y), geom)


def projected_ok(geom) -> bool:
    if geom.is_empty:
        return False
    b = mercator_project(geom).bounds  # minx, miny, maxx, maxy
    w, h = b[2] - b[0], b[3] - b[1]
    return w < 2000 and h < 2000 and w > 0 and h > 0


def clean_geom(geom_dict: dict, simplify_eps: float):
    g = make_valid(shape(geom_dict))
    if g.is_empty:
        return None
    if g.geom_type == "GeometryCollection":
        polys = [p for p in g.geoms if p.geom_type in ("Polygon", "MultiPolygon")]
        if not polys:
            return None
        g = unary_union(polys)
    if g.geom_type not in ("Polygon", "MultiPolygon"):
        return None

    # Drop crumb parts
    if g.geom_type == "MultiPolygon":
        parts = [p for p in g.geoms if p.area >= 1e-6]
        if not parts:
            parts = [max(g.geoms, key=lambda p: p.area)]
        g = parts[0] if len(parts) == 1 else unary_union(parts)

    if simplify_eps > 0:
        g = g.simplify(simplify_eps, preserve_topology=True)
        g = make_valid(g)
        if g.geom_type == "GeometryCollection":
            polys = [p for p in g.geoms if p.geom_type in ("Polygon", "MultiPolygon")]
            g = unary_union(polys) if polys else g

    if g.geom_type not in ("Polygon", "MultiPolygon"):
        return None

    # Keep only parts that project cleanly (drop inverted islands)
    if g.geom_type == "MultiPolygon":
        good = [p for p in g.geoms if projected_ok(p)]
        if not good:
            # fall back to largest part
            good = [max(g.geoms, key=lambda p: p.area)]
        g = good[0] if len(good) == 1 else unary_union(good)

    if not projected_ok(g):
        # try reverse coordinates as last resort
        g2 = g.reverse() if hasattr(g, "reverse") else g
        if projected_ok(g2):
            g = g2
        else:
            # still bad — keep largest single polygon only
            if g.geom_type == "MultiPolygon":
                g = max(g.geoms, key=lambda p: p.area)
            if not projected_ok(g) and hasattr(g, "reverse"):
                g = g.reverse()

    return mapping(g) if not g.is_empty else None


def centroid_lonlat(geom_dict: dict) -> tuple[float, float]:
    c = shape(geom_dict).centroid
    return float(c.x), float(c.y)


def rebuild_provinces() -> None:
    src = load_json(TMP / "geo" / "provinces.geojson")
    features = []
    for f in src["features"]:
        p = f["properties"]
        code = str(p.get("ma") or "").zfill(2) if str(p.get("ma") or "").isdigit() else str(p.get("ma"))
        geom = clean_geom(f["geometry"], simplify_eps=0.003)
        if geom is None:
            print("SKIP", code, p.get("ten"))
            continue
        lng, lat = centroid_lonlat(geom)
        zone = MACRO_ZONE.get(p.get("macro_region") or "", "nam")
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "code": code,
                    "name": p.get("ten"),
                    "type": p.get("type"),
                    "merged_from": p.get("predecessors"),
                    "zone": zone,
                    "lat": round(lat, 5),
                    "lng": round(lng, 5),
                },
                "geometry": geom,
            }
        )
    features.sort(key=lambda x: x["properties"]["name"] or "")
    out = {"type": "FeatureCollection", "features": features}
    path = OUT / "vietnam-provinces.geojson"
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {path} features={len(features)} size={path.stat().st_size/1024:.1f}KB")


def rebuild_communes() -> None:
    src = load_json(TMP / "geo" / "communes.geojson")
    by_parent: dict[str, list] = {}
    for f in src["features"]:
        p = f["properties"]
        parent = str(p.get("parent_ma") or p.get("ma_tinh") or "").zfill(2)
        if not parent or parent == "None":
            # try from ma prefix
            ma = str(p.get("ma") or "")
            parent = ma[:2] if len(ma) >= 2 else ""
        if not parent:
            continue
        geom = clean_geom(f["geometry"], simplify_eps=0.001)
        if geom is None:
            continue
        code = str(p.get("ma") or "")
        by_parent.setdefault(parent, []).append(
            {
                "type": "Feature",
                "properties": {
                    "code": code,
                    "name": p.get("ten"),
                    "type": p.get("type"),
                },
                "geometry": geom,
            }
        )

    communes_dir = OUT / "communes"
    communes_dir.mkdir(parents=True, exist_ok=True)
    for code, feats in sorted(by_parent.items()):
        feats.sort(key=lambda x: x["properties"]["name"] or "")
        path = communes_dir / f"{code}.geojson"
        path.write_text(
            json.dumps(
                {"type": "FeatureCollection", "features": feats},
                ensure_ascii=False,
                separators=(",", ":"),
            ),
            encoding="utf-8",
        )
        print(f"  communes {code}: {len(feats)} -> {path.stat().st_size/1024:.1f}KB")
    print(f"commune files: {len(by_parent)}")


if __name__ == "__main__":
    rebuild_provinces()
    rebuild_communes()
