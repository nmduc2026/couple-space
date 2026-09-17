import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import {
  guessUnit,
  normalizePlace,
  provinceIdOf,
  unitByCoords,
  type AdminUnit,
} from '../lib/adminUnits'
import { useProvinces } from './useAdminUnits'
import { PREVIEW } from '../dev/preview'
import type { Post } from './usePosts'

type Alias = {
  alias: string
  admin_unit_id: string | null
  country: string
}

export type Unresolved = {
  placeName: string
  alias: string
  count: number
}

export type PlaceCount = { placeName: string; count: number }

export type WardGroup = {
  ward: string | null
  count: number
  places: PlaceCount[]
}

export type Resolution = {
  /** postId → province admin_unit id */
  provinceOf: Map<string, string>
  placesByProvince: Map<string, PlaceCount[]>
  wardsByProvince: Map<string, WardGroup[]>
  /** Bài cần stamp admin_unit_id */
  toStamp: Array<{ id: string; unitId: string }>
  /** province id → số bài */
  visits: Map<string, number>
  /** commune id → số bài (trong các tỉnh đã đi) */
  communeVisits: Map<string, number>
  foreign: number
  unresolved: Unresolved[]
  isLoading: boolean
}

export function usePlaceResolution(posts: Post[]): Resolution {
  const { couple } = useCouple()
  const { data: provinces = [], isLoading: loadingProv } = useProvinces()

  const aliasQuery = useQuery({
    queryKey: ['place_aliases', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_aliases')
        .select('alias, admin_unit_id, country')
        .eq('couple_id', couple!.id)
      if (error) throw error
      return (data ?? []) as Alias[]
    },
  })

  const aliases = useMemo(() => {
    const map = new Map<string, Alias>()
    for (const a of aliasQuery.data ?? []) map.set(a.alias, a)
    return map
  }, [aliasQuery.data])

  return useMemo(() => {
    const units = provinces as AdminUnit[]
    const visits = new Map<string, number>()
    const communeVisits = new Map<string, number>()
    const pending = new Map<string, Unresolved>()
    const toStamp: Array<{ id: string; unitId: string }> = []
    const provinceOf = new Map<string, string>()
    const placeTally = new Map<string, Map<string, number>>()
    const wardTally = new Map<string, Map<string, Map<string, number>>>()
    let foreign = 0

    const note = (provinceId: string, post: Post, unitId?: string) => {
      provinceOf.set(post.id, provinceId)
      const inside = placeTally.get(provinceId) ?? new Map<string, number>()
      const name = post.place_name!.trim()
      inside.set(name, (inside.get(name) ?? 0) + 1)
      placeTally.set(provinceId, inside)

      const wardKey = post.ward?.trim() || ''
      const byWard = wardTally.get(provinceId) ?? new Map<string, Map<string, number>>()
      const places = byWard.get(wardKey) ?? new Map<string, number>()
      places.set(name, (places.get(name) ?? 0) + 1)
      byWard.set(wardKey, places)
      wardTally.set(provinceId, byWard)

      if (unitId && unitId !== provinceId) {
        communeVisits.set(unitId, (communeVisits.get(unitId) ?? 0) + 1)
      }
    }

    for (const post of posts) {
      if (!post.place_name) continue
      const alias = normalizePlace(post.place_name)

      const known = aliases.get(alias)
      if (known) {
        if (known.admin_unit_id) {
          const provId =
            provinceIdOf(units, known.admin_unit_id) ?? known.admin_unit_id
          visits.set(provId, (visits.get(provId) ?? 0) + 1)
          note(provId, post, known.admin_unit_id)
          if (!post.admin_unit_id) {
            toStamp.push({ id: post.id, unitId: known.admin_unit_id })
          }
        } else {
          foreign++
        }
        continue
      }

      let unitId = post.admin_unit_id
      if (!unitId && units.length) {
        const guessed =
          guessUnit(units, post.place_name) ??
          unitByCoords(units, post.place_lat, post.place_lng, 'province')
        unitId = guessed?.id ?? null
      }

      if (unitId) {
        const provId = provinceIdOf(units, unitId) ?? unitId
        visits.set(provId, (visits.get(provId) ?? 0) + 1)
        note(provId, post, unitId)
        if (!post.admin_unit_id) toStamp.push({ id: post.id, unitId })
        continue
      }

      const row = pending.get(alias)
      if (row) row.count++
      else pending.set(alias, { placeName: post.place_name, alias, count: 1 })
    }

    const placesByProvince = new Map<string, PlaceCount[]>()
    for (const [id, inside] of placeTally) {
      placesByProvince.set(
        id,
        [...inside.entries()]
          .map(([placeName, count]) => ({ placeName, count }))
          .sort((a, b) => b.count - a.count || a.placeName.localeCompare(b.placeName)),
      )
    }

    const wardsByProvince = new Map<string, WardGroup[]>()
    for (const [id, byWard] of wardTally) {
      const groups: WardGroup[] = [...byWard.entries()].map(([ward, places]) => ({
        ward: ward || null,
        count: [...places.values()].reduce((n, c) => n + c, 0),
        places: [...places.entries()]
          .map(([placeName, count]) => ({ placeName, count }))
          .sort((a, b) => b.count - a.count || a.placeName.localeCompare(b.placeName)),
      }))
      groups.sort((a, b) => {
        if (a.ward === null) return 1
        if (b.ward === null) return -1
        return b.count - a.count || a.ward.localeCompare(b.ward)
      })
      wardsByProvince.set(id, groups)
    }

    return {
      provinceOf,
      placesByProvince,
      wardsByProvince,
      toStamp,
      visits,
      communeVisits,
      foreign,
      unresolved: [...pending.values()].sort((a, b) => b.count - a.count),
      isLoading: loadingProv || aliasQuery.isLoading,
    }
  }, [posts, aliases, provinces, loadingProv, aliasQuery.isLoading])
}
