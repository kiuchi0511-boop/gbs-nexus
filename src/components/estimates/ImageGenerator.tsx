'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, ImageIcon, Loader2, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
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
import type { EstimateImage } from '@/types/database'

const PILLAR_OPTIONS = [
  { value: '1', label: '①両端支柱' },
  { value: '2', label: '②片端支柱＋既存躯体' },
  { value: '3', label: '③両端既存躯体' },
] as const

type Props = {
  estimateId: string
  jobName: string
  onSaved: (image: EstimateImage) => void
}

type FormState = {
  width: string
  length: string
  count: string
  units: string
  pillarType: string
  color: string
}

const DEFAULT_FORM: FormState = {
  width: '10',
  length: '20',
  count: '1',
  units: '1',
  pillarType: '1',
  color: 'オレンジ色',
}

type GenerateStep = 'angle1' | 'angle2' | 'merging' | null

type GenerateImageResponse = {
  imageUrl?: string
  prompt?: string
  error?: string
}

async function mergeImagesVertical(url1: string, url2: string): Promise<string> {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
      img.src = src
    })

  const [img1, img2] = await Promise.all([load(url1), load(url2)])
  const gap = 20
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(img1.width, img2.width)
  canvas.height = img1.height + gap + img2.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvasの初期化に失敗しました')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img1, 0, 0)
  ctx.drawImage(img2, 0, img1.height + gap)
  return canvas.toDataURL('image/png')
}

export default function ImageGenerator({ estimateId, jobName, onSaved }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [generating, setGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState<GenerateStep>(null)
  const [saving, setSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<string | null>(null)

  const resetPreview = () => {
    setImageUrl(null)
    setPrompt(null)
  }

  const handleGenerate = async () => {
    const width = Number(form.width)
    const length = Number(form.length)
    const count = Number(form.count)
    const units = Number(form.units)

    if (!width || !length || !count || !units) {
      toast.error('幅・長さ・設置面数・設置台数を正しく入力してください')
      return
    }

    setGenerating(true)
    setGeneratingStep('angle1')
    resetPreview()

    try {
      const params = {
        width,
        length,
        count,
        units,
        pillarType: Number(form.pillarType),
        color: form.color,
        jobName,
      }

      const fetchAngle = async (viewAngle: 'right' | 'left'): Promise<GenerateImageResponse> => {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...params, viewAngle }),
        })
        const data = (await res.json()) as GenerateImageResponse
        if (!res.ok) {
          throw new Error(data.error ?? '画像生成に失敗しました')
        }
        if (!data.imageUrl) {
          throw new Error('画像URLの取得に失敗しました')
        }
        return data
      }

      const rightPromise = fetchAngle('right').then((data) => {
        setGeneratingStep('angle2')
        return data
      })
      const leftPromise = fetchAngle('left')

      const [r1, r2] = await Promise.all([rightPromise, leftPromise])

      setGeneratingStep('merging')
      const mergedUrl = await mergeImagesVertical(r1.imageUrl!, r2.imageUrl!)

      setImageUrl(mergedUrl)
      setPrompt(
        [r1.prompt, r2.prompt].filter(Boolean).join('\n\n---\n\n') || null
      )
    } catch (err) {
      toast.error('画像生成に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setGenerating(false)
      setGeneratingStep(null)
    }
  }

  const handleSave = async () => {
    if (!imageUrl) return

    setSaving(true)
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      let publicUrl = imageUrl

      if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
        const res = await fetch(imageUrl)
        const blob = await res.blob()

        const fileName = `${estimateId}/${Date.now()}.png`
        const { error: uploadError } = await supabase.storage
          .from('estimate-images')
          .upload(fileName, blob, { contentType: 'image/png' })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data: urlData } = supabase.storage
          .from('estimate-images')
          .getPublicUrl(fileName)

        publicUrl = urlData.publicUrl
      }

      const { data, error } = await supabase
        .from('estimate_images')
        .insert({
          estimate_id: estimateId,
          image_url: publicUrl,
          prompt: prompt ?? null,
          generation_type: 'spec',
          width_m: Number(form.width),
          length_m: Number(form.length),
          count: Number(form.count),
          pillar_type: Number(form.pillarType),
          color: form.color,
        })
        .select()
        .single()

      if (error || !data) {
        throw new Error(error?.message ?? '画像の保存に失敗しました')
      }

      const savedImage: EstimateImage = {
        id: data.id,
        estimate_id: data.estimate_id,
        image_url: data.image_url,
        prompt: data.prompt,
        generation_type: data.generation_type ?? 'spec',
        width_m: data.width_m != null ? Number(data.width_m) : null,
        length_m: data.length_m != null ? Number(data.length_m) : null,
        count: data.count,
        pillar_type: data.pillar_type,
        color: data.color,
        created_at: data.created_at,
      }

      toast.success('イメージ図を保存しました')
      onSaved(savedImage)
      router.refresh()
      setOpen(false)
      resetPreview()
    } catch (err) {
      toast.error('画像の保存に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `gbs-image-${estimateId}-${Date.now()}.png`
    link.click()
  }

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <ImageIcon className="size-4" />
        AIイメージ図を生成（2アングル）
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AIイメージ図生成</DialogTitle>
          <DialogDescription>
            シェード仕様を入力して、2アングルの設置完成イメージをAIで生成・合成します。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shade-width">シェード幅（m）</Label>
            <Input
              id="shade-width"
              type="number"
              min="1"
              step="0.1"
              value={form.width}
              onChange={(e) => updateForm('width', e.target.value)}
              disabled={generating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shade-length">長さ（m）</Label>
            <Input
              id="shade-length"
              type="number"
              min="1"
              step="0.1"
              value={form.length}
              onChange={(e) => updateForm('length', e.target.value)}
              disabled={generating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shade-count">設置面数（スパン数）</Label>
            <Input
              id="shade-count"
              type="number"
              min="1"
              step="1"
              value={form.count}
              onChange={(e) => updateForm('count', e.target.value)}
              disabled={generating}
            />
            <p style={{ fontSize: '12px', color: '#666' }}>
              1台あたりのスパン数（例：3面 = 3スパン）
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pillar-type">支柱タイプ</Label>
            <select
              id="pillar-type"
              value={form.pillarType}
              onChange={(e) => updateForm('pillarType', e.target.value)}
              disabled={generating}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {PILLAR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shade-units">設置台数（横に並べる台数）</Label>
            <Input
              id="shade-units"
              type="number"
              min={1}
              max={10}
              step="1"
              value={form.units}
              onChange={(e) => updateForm('units', e.target.value)}
              disabled={generating}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              何台横に並べるか（例：3台 = 3台設置）
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="canvas-color">キャンバスカラー</Label>
            <Input
              id="canvas-color"
              value={form.color}
              onChange={(e) => updateForm('color', e.target.value)}
              placeholder="オレンジ色"
              disabled={generating}
            />
          </div>
        </div>

        {generating && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-6 text-sm">
            <Loader2 className="size-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">
                {generatingStep === 'angle1' && 'アングル1を生成中...'}
                {generatingStep === 'angle2' && 'アングル2を生成中...'}
                {generatingStep === 'merging' && '画像を合成中...'}
                {!generatingStep && 'AIがイメージ図を生成中...'}
              </p>
              <p className="text-muted-foreground">2アングル生成のため約60秒かかります</p>
            </div>
          </div>
        )}

        {imageUrl && !generating && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="生成されたイメージ図"
                className="mx-auto max-h-[560px] w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSave} disabled={saving}>
                <Save className="size-4" />
                {saving ? '保存中...' : 'この画像を保存する'}
              </Button>
              <Button type="button" variant="outline" onClick={handleGenerate} disabled={generating}>
                <RefreshCw className="size-4" />
                再生成する
              </Button>
              <Button type="button" variant="outline" onClick={handleDownload}>
                <Download className="size-4" />
                ダウンロード
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generating || saving}
          >
            {generating ? '生成中...' : imageUrl ? '再生成する（2アングル）' : '生成する（2アングル）'}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  )
}
