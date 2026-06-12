'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteEstimateImage } from '@/actions/estimate-images'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { EstimateImage } from '@/types/database'

const ShadeCanvasEditor = dynamic(() => import('@/components/ShadeCanvasEditor'), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-muted-foreground">配置エディタを読み込み中...</p>
  ),
})

type Props = {
  estimateId: string
  initialImages: EstimateImage[]
}

export default function EstimateImagesSection({
  estimateId,
  initialImages,
}: Props) {
  const router = useRouter()
  const [images, setImages] = useState<EstimateImage[]>(initialImages)
  const [previewImage, setPreviewImage] = useState<EstimateImage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setImages(initialImages)
  }, [initialImages])

  const handleDownload = (image: EstimateImage) => {
    const link = document.createElement('a')
    link.href = image.image_url
    link.download = `estimate-image-${image.id}.png`
    link.target = '_blank'
    link.click()
  }

  const handleDelete = async (image: EstimateImage) => {
    if (!confirm('このイメージ図を削除しますか？')) return

    setDeletingId(image.id)
    try {
      const result = await deleteEstimateImage(image.id, estimateId)
      if (!result.success) {
        toast.error('削除に失敗しました', { description: result.error })
        return
      }

      setImages((prev) => prev.filter((img) => img.id !== image.id))
      if (previewImage?.id === image.id) setPreviewImage(null)
      toast.success('イメージ図を削除しました')
    } catch (err) {
      toast.error('削除に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleLayoutSave = async (dataUrl: string) => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    const res = await fetch(dataUrl)
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

    const { data, error } = await supabase
      .from('estimate_images')
      .insert({
        estimate_id: estimateId,
        image_url: urlData.publicUrl,
        prompt: null,
        generation_type: 'layout',
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
      generation_type: data.generation_type ?? 'layout',
      width_m: data.width_m != null ? Number(data.width_m) : null,
      length_m: data.length_m != null ? Number(data.length_m) : null,
      count: data.count,
      pillar_type: data.pillar_type,
      color: data.color,
      created_at: data.created_at,
    }

    setImages((prev) => [savedImage, ...prev])
    toast.success('配置イメージを保存しました')
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>🗺️ 配置イメージエディタ</CardTitle>
        </CardHeader>
        <CardContent>
          <ShadeCanvasEditor estimateId={estimateId} onSave={handleLayoutSave} />
        </CardContent>
      </Card>

      {images.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>保存済み配置イメージ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="block w-full cursor-pointer"
                    onClick={() => setPreviewImage(image)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPreviewImage(image)
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt="保存済み配置イメージ"
                      className="aspect-video w-full object-cover transition-opacity hover:opacity-90"
                    />
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(image.created_at), 'yyyy/MM/dd HH:mm')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(image)}
                      >
                        <Download className="size-3.5" />
                        ダウンロード
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(image)}
                        disabled={deletingId === image.id}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>配置イメージプレビュー</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.image_url}
                alt="配置イメージプレビュー"
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleDownload(previewImage)}>
                  <Download className="size-4" />
                  ダウンロード
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDelete(previewImage)}
                  disabled={deletingId === previewImage.id}
                >
                  <Trash2 className="size-4 text-destructive" />
                  削除
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
