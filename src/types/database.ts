import type { Estimate, EstimateItem, EstimateStatus, PillarType } from '@/types/estimate'

export type PriceMaster = {
  id: number
  pillar_type: PillarType
  area_max_m2: number | null
  unit_price_low: number
  unit_price_high: number | null
  updated_at: string
}

export type ItemMaster = {
  id: string
  section: 1 | 2 | 3 | 4
  sub_category: string | null
  item_name: string
  specification: string | null
  unit: string
  default_price: number
  default_cost: number
  note_template: string | null
  is_active: boolean
  sort_order: number
}

export type EstimateRow = Estimate & {
  deleted_at: string | null
}

export type EstimateItemRow = EstimateItem & {
  created_at: string
}

export type EstimateWithItems = {
  estimate: EstimateRow
  items: EstimateItemRow[]
}

export type EstimateListItem = {
  id: string
  estimate_no: string
  client_name: string
  job_name: string
  estimate_date: string
  updated_at: string
  status: EstimateStatus
  total: number
  profit_rate: number
}

export type EstimateImage = {
  id: string
  estimate_id: string
  image_url: string
  prompt: string | null
  generation_type: string
  width_m: number | null
  length_m: number | null
  count: number | null
  pillar_type: number | null
  color: string | null
  created_at: string
}

export type SaveEstimateImageInput = {
  estimate_id: string
  /** Supabase Storage 等の公開URL（base64は不可） */
  imageUrl: string
  prompt?: string
  generation_type?: string
  width_m?: number
  length_m?: number
  count?: number
  pillar_type?: number
  color?: string
}

export type EstimateStatusLog = {
  id: string
  estimate_id: string
  old_status: EstimateStatus | null
  new_status: EstimateStatus
  memo: string | null
  changed_at: string
}

export type DashboardStats = {
  totalCount: number
  monthCount: number
  wonCount: number
  wonRate: number
  monthTotal: number
  avgProfitRate: number
}

export type StatusCount = {
  status: EstimateStatus
  label: string
  count: number
  color: string
}

export type DashboardData = {
  stats: DashboardStats
  recentEstimates: EstimateListItem[]
  statusCounts: StatusCount[]
}

export type SaveEstimateInput = {
  client_name: string
  client_person?: string
  job_name: string
  estimate_no: string
  estimate_date: string
  pattern?: string
  duration?: string
  trade_method?: string
  discount_amount: number
  discount_reason?: string
  notes?: string
  status: EstimateStatus
}

export type CompanySettings = {
  id: number
  company_name: string
  department: string | null
  representative: string | null
  postal_code: string | null
  address: string | null
  tel: string | null
  fax: string | null
  email: string | null
  logo_text: string | null
  updated_at: string
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 1,
  company_name: '株式会社児山製作所',
  department: 'オリジナルプロダクトアンドセールス事業部',
  representative: '代表取締役　児山　司',
  postal_code: '〒491-0005',
  address: '愛知県一宮市明地字井之内3-3',
  tel: '0586-52-6108',
  fax: '0586-69-5081',
  email: 'info@musee.world',
  logo_text: 'G.B.S',
  updated_at: new Date().toISOString(),
}

export type SaveEstimateItemInput = {
  id: string
  section: 1 | 2 | 3 | 4
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
