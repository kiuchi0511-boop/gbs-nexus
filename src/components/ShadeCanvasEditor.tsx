'use client'

import { useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Text,
  Group,
  Transformer,
  Line,
} from 'react-konva'
import useImage from 'use-image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CANVAS_W = 800
const CANVAS_H = 600
const LAT = 35

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']

function getMetersPerPixel(zoom: number): number {
  return (156543.03392 * Math.cos(LAT * Math.PI / 180)) / Math.pow(2, zoom)
}

type ShadeItem = {
  id: string
  x: number
  y: number
  widthM: number
  lengthM: number
  rotation: number
  label: string
}

function ScaleBar({ metersPerPixel }: { metersPerPixel: number }) {
  const scaleBarM = 10
  const scaleBarPx = scaleBarM / metersPerPixel
  const barX = CANVAS_W - scaleBarPx - 20
  const barY = CANVAS_H - 30
  const labelX = barX + scaleBarPx / 2 - 10
  const labelY = barY - 18

  return (
    <>
      <Line
        points={[barX + 1, barY + 1, barX + scaleBarPx + 1, barY + 1]}
        stroke="black"
        strokeWidth={3}
        opacity={0.6}
      />
      <Line
        points={[barX + 1, barY - 4, barX + 1, barY + 6]}
        stroke="black"
        strokeWidth={2}
        opacity={0.6}
      />
      <Line
        points={[barX + scaleBarPx + 1, barY - 4, barX + scaleBarPx + 1, barY + 6]}
        stroke="black"
        strokeWidth={2}
        opacity={0.6}
      />
      <Text
        text={`${scaleBarM}m`}
        x={labelX + 1}
        y={labelY + 1}
        fontSize={12}
        fill="black"
        fontStyle="bold"
        opacity={0.6}
      />
      <Line
        points={[barX, barY, barX + scaleBarPx, barY]}
        stroke="white"
        strokeWidth={3}
      />
      <Line
        points={[barX, barY - 5, barX, barY + 5]}
        stroke="white"
        strokeWidth={2}
      />
      <Line
        points={[barX + scaleBarPx, barY - 5, barX + scaleBarPx, barY + 5]}
        stroke="white"
        strokeWidth={2}
      />
      <Text
        text={`${scaleBarM}m`}
        x={labelX}
        y={labelY}
        fontSize={12}
        fill="white"
        fontStyle="bold"
        shadowColor="black"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={1}
      />
    </>
  )
}

function ShadeRect({
  item,
  index,
  isSelected,
  showTransformer,
  metersPerPixel,
  onSelect,
  onDragStart,
  onDragEnd,
  onChange,
}: {
  item: ShadeItem
  index: number
  isSelected: boolean
  showTransformer: boolean
  metersPerPixel: number
  onSelect: (id: string, e: KonvaEventObject<MouseEvent>) => void
  onDragStart: () => void
  onDragEnd: (id: string, e: KonvaEventObject<DragEvent>) => void
  onChange: (attrs: Partial<ShadeItem>) => void
}) {
  const groupRef = useRef<Konva.Group>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (showTransformer && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [showTransformer])

  const wPx = item.widthM / metersPerPixel
  const lPx = item.lengthM / metersPerPixel
  const numberText = CIRCLED_NUMBERS[index] ?? String(index + 1)
  const numberFontSize = Math.min(wPx * 0.6, 20)

  return (
    <>
      <Group
        ref={groupRef}
        x={item.x}
        y={item.y}
        rotation={item.rotation}
        draggable
        onClick={(e) => {
          e.cancelBubble = true
          onSelect(item.id, e)
        }}
        onTap={(e) => {
          e.cancelBubble = true
          onSelect(item.id, e as unknown as KonvaEventObject<MouseEvent>)
        }}
        onDragStart={onDragStart}
        onDragEnd={(e) => onDragEnd(item.id, e)}
        onTransformEnd={() => {
          const node = groupRef.current
          if (!node) return
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
          })
        }}
      >
        <Rect
          width={lPx}
          height={wPx}
          fill="rgba(255, 140, 0, 0.55)"
          stroke={isSelected ? 'white' : 'darkorange'}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />
        <Text
          text={numberText}
          fontSize={numberFontSize}
          fill="white"
          fontStyle="bold"
          x={lPx / 2 - 10}
          y={wPx / 2 - 10}
        />
        <Text
          text={item.label}
          fontSize={9}
          fill="white"
          x={4}
          y={4}
          width={lPx - 8}
          wrap="none"
          ellipsis
        />
        {Array.from({ length: Math.floor(lPx / 8) }).map((_, i) => (
          <Rect
            key={i}
            x={i * 8}
            y={0}
            width={1}
            height={wPx}
            fill="rgba(0,0,0,0.12)"
          />
        ))}
      </Group>
      {showTransformer && (
        <Transformer
          ref={trRef}
          rotateEnabled
          resizeEnabled={false}
          borderStroke="orange"
          anchorStroke="orange"
        />
      )}
    </>
  )
}

type Props = {
  estimateId: string
  onSave?: (dataUrl: string) => void | Promise<void>
}

export default function ShadeCanvasEditor({ estimateId: _estimateId, onSave }: Props) {
  const [width, setWidth] = useState(4)
  const [length, setLength] = useState(10)
  const [pillarType, setPillarType] = useState(1)

  const [mapAddress, setMapAddress] = useState('静岡県浜松市天竜区')
  const [zoom, setZoom] = useState(18)
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(false)
  const [bgImage] = useImage(mapImageUrl ?? '', 'anonymous')

  const [shades, setShades] = useState<ShadeItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const stageRef = useRef<Konva.Stage>(null)
  const dragStartPos = useRef<Record<string, { x: number; y: number }>>({})
  const metersPerPixel = getMetersPerPixel(zoom)

  const handleSelect = (id: string, e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    } else {
      setSelectedIds(new Set([id]))
    }
  }

  const handleDragStart = () => {
    dragStartPos.current = {}
    shades.forEach((s) => {
      dragStartPos.current[s.id] = { x: s.x, y: s.y }
    })
  }

  const handleDragEnd = (id: string, e: KonvaEventObject<DragEvent>) => {
    if (selectedIds.size <= 1 || !selectedIds.has(id)) {
      setShades((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, x: e.target.x(), y: e.target.y() } : s
        )
      )
      return
    }

    const start = dragStartPos.current[id]
    if (!start) return

    const dx = e.target.x() - start.x
    const dy = e.target.y() - start.y

    setShades((prev) =>
      prev.map((s) =>
        selectedIds.has(s.id)
          ? {
              ...s,
              x: dragStartPos.current[s.id].x + dx,
              y: dragStartPos.current[s.id].y + dy,
            }
          : s
      )
    )
  }

  const handleMapLoad = async () => {
    if (!mapAddress.trim()) return
    setMapLoading(true)
    try {
      const url = `/api/maps-proxy?address=${encodeURIComponent(mapAddress)}&zoom=${zoom}`
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('航空写真の読み込みに失敗しました'))
        img.src = url
      })
      setMapImageUrl(url)
    } catch (err) {
      toast.error('航空写真の読み込みに失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setMapLoading(false)
    }
  }

  const handleAddShade = () => {
    const pillarLabel =
      pillarType === 2 ? '片側支柱' : pillarType === 3 ? '中央支柱' : '両端支柱'
    const label = `${width}m×${length}m ${pillarLabel}`
    const lengthPx = length / metersPerPixel
    const widthPx = width / metersPerPixel

    setShades((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        x: CANVAS_W / 2 - lengthPx / 2,
        y: CANVAS_H / 2 - widthPx / 2,
        widthM: width,
        lengthM: length,
        rotation: 0,
        label,
      },
    ])
  }

  const handleDelete = () => {
    if (selectedIds.size === 0) return
    setShades((prev) => prev.filter((s) => !selectedIds.has(s.id)))
    setSelectedIds(new Set())
  }

  const handleSave = async () => {
    if (!stageRef.current) return
    setSaving(true)
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
      await onSave?.(dataUrl)
    } catch (err) {
      toast.error('配置の保存に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="w-full flex-shrink-0 space-y-4 text-sm lg:w-64">
        <div className="space-y-2">
          <Label className="font-semibold">📍 現場の住所・施設名</Label>
          <Input
            placeholder="例：愛知県豊田市○○町1-1"
            value={mapAddress}
            onChange={(e) => setMapAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleMapLoad()}
          />
          <div>
            <Label className="text-xs">ズームレベル（拡大率）</Label>
            <input
              type="range"
              min={15}
              max={20}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {zoom}（大きいほど拡大）・ 約 {metersPerPixel.toFixed(3)} m/px
            </p>
          </div>
          <Button
            className="w-full"
            variant="outline"
            type="button"
            onClick={handleMapLoad}
            disabled={mapLoading}
          >
            {mapLoading ? '読み込み中...' : '🛰️ 航空写真を背景に設定'}
          </Button>
          <p className="text-xs text-muted-foreground">
            住所または施設名を入力してEnterまたはボタンを押す
          </p>
        </div>

        <hr />

        <div className="space-y-2">
          <Label className="font-semibold">シェード仕様</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">幅 (m)</Label>
              <Input
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">長さ (m)</Label>
              <Input
                type="number"
                min={1}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">支柱タイプ</Label>
            <select
              className="w-full rounded border px-2 py-2 text-xs"
              value={pillarType}
              onChange={(e) => setPillarType(Number(e.target.value))}
            >
              <option value={1}>①両端支柱</option>
              <option value={2}>②片側支柱</option>
              <option value={3}>③中央支柱</option>
            </select>
          </div>
          <Button className="w-full" type="button" onClick={handleAddShade}>
            ＋ シェードを追加
          </Button>
        </div>

        <hr />

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            💡 クリックで選択、Shiftクリックで複数選択
            <br />
            　まとめてドラッグ移動
            <br />
            　回転ハンドルで向きを変更（単体選択時）
            <br />
            　ズーム変更後は航空写真を再読み込みしてください
          </p>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              className="w-full"
              type="button"
              onClick={handleDelete}
            >
              選択中を削除（{selectedIds.size}件）
            </Button>
          )}
          <Button
            variant="default"
            className="w-full"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 この配置を保存する'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Stage
          ref={stageRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ background: '#e5e7eb' }}
          onClick={(e) => {
            if (e.target === e.target.getStage()) setSelectedIds(new Set())
          }}
        >
          <Layer>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                x={0}
                y={0}
                width={CANVAS_W}
                height={CANVAS_H}
              />
            )}
            {shades.map((shade, index) => (
              <ShadeRect
                key={shade.id}
                item={shade}
                index={index}
                isSelected={selectedIds.has(shade.id)}
                showTransformer={
                  selectedIds.size === 1 && selectedIds.has(shade.id)
                }
                metersPerPixel={metersPerPixel}
                onSelect={handleSelect}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onChange={(attrs) =>
                  setShades((prev) =>
                    prev.map((s) => (s.id === shade.id ? { ...s, ...attrs } : s))
                  )
                }
              />
            ))}
          </Layer>
          <Layer>
            <ScaleBar metersPerPixel={metersPerPixel} />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
