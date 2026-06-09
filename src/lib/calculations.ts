import type { EstimateItem, EstimateItemWithCalc, EstimateSummary, SectionType } from '@/types/estimate'

// 明細行に計算値を付与する
export function calcItem(item: EstimateItem): EstimateItemWithCalc {
  const amount = Math.round(item.quantity * item.unit_price)
  const cost_amount = Math.round(item.quantity * item.cost_price)
  const profit_amount = amount - cost_amount
  const profit_rate = amount > 0 ? (profit_amount / amount) * 100 : 0
  return { ...item, amount, cost_amount, profit_amount, profit_rate }
}

// 見積書全体のサマリーを計算する
export function calcSummary(
  items: EstimateItem[],
  discount: number
): EstimateSummary {
  const activeItems = items.filter((i) => i.is_active).map(calcItem)

  const subtotal = activeItems.reduce((sum, i) => sum + i.amount, 0)
  const cost_total = activeItems.reduce((sum, i) => sum + i.cost_amount, 0)
  const total = subtotal - discount
  const tax = Math.round(total * 0.1)
  const total_with_tax = total + tax
  const profit = total - cost_total
  const profit_rate = total > 0 ? (profit / total) * 100 : 0

  const sections = [1, 2, 3, 4] as SectionType[]
  const by_section = Object.fromEntries(
    sections.map((sec) => {
      const secItems = activeItems.filter((i) => i.section === sec)
      const st = secItems.reduce((s, i) => s + i.amount, 0)
      const ct = secItems.reduce((s, i) => s + i.cost_amount, 0)
      const pr = st - ct
      const prRate = st > 0 ? (pr / st) * 100 : 0
      return [sec, { subtotal: st, cost_total: ct, profit: pr, profit_rate: prRate }]
    })
  ) as EstimateSummary['by_section']

  return { subtotal, discount, total, tax, total_with_tax, cost_total, profit, profit_rate, by_section }
}

// 利益率のカラークラスを返す（Tailwind）
export function profitRateColor(rate: number): string {
  if (rate >= 18) return 'text-green-600 bg-green-50'
  if (rate >= 12) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

// 金額フォーマット（日本円）
export function formatJPY(amount: number): string {
  return Math.round(amount).toLocaleString('ja-JP')
}

// 利益率フォーマット
export function formatRate(rate: number): string {
  return rate.toFixed(1) + '%'
}
