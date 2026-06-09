'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { StatusCount } from '@/types/database'

type Props = {
  data: StatusCount[]
}

function renderLegendText(value: string, entry: { color?: string }) {
  const item = entry as { payload?: StatusCount }
  const count = item.payload?.count ?? 0
  if (count === 0) return null
  return (
    <span style={{ color: entry.color }}>
      {value}: {count}件
    </span>
  )
}

export default function DashboardStatusChart({ data }: Props) {
  const chartData = data.filter((d) => d.count > 0)
  const hasData = chartData.length > 0

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        データがありません
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="42%"
            innerRadius={0}
            outerRadius={72}
            label={false}
          >
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [`${value}件`, name]} />
          <Legend
            verticalAlign="bottom"
            formatter={renderLegendText}
            wrapperStyle={{ paddingTop: '16px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => [`${value}件`, '件数']} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
