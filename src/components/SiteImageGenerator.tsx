'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CanvasColor = 'green' | 'orange'

type Props = {
  estimateId: string
  jobName?: string
  onSave?: (publicUrl: string, image?: SaveSiteImageResponse['image']) => void | Promise<void>
}

type GenerateSiteImageResponse = {
  imageUrl?: string
  error?: string
}

type SaveSiteImageResponse = {
  publicUrl?: string
  image?: {
    id: string
    estimate_id: string
    image_url: string
    prompt: string | null
    generation_type: string | null
    width_m: number | null
    length_m: number | null
    count: number | null
    pillar_type: number | null
    color: string | null
    created_at: string
  }
  error?: string
}

export default function SiteImageGenerator({
  estimateId,
  jobName,
  onSave,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [width, setWidth] = useState(4)
  const [length, setLength] = useState(10)
  const [count, setCount] = useState(1)
  const [pillarType, setPillarType] = useState(1)
  const [canvasColor, setCanvasColor] = useState<CanvasColor>('green')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setResultImage(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!selectedFile) return
    setGenerating(true)
    setResultImage(null)
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('width', String(width))
      formData.append('length', String(length))
      formData.append('count', String(count))
      formData.append('pillarType', String(pillarType))
      formData.append('color', canvasColor)
      formData.append('jobName', jobName ?? '')

      const res = await fetch('/api/generate-site-image', {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json()) as GenerateSiteImageResponse

      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error ?? '生成に失敗しました')
      }

      setResultImage(data.imageUrl)
    } catch (err) {
      toast.error('シェード合成イメージの生成に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!resultImage) return
    setSaving(true)
    try {
      const res = await fetch('/api/save-site-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: resultImage,
          estimateId,
        }),
      })
      const data = (await res.json()) as SaveSiteImageResponse

      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error ?? '保存に失敗しました')
      }

      toast.success('保存しました')
      await onSave?.(data.publicUrl, data.image)
    } catch (err) {
      toast.error('画像の保存に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="font-semibold">📸 現場写真をアップロード</Label>
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="現場写真"
          className="max-h-64 w-full rounded border object-contain"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <Label className="text-xs">設置台数</Label>
          <Input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
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
        <div className="col-span-2">
          <Label className="text-xs">キャンバスカラー</Label>
          <select
            className="w-full rounded border px-2 py-2 text-xs"
            value={canvasColor}
            onChange={(e) => setCanvasColor(e.target.value as CanvasColor)}
          >
            <option value="green">グリーン（半透明）</option>
            <option value="orange">オレンジ（蛇腹）</option>
          </select>
        </div>
      </div>

      <Button
        className="w-full"
        type="button"
        onClick={handleGenerate}
        disabled={!selectedFile || generating}
      >
        {generating ? '生成中...（30〜60秒）' : '🏗️ シェード合成イメージを生成'}
      </Button>

      {resultImage && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultImage}
            alt="合成イメージ"
            className="w-full rounded border"
          />
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 この画像を保存する'}
          </Button>
        </div>
      )}
    </div>
  )
}
