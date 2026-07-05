'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { EstimateImage, SaveEstimateImageInput } from '@/types/database'

export async function getLatestSiteImageUrl(
  estimateId: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('estimate_images')
    .select('image_url')
    .eq('estimate_id', estimateId)
    .eq('generation_type', 'site_composite')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('[getLatestSiteImageUrl] error:', error)
    return null
  }

  return data?.[0]?.image_url ?? null
}

export async function getEstimateImages(estimateId: string): Promise<EstimateImage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('estimate_images')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getEstimateImages] error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    estimate_id: row.estimate_id,
    image_url: row.image_url,
    prompt: row.prompt,
    generation_type: row.generation_type ?? 'spec',
    width_m: row.width_m != null ? Number(row.width_m) : null,
    length_m: row.length_m != null ? Number(row.length_m) : null,
    count: row.count,
    pillar_type: row.pillar_type,
    color: row.color,
    created_at: row.created_at,
  }))
}

export async function saveEstimateImage(
  input: SaveEstimateImageInput
): Promise<{ success: true; image: EstimateImage } | { success: false; error: string }> {
  try {
    if (input.imageUrl.startsWith('data:')) {
      return {
        success: false,
        error: '画像URLが不正です。Storageへのアップロード後に保存してください。',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('estimate_images')
      .insert({
        estimate_id: input.estimate_id,
        image_url: input.imageUrl,
        prompt: input.prompt ?? null,
        generation_type: input.generation_type ?? 'spec',
        width_m: input.width_m ?? null,
        length_m: input.length_m ?? null,
        count: input.count ?? null,
        pillar_type: input.pillar_type ?? null,
        color: input.color ?? null,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[saveEstimateImage] insert error:', error)
      return { success: false, error: `画像の保存に失敗しました: ${error?.message}` }
    }

    revalidatePath(`/estimates/${input.estimate_id}`)

    return {
      success: true,
      image: {
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
      },
    }
  } catch (err) {
    console.error('[saveEstimateImage] unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
    }
  }
}

export async function deleteEstimateImage(
  id: string,
  estimateId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()

    const { data: image, error: fetchError } = await supabase
      .from('estimate_images')
      .select('image_url')
      .eq('id', id)
      .single()

    if (fetchError || !image) {
      return { success: false, error: '画像が見つかりません' }
    }

    const storagePath = extractStoragePath(image.image_url)
    if (storagePath) {
      await supabase.storage.from('estimate-images').remove([storagePath])
    }

    const { error } = await supabase.from('estimate_images').delete().eq('id', id)

    if (error) {
      console.error('[deleteEstimateImage] error:', error)
      return { success: false, error: `画像の削除に失敗しました: ${error.message}` }
    }

    revalidatePath(`/estimates/${estimateId}`)
    return { success: true }
  } catch (err) {
    console.error('[deleteEstimateImage] unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
    }
  }
}

function extractStoragePath(imageUrl: string): string | null {
  const marker = '/storage/v1/object/public/estimate-images/'
  const index = imageUrl.indexOf(marker)
  if (index === -1) return null
  return imageUrl.slice(index + marker.length)
}
