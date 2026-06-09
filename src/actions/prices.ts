'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { PriceMaster } from '@/types/database'

// 単価マスタを取得する
export async function getPriceMaster(): Promise<PriceMaster[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('price_master')
    .select('*')
    .order('pillar_type')
    .order('area_max_m2')

  if (error) {
    throw new Error(`単価マスタの取得に失敗しました: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    pillar_type: row.pillar_type,
    area_max_m2: row.area_max_m2,
    unit_price_low: Number(row.unit_price_low),
    unit_price_high: row.unit_price_high != null ? Number(row.unit_price_high) : null,
    updated_at: row.updated_at,
  }))
}

// 単価マスタを更新する
export async function updatePriceMaster(
  id: number,
  fields: Partial<Pick<PriceMaster, 'unit_price_low' | 'unit_price_high'>>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('price_master')
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(`単価マスタの更新に失敗しました: ${error.message}`)
  }

  revalidatePath('/master/prices')
}
