'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowRight,
  Calendar,
  FileText,
  Percent,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react'
import DashboardStatusChart from '@/components/dashboard/DashboardStatusChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatJPY, formatRate } from '@/lib/calculations'
import type { DashboardData } from '@/types/database'
import type { EstimateStatus } from '@/types/estimate'

const STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: '下書き',
  submitted: '提出済',
  won: '受注',
  lost: '失注',
}

const STATUS_STYLES: Record<EstimateStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

type Props = {
  data: DashboardData
}

export default function DashboardView({ data }: Props) {
  const router = useRouter()
  const { stats, recentEstimates, statusCounts } = data

  const cards = [
    {
      title: '見積書総数',
      value: `${stats.totalCount}件`,
      icon: FileText,
      description: '削除済みを除く全件',
    },
    {
      title: '今月作成数',
      value: `${stats.monthCount}件`,
      icon: Calendar,
      description: '今月の見積日ベース',
    },
    {
      title: '受注件数・受注率',
      value: `${stats.wonCount}件`,
      subValue: formatRate(stats.wonRate),
      icon: Trophy,
      description: '受注 / 全件',
    },
    {
      title: '今月の見積総額',
      value: `¥${formatJPY(stats.monthTotal)}`,
      icon: Wallet,
      description: '税抜合計の合計',
    },
    {
      title: '平均利益率',
      value: formatRate(stats.avgProfitRate),
      icon: TrendingUp,
      description: '全見積の平均',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ground BIG Shade 見積管理システム
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.subValue && (
                <div className="text-lg font-semibold text-primary">{card.subValue}</div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最近の見積書</CardTitle>
          <Button variant="outline" size="sm" render={<Link href="/estimates" />}>
            すべて見る
            <ArrowRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>見積番号</TableHead>
                <TableHead>顧客名</TableHead>
                <TableHead>工事名</TableHead>
                <TableHead className="text-right">税抜合計</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>見積日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEstimates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    見積書がありません
                  </TableCell>
                </TableRow>
              ) : (
                recentEstimates.map((estimate) => (
                  <TableRow
                    key={estimate.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/estimates/${estimate.id}`)}
                  >
                    <TableCell className="font-medium">{estimate.estimate_no}</TableCell>
                    <TableCell>{estimate.client_name}</TableCell>
                    <TableCell>{estimate.job_name}</TableCell>
                    <TableCell className="text-right">¥{formatJPY(estimate.total)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[estimate.status]}>
                        {STATUS_LABELS[estimate.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(estimate.estimate_date), 'yyyy/MM/dd')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="size-4" />
            ステータス別件数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardStatusChart data={statusCounts} />
        </CardContent>
      </Card>
    </div>
  )
}
