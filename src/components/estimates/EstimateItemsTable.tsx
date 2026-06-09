'use client'

import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import {
  calcItem,
  formatJPY,
  formatRate,
  profitRateColor,
} from '@/lib/calculations'
import {
  SECTION_NAMES,
  type FormEstimateItem,
  type SectionType,
} from '@/types/estimate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const SECTIONS = [1, 2, 3, 4] as SectionType[]

type Props = {
  items: FormEstimateItem[]
  onChange: (items: FormEstimateItem[]) => void
}

export default function EstimateItemsTable({ items, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<FormEstimateItem>) => {
      onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    },
    [items, onChange]
  )

  const deleteItem = useCallback(
    (id: string) => {
      onChange(items.filter((item) => item.id !== id))
    },
    [items, onChange]
  )

  const addItem = useCallback(
    (section: SectionType) => {
      const sectionItems = items.filter((i) => i.section === section)
      const maxOrder = sectionItems.reduce((max, i) => Math.max(max, i.sort_order), 0)
      const newItem: FormEstimateItem = {
        id: crypto.randomUUID(),
        section,
        sub_category: null,
        item_name: '',
        specification: null,
        quantity: 1,
        unit: '式',
        unit_price: 0,
        cost_price: 0,
        note: null,
        is_active: true,
        sort_order: maxOrder + 10,
      }
      onChange([...items, newItem])
    },
    [items, onChange]
  )

  const handleDragEnd = (event: DragEndEvent, section: SectionType) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sectionItems = items
      .filter((i) => i.section === section)
      .sort((a, b) => a.sort_order - b.sort_order)

    const oldIndex = sectionItems.findIndex((i) => i.id === active.id)
    const newIndex = sectionItems.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(sectionItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      sort_order: (idx + 1) * 10,
    }))

    const otherItems = items.filter((i) => i.section !== section)
    onChange([...otherItems, ...reordered])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>見積明細</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {SECTIONS.map((section) => {
          const sectionItems = items
            .filter((i) => i.section === section)
            .sort((a, b) => a.sort_order - b.sort_order)

          const activeItems = sectionItems.filter((i) => i.is_active)
          const sectionSubtotal = activeItems.reduce(
            (sum, i) => sum + calcItem({ ...i, estimate_id: '' }).amount,
            0
          )
          const sectionCost = activeItems.reduce(
            (sum, i) => sum + calcItem({ ...i, estimate_id: '' }).cost_amount,
            0
          )
          const sectionProfit = sectionSubtotal - sectionCost
          const sectionRate =
            sectionSubtotal > 0 ? (sectionProfit / sectionSubtotal) * 100 : 0

          return (
            <div key={section} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold">{SECTION_NAMES[section]}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span>
                    小計: ¥{formatJPY(sectionSubtotal)}
                  </span>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      profitRateColor(sectionRate)
                    )}
                  >
                    利益率 {formatRate(sectionRate)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(section)}
                  >
                    <Plus className="size-3.5" />
                    行を追加
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-8 p-2" />
                      <th className="min-w-48 p-2">項目名</th>
                      <th className="w-20 p-2">数量</th>
                      <th className="w-16 p-2">単位</th>
                      <th className="w-28 p-2">見積単価</th>
                      <th className="w-28 p-2">発注単価</th>
                      <th className="w-28 p-2">見積金額</th>
                      <th className="w-28 p-2">発注金額</th>
                      <th className="w-20 p-2">利益率</th>
                      <th className="min-w-32 p-2">備考</th>
                      <th className="w-12 p-2">有効</th>
                      <th className="w-10 p-2" />
                    </tr>
                  </thead>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, section)}
                  >
                    <SortableContext
                      items={sectionItems.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody>
                        {sectionItems.map((item) => (
                          <SortableRow
                            key={item.id}
                            item={item}
                            onUpdate={updateItem}
                            onDelete={deleteItem}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </DndContext>
                </table>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function SortableRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: FormEstimateItem
  onUpdate: (id: string, patch: Partial<FormEstimateItem>) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const calc = calcItem({ ...item, estimate_id: '' })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn('border-b', !item.is_active && 'bg-muted/30 opacity-60')}
    >
      <td className="p-2">
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className="p-2">
        <Input
          value={item.item_name}
          onChange={(e) => onUpdate(item.id, { item_name: e.target.value })}
          className="h-8"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min={0}
          step="any"
          value={item.quantity}
          onChange={(e) =>
            onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })
          }
          className="h-8"
        />
      </td>
      <td className="p-2">
        <Input
          value={item.unit}
          onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
          className="h-8"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min={0}
          value={item.unit_price}
          onChange={(e) =>
            onUpdate(item.id, { unit_price: parseFloat(e.target.value) || 0 })
          }
          className="h-8"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min={0}
          value={item.cost_price}
          onChange={(e) =>
            onUpdate(item.id, { cost_price: parseFloat(e.target.value) || 0 })
          }
          className="h-8"
        />
      </td>
      <td className="p-2 text-right font-medium">¥{formatJPY(calc.amount)}</td>
      <td className="p-2 text-right">¥{formatJPY(calc.cost_amount)}</td>
      <td className="p-2">
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-xs font-medium',
            profitRateColor(calc.profit_rate)
          )}
        >
          {formatRate(calc.profit_rate)}
        </span>
      </td>
      <td className="p-2">
        <Input
          value={item.note ?? ''}
          onChange={(e) => onUpdate(item.id, { note: e.target.value || null })}
          className="h-8 min-w-28"
          placeholder="備考"
        />
      </td>
      <td className="p-2 text-center">
        <input
          type="checkbox"
          checked={item.is_active}
          onChange={(e) => onUpdate(item.id, { is_active: e.target.checked })}
          className="size-4 rounded border"
        />
      </td>
      <td className="p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </td>
    </tr>
  )
}
