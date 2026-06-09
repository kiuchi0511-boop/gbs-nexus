'use client'

import { calcSummary, formatJPY, formatRate, profitRateColor } from '@/lib/calculations'
import { SECTION_NAMES, type FormEstimateItem, type SectionType } from '@/types/estimate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const SECTIONS = [1, 2, 3, 4] as SectionType[]

type Props = {
  items: FormEstimateItem[]
  discount: number
}

export default function ProfitSummary({ items, discount }: Props) {
  const summary = calcSummary(
    items.map((item) => ({ ...item, estimate_id: '' })),
    discount
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>利益率サマリー</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1行目：請求金額・税抜・消費税 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div title="お客様への最終請求額（税込）">
            <p className="text-sm text-muted-foreground">請求金額（税込）</p>
            <p className="mt-1 text-3xl font-bold text-primary">
              ¥{formatJPY(summary.total_with_tax)}
            </p>
          </div>
          <SummaryItem label="税抜合計" value={`¥${formatJPY(summary.total)}`} />
          <SummaryItem label="消費税" value={`¥${formatJPY(summary.tax)}`} />
        </div>

        {/* 2行目：値引き・コスト・粗利益・利益率 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem
            label="値引き"
            value={`¥${formatJPY(summary.discount)}`}
            valueClassName="text-red-600"
          />
          <SummaryItem
            label="発注コスト"
            value={`¥${formatJPY(summary.cost_total)}`}
            valueClassName="text-muted-foreground"
          />
          <div title="税抜合計から発注コストを引いた利益">
            <p className="text-sm text-muted-foreground">粗利益</p>
            <p className="mt-1 text-lg font-semibold text-green-600">
              ¥{formatJPY(summary.profit)}
            </p>
          </div>
          <div title="粗利益 ÷ 税抜合計">
            <p className="text-sm text-muted-foreground">利益率</p>
            <p
              className={cn(
                'mt-1 inline-block rounded px-2 py-1 text-xl font-bold',
                profitRateColor(summary.profit_rate)
              )}
            >
              {formatRate(summary.profit_rate)}
            </p>
          </div>
        </div>

        {/* 工事区分別利益率 */}
        <div className="space-y-3">
          <p className="text-sm font-medium">工事区分別利益率</p>
          {SECTIONS.map((section) => {
            const sec = summary.by_section[section]
            const barWidth = Math.min(Math.max(sec.profit_rate, 0), 100)
            return (
              <div key={section} className="space-y-1">
                <p className="text-sm">
                  {SECTION_NAMES[section]}{' '}
                  <span
                    className={cn(
                      'font-medium',
                      sec.profit_rate >= 18
                        ? 'text-green-600'
                        : sec.profit_rate >= 12
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    )}
                  >
                    {formatRate(sec.profit_rate)}
                  </span>
                  （¥{formatJPY(sec.subtotal)}）← 見積金額
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      sec.profit_rate >= 18
                        ? 'bg-green-500'
                        : sec.profit_rate >= 12
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryItem({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-lg font-semibold', valueClassName)}>{value}</p>
    </div>
  )
}
