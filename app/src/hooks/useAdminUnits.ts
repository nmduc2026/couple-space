import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { PREVIEW } from '../dev/preview'
import {
  provincesOnly,
  type AdminUnit,
} from '../lib/adminUnits'
import { previewAdminUnits } from '../dev/previewAdminUnits'

const SELECT =
  'id, code, name, level, kind, parent_id, zone, merged_from, lat, lng, sort_order'

async function fetchProvinces(): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from('admin_units')
    .select(SELECT)
    .eq('level', 'province')
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as AdminUnit[]
}

async function fetchCommunes(provinceId: string): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from('admin_units')
    .select(SELECT)
    .eq('level', 'commune')
    .eq('parent_id', provinceId)
    .order('name')
  if (error) throw error
  return (data ?? []) as AdminUnit[]
}

/** Load toàn bộ tỉnh (34). */
export function useProvinces() {
  return useQuery({
    queryKey: ['admin_units', 'province'],
    queryFn: async () => {
      if (PREVIEW) return provincesOnly(previewAdminUnits())
      return fetchProvinces()
    },
    staleTime: 60 * 60 * 1000,
  })
}

/** Load xã của một tỉnh (lazy). */
export function useCommunes(provinceId: string | null | undefined) {
  return useQuery({
    queryKey: ['admin_units', 'commune', provinceId],
    enabled: !!provinceId,
    queryFn: async () => {
      if (PREVIEW) {
        return previewAdminUnits().filter(
          (u) => u.level === 'commune' && u.parent_id === provinceId,
        )
      }
      return fetchCommunes(provinceId!)
    },
    staleTime: 60 * 60 * 1000,
  })
}

/** Tỉnh + (tuỳ chọn) xã đang chọn — gộp một list để guess/resolve. */
export function useAdminUnits(opts?: { communeParentId?: string | null }) {
  const provinces = useProvinces()
  const communes = useCommunes(opts?.communeParentId)

  const units = useMemo(() => {
    const list = [...(provinces.data ?? [])]
    if (communes.data) list.push(...communes.data)
    return list
  }, [provinces.data, communes.data])

  return {
    units,
    provinces: provinces.data ?? [],
    communes: communes.data ?? [],
    isLoading: provinces.isLoading || (!!opts?.communeParentId && communes.isLoading),
    error: provinces.error ?? communes.error,
  }
}
