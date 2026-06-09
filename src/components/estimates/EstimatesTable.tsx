'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteEstimate } from '@/actions/estimates'
import { formatJPY } from '@/lib/calculations'
import type { EstimateListItem } from '@/types/database'
import type { EstimateStatus } from '@/types/estimate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

type StatusFilter = 'all' | EstimateStatus

type Props = {
  estimates: EstimateListItem[]
}

export default function EstimatesTable({ estimates: initialEstimates }: Props) {
  const router = useRouter()
  const [estimates, setEstimates] = useState(initialEstimates)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<EstimateListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setEstimates(initialEstimates)
  }, [initialEstimates])

  const filteredEstimates = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return estimates.filter((estimate) => {
      if (statusFilter !== 'all' && estimate.status !== statusFilter) {
        return false
      }

      if (query) {
        const matchesClient = estimate.client_name.toLowerCase().includes(query)
        const matchesJob = estimate.job_name.toLowerCase().includes(query)
        if (!matchesClient && !matchesJob) return false
      }

      const estimateDate = startOfDay(parseISO(estimate.estimate_date))

      if (dateFrom) {
        const from = startOfDay(parseISO(dateFrom))
        if (isBefore(estimateDate, from)) return false
      }

      if (dateTo) {
        const to = startOfDay(parseISO(dateTo))
        if (isAfter(estimateDate, to)) return false
      }

      return true
    })
  }, [estimates, searchText, statusFilter, dateFrom, dateTo])

  const hasFilters = searchText !== '' || statusFilter !== 'all' || dateFrom !== '' || dateTo !== ''

  const clearFilters = () => {
    setSearchText('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const result = await deleteEstimate(deleteTarget.id)
      if (!result.success) {
        toast.error('削除に失敗しました', { description: result.error })
        return
      }

      setEstimates((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success('見積書を削除しました')
      router.refresh()
    } catch (err) {
      toast.error('削除に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">見積書一覧</h1>
          <p className="text-sm text-muted-foreground">
            {filteredEstimates.length}件
            {hasFilters && ` / 全${estimates.length}件`}
          </p>
        </div>
        <Button render={<Link href="/estimates/new" />}>
          <Plus className="size-4" />
          新規作成
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search">顧客名・工事名で検索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="キーワードを入力..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>見積日（開始）</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>見積日（終了）</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="size-4" />
              クリア
            </Button>
          )}
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">全て</TabsTrigger>
            <TabsTrigger value="draft">下書き</TabsTrigger>
            <TabsTrigger value="submitted">提出済</TabsTrigger>
            <TabsTrigger value="won">受注</TabsTrigger>
            <TabsTrigger value="lost">失注</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>見積番号</TableHead>
              <TableHead>顧客名</TableHead>
              <TableHead>工事名</TableHead>
              <TableHead className="text-right">税抜合計</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>見積日</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEstimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {hasFilters ? '条件に一致する見積書がありません' : '見積書がありません'}
                </TableCell>
              </TableRow>
            ) : (
              filteredEstimates.map((estimate) => (
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(estimate)
                      }}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>見積書の削除</DialogTitle>
            <DialogDescription>
              本当に削除しますか？
              {deleteTarget && (
                <span className="mt-1 block font-medium text-foreground">
                  {deleteTarget.estimate_no} — {deleteTarget.job_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '削除中...' : '削除する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
