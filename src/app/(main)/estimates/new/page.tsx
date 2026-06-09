'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { generateNextEstimateNo, saveEstimate } from '@/actions/estimates'
import { getItemMaster } from '@/actions/items'
import EstimateForm, {
  estimateFormSchema,
  type EstimateFormValues,
} from '@/components/estimates/EstimateForm'
import EstimateItemsTable from '@/components/estimates/EstimateItemsTable'
import ProfitSummary from '@/components/estimates/ProfitSummary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FormEstimateItem, EstimateStatus } from '@/types/estimate'

export default function NewEstimatePage() {
  const router = useRouter()
  const [items, setItems] = useState<FormEstimateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      client_name: '',
      client_person: '',
      job_name: '',
      estimate_no: '',
      estimate_date: format(new Date(), 'yyyy-MM-dd'),
      pattern: '',
      duration: '',
      trade_method: '',
      discount_amount: 0,
      discount_reason: '',
      notes: '',
    },
  })

  const discount = form.watch('discount_amount') || 0

  useEffect(() => {
    async function init() {
      try {
        const [master, estimateNo] = await Promise.all([
          getItemMaster(true),
          generateNextEstimateNo(),
        ])
        setItems(
          master.map((m) => ({
            id: crypto.randomUUID(),
            section: m.section,
            sub_category: m.sub_category,
            item_name: m.item_name,
            specification: m.specification,
            quantity: 1,
            unit: m.unit,
            unit_price: m.default_price,
            cost_price: m.default_cost,
            note: m.note_template,
            is_active: true,
            sort_order: m.sort_order,
          }))
        )
        form.setValue('estimate_no', estimateNo)
      } catch (err) {
        console.error('[NewEstimatePage] init error:', err)
        toast.error('初期データの読み込みに失敗しました', {
          description: err instanceof Error ? err.message : '不明なエラー',
        })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [form])

  const handleSave = async (status: EstimateStatus) => {
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
      const result = await saveEstimate(
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
        console.error('[NewEstimatePage] save failed:', result.error)
        setSaveError(result.error)
        return
      }

      // redirect() は Server Action 内の try-catch と相性が悪いため、クライアント側で遷移する
      router.push(`/estimates/${result.id}`)
      router.refresh()
    } catch (err) {
      console.error('[NewEstimatePage] save unexpected error:', err)
      setSaveError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">新規見積作成</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => handleSave('draft')}
          >
            {saving ? '保存中...' : '下書き保存'}
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => handleSave('submitted')}
          >
            {saving ? '保存中...' : '提出済みとして保存'}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <EstimateForm form={form} />
      <EstimateItemsTable items={items} onChange={setItems} />
      <ProfitSummary items={items} discount={discount} />
    </div>
  )
}
