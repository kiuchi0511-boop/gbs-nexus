'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import {
  createItemMaster,
  deleteItemMaster,
  updateItemMaster,
} from '@/actions/items'
import { formatRate, profitRateColor } from '@/lib/calculations'
import { SECTION_NAMES, type SectionType } from '@/types/estimate'
import type { ItemMaster } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const SECTIONS = [1, 2, 3, 4] as SectionType[]

type Props = {
  initialData: ItemMaster[]
}

function calcProfitRate(price: number, cost: number): number {
  if (price <= 0) return 0
  return ((price - cost) / price) * 100
}

export default function ItemMasterTable({ initialData }: Props) {
  const [rows, setRows] = useState(initialData)
  const [activeTab, setActiveTab] = useState<string>('1')
  const [isPending, startTransition] = useTransition()

  const sectionRows = (section: SectionType) =>
    rows.filter((r) => r.section === section).sort((a, b) => a.sort_order - b.sort_order)

  const saveField = <K extends keyof ItemMaster>(
    id: string,
    field: K,
    value: ItemMaster[K]
  ) => {
    const prev = rows.find((r) => r.id === id)
    if (!prev || prev[field] === value) return

    const updated = { ...prev, [field]: value }
    setRows((current) => current.map((r) => (r.id === id ? updated : r)))

    startTransition(async () => {
      try {
        await updateItemMaster(id, { [field]: value } as Parameters<typeof updateItemMaster>[1])
        toast.success('保存しました')
      } catch (err) {
        setRows((current) => current.map((r) => (r.id === id ? prev : r)))
        toast.error('保存に失敗しました', {
          description: err instanceof Error ? err.message : undefined,
        })
      }
    })
  }

  const handleAdd = (section: SectionType) => {
    startTransition(async () => {
      try {
        const created = await createItemMaster(section)
        setRows((current) => [...current, created])
        setActiveTab(String(section))
        toast.success('行を追加しました')
      } catch (err) {
        toast.error('追加に失敗しました', {
          description: err instanceof Error ? err.message : undefined,
        })
      }
    })
  }

  const handleDelete = (id: string) => {
    const prev = rows
    setRows((current) => current.filter((r) => r.id !== id))

    startTransition(async () => {
      try {
        await deleteItemMaster(id)
        toast.success('削除しました')
      } catch (err) {
        setRows(prev)
        toast.error('削除に失敗しました', {
          description: err instanceof Error ? err.message : undefined,
        })
      }
    })
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {SECTIONS.map((section) => (
          <TabsTrigger key={section} value={String(section)}>
            {SECTION_NAMES[section]}
          </TabsTrigger>
        ))}
      </TabsList>

      {SECTIONS.map((section) => (
        <TabsContent key={section} value={String(section)} className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleAdd(section)}
            >
              <Plus className="size-4" />
              行を追加
            </Button>
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>項目名</TableHead>
                  <TableHead className="w-20">単位</TableHead>
                  <TableHead className="w-32">標準見積単価</TableHead>
                  <TableHead className="w-32">標準発注単価</TableHead>
                  <TableHead className="w-24">標準利益率</TableHead>
                  <TableHead className="w-16">有効</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionRows(section).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-16 text-center text-muted-foreground">
                      項目がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  sectionRows(section).map((row) => {
                    const profitRate = calcProfitRate(row.default_price, row.default_cost)
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            className="h-8"
                            defaultValue={row.item_name}
                            onBlur={(e) => {
                              if (e.target.value !== row.item_name) {
                                saveField(row.id, 'item_name', e.target.value)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-16"
                            defaultValue={row.unit}
                            onBlur={(e) => {
                              if (e.target.value !== row.unit) {
                                saveField(row.id, 'unit', e.target.value)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            className="h-8"
                            defaultValue={row.default_price}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              if (val !== row.default_price) {
                                saveField(row.id, 'default_price', val)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            className="h-8"
                            defaultValue={row.default_cost}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              if (val !== row.default_cost) {
                                saveField(row.id, 'default_cost', val)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'rounded px-2 py-0.5 text-xs font-medium',
                              profitRateColor(profitRate)
                            )}
                          >
                            {formatRate(profitRate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={row.is_active}
                            onChange={(e) =>
                              saveField(row.id, 'is_active', e.target.checked)
                            }
                            className="size-4 rounded border"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={isPending}
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
