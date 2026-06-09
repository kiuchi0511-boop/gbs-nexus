'use server'

import { revalidatePath } from 'next/cache'
import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase-server'
import { calcSummary } from '@/lib/calculations'
import type {
  DashboardData,
  EstimateListItem,
  EstimateStatusLog,
  EstimateWithItems,
  SaveEstimateInput,
  SaveEstimateItemInput,
} from '@/types/database'
import type { EstimateItem, EstimateStatus } from '@/types/estimate'

const STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: '下書き',
  submitted: '提出済',
  won: '受注',
  lost: '失注',
}

const STATUS_COLORS: Record<EstimateStatus, string> = {
  draft: '#9ca3af',
  submitted: '#3b82f6',
  won: '#22c55e',
  lost: '#ef4444',
}

type RawEstimateRow = {
  id: string
  estimate_no: string
  client_name: string
  job_name: string
  estimate_date: string
  updated_at: string
  status: EstimateStatus
  discount_amount: number
}

type RawEstimateItemRow = {
  id: string
  estimate_id: string
  section: EstimateItem['section']
  sub_category: string | null
  item_name: string
  specification: string | null
  quantity: number
  unit: string
  unit_price: number
  cost_price: number
  note: string | null
  is_active: boolean
  sort_order: number
}

function buildEstimateListItems(
  estimates: RawEstimateRow[],
  items: RawEstimateItemRow[]
): EstimateListItem[] {
  const itemsByEstimate = new Map<string, EstimateItem[]>()
  for (const row of items) {
    const list = itemsByEstimate.get(row.estimate_id) ?? []
    list.push({
      id: row.id,
      estimate_id: row.estimate_id,
      section: row.section,
      sub_category: row.sub_category,
      item_name: row.item_name,
      specification: row.specification,
      quantity: Number(row.quantity),
      unit: row.unit,
      unit_price: Number(row.unit_price),
      cost_price: Number(row.cost_price),
      note: row.note,
      is_active: row.is_active,
      sort_order: row.sort_order,
    })
    itemsByEstimate.set(row.estimate_id, list)
  }

  return estimates.map((e) => {
    const estimateItems = itemsByEstimate.get(e.id) ?? []
    const summary = calcSummary(estimateItems, Number(e.discount_amount))
    return {
      id: e.id,
      estimate_no: e.estimate_no,
      client_name: e.client_name,
      job_name: e.job_name,
      estimate_date: e.estimate_date,
      updated_at: e.updated_at,
      status: e.status,
      total: summary.total,
      profit_rate: summary.profit_rate,
    }
  })
}

async function fetchAllEstimateListItems(): Promise<EstimateListItem[]> {
  const supabase = await createClient()

  const { data: estimates, error } = await supabase
    .from('estimates')
    .select(
      'id, estimate_no, client_name, job_name, estimate_date, updated_at, status, discount_amount'
    )
    .is('deleted_at', null)
    .order('estimate_date', { ascending: false })

  if (error) {
    throw new Error(`見積一覧の取得に失敗しました: ${error.message}`)
  }

  if (!estimates?.length) return []

  const ids = estimates.map((e) => e.id)
  const { data: items, error: itemsError } = await supabase
    .from('estimate_items')
    .select('*')
    .in('estimate_id', ids)

  if (itemsError) {
    throw new Error(`見積明細の取得に失敗しました: ${itemsError.message}`)
  }

  return buildEstimateListItems(estimates as RawEstimateRow[], (items ?? []) as RawEstimateItemRow[])
}

export type SaveEstimateResult =
  | { success: true; id: string }
  | { success: false; error: string }

// 次の見積番号を採番する（YYYYMMDD + 連番3桁）
export async function generateNextEstimateNo(): Promise<string> {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyyMMdd')
  const prefix = `${today}`

  const { data, error } = await supabase
    .from('estimates')
    .select('estimate_no')
    .like('estimate_no', `${prefix}%`)
    .order('estimate_no', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`見積番号の採番に失敗しました: ${error.message}`)
  }

  const lastSeq = data?.[0]?.estimate_no
    ? parseInt(data[0].estimate_no.slice(8), 10)
    : 0
  const nextSeq = String(lastSeq + 1).padStart(3, '0')
  return `${prefix}${nextSeq}`
}

// 見積一覧を取得する（削除済みを除く）
export async function getEstimatesList(): Promise<EstimateListItem[]> {
  return fetchAllEstimateListItems()
}

// ダッシュボード用データを取得する
export async function getDashboardData(): Promise<DashboardData> {
  const estimates = await fetchAllEstimateListItems()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const monthEstimates = estimates.filter((e) =>
    isWithinInterval(parseISO(e.estimate_date), { start: monthStart, end: monthEnd })
  )

  const wonCount = estimates.filter((e) => e.status === 'won').length
  const totalCount = estimates.length

  const statusCounts = (['draft', 'submitted', 'won', 'lost'] as EstimateStatus[]).map(
    (status) => ({
      status,
      label: STATUS_LABELS[status],
      count: estimates.filter((e) => e.status === status).length,
      color: STATUS_COLORS[status],
    })
  )

  const recentEstimates = [...estimates]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return {
    stats: {
      totalCount,
      monthCount: monthEstimates.length,
      wonCount,
      wonRate: totalCount > 0 ? (wonCount / totalCount) * 100 : 0,
      monthTotal: monthEstimates.reduce((sum, e) => sum + e.total, 0),
      avgProfitRate:
        totalCount > 0
          ? estimates.reduce((sum, e) => sum + e.profit_rate, 0) / totalCount
          : 0,
    },
    recentEstimates,
    statusCounts,
  }
}

// ステータス変更履歴を取得する
export async function getEstimateStatusLogs(
  estimateId: string
): Promise<EstimateStatusLog[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('estimate_status_logs')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('changed_at', { ascending: false })

  if (error) {
    console.error('[getEstimateStatusLogs] error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    estimate_id: row.estimate_id,
    old_status: row.old_status as EstimateStatus | null,
    new_status: row.new_status as EstimateStatus,
    memo: row.memo,
    changed_at: row.changed_at,
  }))
}

// 見積ステータスを更新し履歴を記録する
export async function updateEstimateStatus(
  id: string,
  newStatus: EstimateStatus,
  memo?: string
): Promise<SaveEstimateResult> {
  try {
    const supabase = await createClient()

    const { data: current, error: fetchError } = await supabase
      .from('estimates')
      .select('status')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !current) {
      return { success: false, error: '見積書が見つかりません' }
    }

    const oldStatus = current.status as EstimateStatus

    if (oldStatus === newStatus) {
      return { success: true, id }
    }

    const { error: updateError } = await supabase
      .from('estimates')
      .update({ status: newStatus })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('[updateEstimateStatus] update error:', updateError)
      return {
        success: false,
        error: `ステータスの更新に失敗しました: ${updateError.message}`,
      }
    }

    const { error: logError } = await supabase.from('estimate_status_logs').insert({
      estimate_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      memo: memo?.trim() || null,
    })

    if (logError) {
      console.error('[updateEstimateStatus] log insert error:', logError)
      return {
        success: false,
        error: `ステータス履歴の記録に失敗しました: ${logError.message}`,
      }
    }

    revalidatePath('/estimates')
    revalidatePath(`/estimates/${id}`)
    revalidatePath('/dashboard')
    return { success: true, id }
  } catch (err) {
    console.error('[updateEstimateStatus] unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
    }
  }
}

// 見積書と明細を取得する
export async function getEstimateWithItems(id: string): Promise<EstimateWithItems | null> {
  const supabase = await createClient()

  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !estimate) return null

  const { data: items, error: itemsError } = await supabase
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', id)
    .order('section')
    .order('sort_order')

  if (itemsError) {
    throw new Error(`見積明細の取得に失敗しました: ${itemsError.message}`)
  }

  return {
    estimate: {
      ...estimate,
      discount_amount: Number(estimate.discount_amount),
      shade_area_m2: estimate.shade_area_m2 ? Number(estimate.shade_area_m2) : null,
      pillar_type: estimate.pillar_type,
    },
    items: (items ?? []).map((row) => ({
      id: row.id,
      estimate_id: row.estimate_id,
      section: row.section,
      sub_category: row.sub_category,
      item_name: row.item_name,
      specification: row.specification,
      quantity: Number(row.quantity),
      unit: row.unit,
      unit_price: Number(row.unit_price),
      cost_price: Number(row.cost_price),
      note: row.note,
      is_active: row.is_active,
      sort_order: row.sort_order,
      created_at: row.created_at,
    })),
  }
}

// 見積書を保存する
export async function saveEstimate(
  input: SaveEstimateInput,
  items: SaveEstimateItemInput[]
): Promise<SaveEstimateResult> {
  let estimateId: string | null = null

  try {
    const supabase = await createClient()

    // 項目名が空の明細は除外（DBの not null 制約対策）
    const validItems = items.filter((item) => item.item_name.trim() !== '')

    if (validItems.length === 0) {
      const message = '保存できる明細がありません（項目名が空の行があります）'
      console.error('[saveEstimate]', message)
      return { success: false, error: message }
    }

    const estimatePayload = {
      estimate_no: input.estimate_no,
      estimate_date: input.estimate_date,
      client_name: input.client_name,
      client_person: input.client_person || null,
      job_name: input.job_name,
      pattern: input.pattern || null,
      duration: input.duration || null,
      trade_method: input.trade_method || null,
      notes: input.notes || null,
      discount_amount: input.discount_amount,
      discount_reason: input.discount_reason || null,
      status: input.status,
    }

    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .insert(estimatePayload)
      .select('id')
      .single()

    if (estimateError || !estimate) {
      console.error('[saveEstimate] estimates insert error:', estimateError)
      return {
        success: false,
        error: `見積書の保存に失敗しました: ${estimateError?.message ?? '不明なエラー'}`,
      }
    }

    estimateId = estimate.id

    const itemRows = validItems.map((item) => ({
      estimate_id: estimate.id,
      section: item.section,
      sub_category: item.sub_category,
      item_name: item.item_name,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      note: item.note,
      is_active: item.is_active,
      sort_order: item.sort_order,
    }))

    const { error: itemsError } = await supabase.from('estimate_items').insert(itemRows)

    if (itemsError) {
      console.error('[saveEstimate] estimate_items insert error:', itemsError)
      await supabase.from('estimates').delete().eq('id', estimate.id)
      return {
        success: false,
        error: `見積明細の保存に失敗しました: ${itemsError.message}`,
      }
    }

    revalidatePath('/estimates')
    return { success: true, id: estimate.id }
  } catch (err) {
    console.error('[saveEstimate] unexpected error:', err)

    // ロールバック
    if (estimateId) {
      try {
        const supabase = await createClient()
        await supabase.from('estimates').delete().eq('id', estimateId)
      } catch (rollbackErr) {
        console.error('[saveEstimate] rollback error:', rollbackErr)
      }
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
    }
  }
}

// 見積書を更新する
export async function updateEstimate(
  id: string,
  input: SaveEstimateInput,
  items: SaveEstimateItemInput[]
): Promise<SaveEstimateResult> {
  try {
    const supabase = await createClient()

    const validItems = items.filter((item) => item.item_name.trim() !== '')

    if (validItems.length === 0) {
      const message = '保存できる明細がありません（項目名が空の行があります）'
      console.error('[updateEstimate]', message)
      return { success: false, error: message }
    }

    const estimatePayload = {
      estimate_no: input.estimate_no,
      estimate_date: input.estimate_date,
      client_name: input.client_name,
      client_person: input.client_person || null,
      job_name: input.job_name,
      pattern: input.pattern || null,
      duration: input.duration || null,
      trade_method: input.trade_method || null,
      notes: input.notes || null,
      discount_amount: input.discount_amount,
      discount_reason: input.discount_reason || null,
      status: input.status,
    }

    const { error: estimateError } = await supabase
      .from('estimates')
      .update(estimatePayload)
      .eq('id', id)
      .is('deleted_at', null)

    if (estimateError) {
      console.error('[updateEstimate] estimates update error:', estimateError)
      return {
        success: false,
        error: `見積書の更新に失敗しました: ${estimateError.message}`,
      }
    }

    const { error: deleteError } = await supabase
      .from('estimate_items')
      .delete()
      .eq('estimate_id', id)

    if (deleteError) {
      console.error('[updateEstimate] estimate_items delete error:', deleteError)
      return {
        success: false,
        error: `見積明細の削除に失敗しました: ${deleteError.message}`,
      }
    }

    const itemRows = validItems.map((item) => ({
      estimate_id: id,
      section: item.section,
      sub_category: item.sub_category,
      item_name: item.item_name,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      note: item.note,
      is_active: item.is_active,
      sort_order: item.sort_order,
    }))

    const { error: itemsError } = await supabase.from('estimate_items').insert(itemRows)

    if (itemsError) {
      console.error('[updateEstimate] estimate_items insert error:', itemsError)
      return {
        success: false,
        error: `見積明細の保存に失敗しました: ${itemsError.message}`,
      }
    }

    revalidatePath('/estimates')
    revalidatePath(`/estimates/${id}`)
    return { success: true, id }
  } catch (err) {
    console.error('[updateEstimate] unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
    }
  }
}

// 見積書を論理削除する
export async function deleteEstimate(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('estimates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      console.error('[deleteEstimate] error:', error)
      return { success: false, error: `削除に失敗しました: ${error.message}` }
    }

    revalidatePath('/estimates')
    return { success: true }
  } catch (err) {
    console.error('[deleteEstimate] unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
    }
  }
}
