// 見積書ステータス
export type EstimateStatus = 'draft' | 'submitted' | 'won' | 'lost'

// 工事区分
export type SectionType = 1 | 2 | 3 | 4
export const SECTION_NAMES: Record<SectionType, string> = {
  1: '基礎工事',
  2: '鉄骨工事',
  3: 'シェード工事',
  4: '諸経費',
}

// 支柱配置タイプ
export type PillarType = 1 | 2 | 3
export const PILLAR_TYPE_NAMES: Record<PillarType, string> = {
  1: '①両端支柱（鉄骨×鉄骨）',
  2: '②片端支柱＋片端既存躯体',
  3: '③両端既存躯体利用',
}

// 見積書ヘッダー
export type Estimate = {
  id: string
  estimate_no: string
  estimate_date: string
  client_name: string
  client_person: string | null
  job_name: string
  pattern: string | null
  shade_area_m2: number | null
  pillar_type: PillarType | null
  duration: string | null
  trade_method: string | null
  notes: string | null
  discount_amount: number
  discount_reason: string | null
  status: EstimateStatus
  created_at: string
  updated_at: string
}

// 見積書明細行
export type EstimateItem = {
  id: string
  estimate_id: string
  section: SectionType
  sub_category: string | null
  item_name: string
  specification: string | null
  quantity: number
  unit: string
  unit_price: number      // 見積単価
  cost_price: number      // 発注単価
  note: string | null
  is_active: boolean
  sort_order: number
}

// 計算済み明細行（フロントエンド用）
export type EstimateItemWithCalc = EstimateItem & {
  amount: number           // 見積金額 = quantity × unit_price
  cost_amount: number      // 発注金額 = quantity × cost_price
  profit_amount: number    // 粗利益 = amount - cost_amount
  profit_rate: number      // 利益率(%) = profit_amount / amount × 100
}

// フォーム用明細行（保存前）
export type FormEstimateItem = {
  id: string
  section: SectionType
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

// 見積書サマリー
export type EstimateSummary = {
  subtotal: number         // 税抜小計
  discount: number         // 値引き
  total: number            // 税抜合計
  tax: number              // 消費税
  total_with_tax: number   // 税込合計
  cost_total: number       // 発注合計
  profit: number           // 粗利益
  profit_rate: number      // 総利益率(%)
  by_section: Record<SectionType, {
    subtotal: number
    cost_total: number
    profit: number
    profit_rate: number
  }>
}
