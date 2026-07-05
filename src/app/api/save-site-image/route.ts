import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase環境変数が設定されていません' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { imageUrl, estimateId } = (await req.json()) as {
      imageUrl?: string
      estimateId?: string
    }

    if (!imageUrl || !estimateId) {
      return NextResponse.json(
        { error: 'imageUrl と estimateId が必要です' },
        { status: 400 }
      )
    }

    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: '外部画像の取得に失敗しました' },
        { status: 502 }
      )
    }

    const blob = await imageRes.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const contentType = blob.type || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const fileName = `site-images/${estimateId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('estimate-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('estimate-images')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    const { data: inserted, error: dbError } = await supabase
      .from('estimate_images')
      .insert({
        estimate_id: estimateId,
        image_url: publicUrl,
        generation_type: 'site_composite',
      })
      .select()
      .single()

    if (dbError || !inserted) {
      return NextResponse.json({ error: dbError?.message ?? 'DB保存失敗' }, { status: 500 })
    }

    return NextResponse.json({ publicUrl, image: inserted })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'エラー'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
