'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { ItemMaster } from '@/types/database'

// 工事項目マスタを取得する
export async function getItemMaster(activeOnly = false): Promise<ItemMaster[]> {
  const supabase = await createClient()
  let query = supabase.from('item_master').select('*')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query.order('section').order('sort_order')

  if (error) {
    throw new Error(`工事項目マスタの取得に失敗しました: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    ...row,
    default_price: Number(row.default_price),
    default_cost: Number(row.default_cost),
  }))
}

// 工事項目マスタを更新する
export async function updateItemMaster(
  id: string,
  fields: Partial<
    Pick<
      ItemMaster,
      'item_name' | 'unit' | 'default_price' | 'default_cost' | 'is_active' | 'sort_order'
    >
  >
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('item_master').update(fields).eq('id', id)

  if (error) {
    throw new Error(`工事項目マスタの更新に失敗しました: ${error.message}`)
  }

  revalidatePath('/master/items')
}

// 工事項目マスタを追加する
export async function createItemMaster(
  section: ItemMaster['section']
): Promise<ItemMaster> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('item_master')
    .select('sort_order')
    .eq('section', section)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = (existing?.[0]?.sort_order ?? 0) + 10

  const { data, error } = await supabase
    .from('item_master')
    .insert({
      section,
      item_name: '新規項目',
      unit: '式',
      default_price: 0,
      default_cost: 0,
      is_active: true,
      sort_order: nextSort,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`工事項目マスタの追加に失敗しました: ${error?.message}`)
  }

  revalidatePath('/master/items')
  return {
    ...data,
    default_price: Number(data.default_price),
    default_cost: Number(data.default_cost),
  }
}

// 工事項目マスタを削除する
export async function deleteItemMaster(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('item_master').delete().eq('id', id)

  if (error) {
    throw new Error(`工事項目マスタの削除に失敗しました: ${error.message}`)
  }

  revalidatePath('/master/items')
}
