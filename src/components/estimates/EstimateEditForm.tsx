'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { updateEstimate, updateEstimateStatus } from '@/actions/estimates'
import EstimateForm, {
  estimateFormSchema,
  type EstimateFormValues,
} from '@/components/estimates/EstimateForm'
import EstimateItemsTable from '@/components/estimates/EstimateItemsTable'
import ProfitSummary from '@/components/estimates/ProfitSummary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { EstimateStatusLog, EstimateWithItems } from '@/types/database'
import type { EstimateStatus, FormEstimateItem } from '@/types/estimate'
import { cn } from '@/lib/utils'

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
  initialData: EstimateWithItems
  initialStatusLogs: EstimateStatusLog[]
}

export default function EstimateEditForm({ initialData, initialStatusLogs }: Props) {
  const router = useRouter()
  const { estimate } = initialData

  const [items, setItems] = useState<FormEstimateItem[]>(
    initialData.items.map((item) => ({
      id: item.id,
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
  )
  const [status, setStatus] = useState<EstimateStatus>(estimate.status)
  const [statusLogs, setStatusLogs] = useState<EstimateStatusLog[]>(initialStatusLogs)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<EstimateStatus | null>(null)
  const [statusMemo, setStatusMemo] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      client_name: estimate.client_name,
      client_person: estimate.client_person ?? '',
      job_name: estimate.job_name,
      estimate_no: estimate.estimate_no,
      estimate_date: estimate.estimate_date,
      pattern: estimate.pattern ?? '',
      duration: estimate.duration ?? '',
      trade_method: estimate.trade_method ?? '',
      discount_amount: estimate.discount_amount,
      discount_reason: estimate.discount_reason ?? '',
      notes: estimate.notes ?? '',
    },
  })

  const discount = form.watch('discount_amount') || 0

  useEffect(() => {
    setStatus(initialData.estimate.status)
  }, [initialData.estimate.status])

  useEffect(() => {
    setStatusLogs(initialStatusLogs)
  }, [initialStatusLogs])

  const openStatusDialog = (newStatus: EstimateStatus) => {
    if (newStatus === status) return
    setPendingStatus(newStatus)
    setStatusMemo('')
    setStatusDialogOpen(true)
  }

  const handleStatusConfirm = async () => {
    if (!pendingStatus) return

    setStatusUpdating(true)
    try {
      const result = await updateEstimateStatus(estimate.id, pendingStatus, statusMemo)
      if (!result.success) {
        toast.error('ステータスの更新に失敗しました', { description: result.error })
        return
      }

      setStatus(pendingStatus)
      setStatusDialogOpen(false)
      setPendingStatus(null)
      setStatusMemo('')
      toast.success('ステータスを更新しました')
      router.refresh()
    } catch (err) {
      toast.error('ステータスの更新に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSave = async () => {
    setSaveError('')

    const isValid = await form.trigger()
    if (!isValid) {
      setSaveError('入力内容にエラーがあります。必須項目を確認してください。')
      return
    }

    const values = form.getValues()

    if (items.length === 0) {
      setSaveError('明細が1件以上必要です')
      return
    }

    const itemPayload = items.map((item) => ({
      id: item.id,
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

    setSaving(true)

    try {
      const result = await updateEstimate(
        estimate.id,
        {
          client_name: values.client_name,
          client_person: values.client_person,
          job_name: values.job_name,
          estimate_no: values.estimate_no,
          estimate_date: values.estimate_date,
          pattern: values.pattern,
          duration: values.duration,
          trade_method: values.trade_method,
          discount_amount: values.discount_amount,
          discount_reason: values.discount_reason,
          notes: values.notes,
          status,
        },
        itemPayload
      )

      if (!result.success) {
        setSaveError(result.error)
        return
      }

      toast.success('見積書を更新しました')
      router.refresh()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">見積書編集</h1>
          <p className="text-sm text-muted-foreground">
            見積番号: {estimate.estimate_no}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href={`/estimates/${estimate.id}/pdf`} />}>
            <FileText className="size-4" />
            PDFプレビュー
          </Button>
          <Button type="button" disabled={saving} onClick={handleSave}>
            {saving ? '保存中...' : '更新保存'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">ステータス:</span>
        {(['draft', 'submitted', 'won', 'lost'] as EstimateStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => openStatusDialog(s)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-opacity',
              STATUS_STYLES[s],
              status === s ? 'ring-2 ring-primary ring-offset-1' : 'opacity-60 hover:opacity-100'
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
        <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <EstimateForm form={form} />
      <EstimateItemsTable items={items} onChange={setItems} />
      <ProfitSummary items={items} discount={discount} />

      <Card>
        <CardHeader>
          <CardTitle>ステータス変更履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">変更履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {statusLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">
                      {format(new Date(log.changed_at), 'yyyy/MM/dd HH:mm')}
                    </span>
                    <span className="font-medium">
                      {log.old_status ? STATUS_LABELS[log.old_status] : '—'}
                      {' → '}
                      {STATUS_LABELS[log.new_status]}
                    </span>
                  </div>
                  {log.memo && (
                    <p className="mt-1 text-muted-foreground">{log.memo}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ステータス変更</DialogTitle>
            <DialogDescription>
              {pendingStatus && (
                <>
                  「{STATUS_LABELS[status]}」から「{STATUS_LABELS[pendingStatus]}」に変更します。
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="status-memo" className="text-sm font-medium">
              変更理由・メモ（任意）
            </label>
            <Textarea
              id="status-memo"
              value={statusMemo}
              onChange={(e) => setStatusMemo(e.target.value)}
              placeholder="変更理由を入力..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={statusUpdating}
            >
              キャンセル
            </Button>
            <Button onClick={handleStatusConfirm} disabled={statusUpdating}>
              {statusUpdating ? '更新中...' : '確定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
