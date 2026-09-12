import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import {
  guessProvince,
  normalizePlace,
  provinceByCoords,
} from '../lib/provinces'
import { PREVIEW } from '../dev/preview'
import type { Post } from './usePosts'

type Alias = {
  alias: string
  province_code: string | null
  country: string
}

export type Unresolved = {
  /** Tên gốc người dùng đã gõ, để hiện lại đúng chữ họ viết. */
  placeName: string
  /** Dạng đã chuẩn hoá — đây mới là khoá lưu vào `place_aliases`. */
  alias: string
  count: number
}

export type Resolution = {
  /** Mã tỉnh → số bài. Chỉ gồm địa điểm trong nước. */
  visits: Map<string, number>
  /** Số bài đã xác định là ở nước ngoài. */
  foreign: number
  /** Địa điểm chưa nhận ra được — giao diện hỏi người dùng một lần. */
  unresolved: Unresolved[]
  isLoading: boolean
}

/**
 * Gán mỗi bài có địa điểm về một tỉnh/thành, theo bốn nguồn xếp theo độ
 * tin cậy giảm dần:
 *
 *   1. `posts.province_code` — đã chốt từ trước, tin tuyệt đối
 *   2. `place_aliases` — người dùng đã tự trả lời cho đôi này
 *   3. khớp tên với danh sách 63 tỉnh
 *   4. toạ độ từ link Google Maps (chỉ khi nó không lấp lửng)
 *
 * Không nguồn nào ra kết quả thì bài đó vào `unresolved` — hỏi một lần,
 * lưu lại, lần sau tự nhận.
 */
export function usePlaceResolution(posts: Post[]): Resolution {
  const { couple } = useCouple()

  const aliasQuery = useQuery({
    queryKey: ['place_aliases', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_aliases')
        .select('alias, province_code, country')
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
    const visits = new Map<string, number>()
    const pending = new Map<string, Unresolved>()
    let foreign = 0

    for (const post of posts) {
      if (!post.place_name) continue
      const alias = normalizePlace(post.place_name)

      const known = aliases.get(alias)
      if (known) {
        if (known.province_code) {
          visits.set(
            known.province_code,
            (visits.get(known.province_code) ?? 0) + 1,
          )
        } else {
          foreign++
        }
        continue
      }

      const code =
        post.province_code ??
        guessProvince(post.place_name) ??
        provinceByCoords(post.place_lat, post.place_lng)

      if (code) {
        visits.set(code, (visits.get(code) ?? 0) + 1)
        continue
      }

      const row = pending.get(alias)
      if (row) row.count++
      else pending.set(alias, { placeName: post.place_name, alias, count: 1 })
    }

    return {
      visits,
      foreign,
      unresolved: [...pending.values()].sort((a, b) => b.count - a.count),
      isLoading: aliasQuery.isLoading,
    }
  }, [posts, aliases, aliasQuery.isLoading])
}
