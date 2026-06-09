'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updatePriceMaster } from '@/actions/prices'
import { formatJPY } from '@/lib/calculations'
import { PILLAR_TYPE_NAMES, type PillarType } from '@/types/estimate'
import type { PriceMaster } from '@/types/database'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  initialData: PriceMaster[]
}

function formatAreaLabel(areaMax: number | null): string {
  if (areaMax == null) return '—'
  return `〜${areaMax}㎡`
}

function formatPriceDisplay(low: number, high: number | null): string {
  if (high != null && high !== low) {
    return `${formatJPY(low)}〜${formatJPY(high)}`
  }
  return formatJPY(low)
}

export default function PriceMasterTable({ initialData }: Props) {
  const [rows, setRows] = useState(initialData)
  const [, startTransition] = useTransition()

  const saveField = (
    id: number,
    field: 'unit_price_low' | 'unit_price_high',
    value: number | null
  ) => {
    const prev = rows.find((r) => r.id === id)
    if (!prev) return

    const updated = { ...prev, [field]: value }
    setRows((current) => current.map((r) => (r.id === id ? updated : r)))

    startTransition(async () => {
      try {
        await updatePriceMaster(id, { [field]: value })
        toast.success('保存しました')
      } catch (err) {
        setRows((current) =>
          current.map((r) => (r.id === id ? prev : r))
        )
        toast.error('保存に失敗しました', {
          description: err instanceof Error ? err.message : undefined,
        })
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>支柱配置タイプ</TableHead>
            <TableHead>面積区分</TableHead>
            <TableHead>単価（下限）</TableHead>
            <TableHead>単価（上限）</TableHead>
            <TableHead>表示単価</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {PILLAR_TYPE_NAMES[row.pillar_type as PillarType]}
              </TableCell>
              <TableCell>{formatAreaLabel(row.area_max_m2)}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-32"
                  defaultValue={row.unit_price_low}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    if (val !== row.unit_price_low) {
                      saveField(row.id, 'unit_price_low', val)
                    }
                  }}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-32"
                  defaultValue={row.unit_price_high ?? ''}
                  placeholder="—"
                  onBlur={(e) => {
                    const val = e.target.value === '' ? null : parseFloat(e.target.value) || 0
                    if (val !== row.unit_price_high) {
                      saveField(row.id, 'unit_price_high', val)
                    }
                  }}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatPriceDisplay(row.unit_price_low, row.unit_price_high)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
