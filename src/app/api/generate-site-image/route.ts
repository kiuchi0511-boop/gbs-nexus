import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 90

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.FLUX_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FLUX_API_KEY が設定されていません' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 })
    }

    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const prompt = `
施工後イメージの合成をしてください。

この写真の【人工芝の緑エリア（タイヤ遊具がある場所）】の上に
シェード屋根を設置した施工後イメージを作成してください。

【最重要】
人工芝エリアがシェードの屋根で完全に覆われて、
人工芝の上にシェードの影が落ちている状態にしてください。
人工芝エリアが日陰になるように屋根を設置してください。

【シェードの仕様】
- フレーム色：アイボリー（薄いベージュ）の角型スチールポール
- 幕材：ダークグリーンの半透明メッシュ生地
- 幕の形状：スカラップ状のたわみが連続する波打ち形状
- 柱4本：人工芝エリアの四隅に設置
- 高さ：約2.5〜3m
- 屋根面：人工芝エリア全体を覆う水平な屋根

【維持すること】
- 建物外壁・窓・看板・フェンス・タイヤ・ポール・階段は変更しない
- カメラアングルと遠近感は元写真と完全に一致
- フォトリアリスティックな仕上がり
- テキスト・ラベル不要
`.trim()

    const fluxResponse = await fetch('https://api.bfl.ai/v1/flux-2-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key': apiKey,
      },
      body: JSON.stringify({
        prompt,
        input_image: base64,
        width: 1344,
        height: 896,
        steps: 50,
        guidance: 7,
        prompt_upsampling: true,
      }),
    })

    const fluxData = (await fluxResponse.json()) as {
      polling_url?: string
      detail?: string
      message?: string
    }
    console.log('Flux response:', JSON.stringify(fluxData))

    if (!fluxResponse.ok) {
      return NextResponse.json(
        { error: 'Flux APIエラー', detail: fluxData },
        { status: fluxResponse.status }
      )
    }

    const pollingUrl = fluxData.polling_url
    if (!pollingUrl) {
      return NextResponse.json(
        { error: 'Flux APIエラー', detail: fluxData },
        { status: 500 }
      )
    }

    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const pollRes = await fetch(pollingUrl, {
        headers: { 'x-key': apiKey },
      })
      const pollData = (await pollRes.json()) as {
        status?: string
        result?: { sample?: string }
      }
      console.log(`Poll ${i}:`, pollData.status)

      if (pollData.status === 'Ready') {
        const imageUrl = pollData.result?.sample
        if (!imageUrl) {
          return NextResponse.json({ error: '生成結果の取得に失敗しました' }, { status: 500 })
        }
        return NextResponse.json({ imageUrl })
      }
      if (pollData.status === 'Error' || pollData.status === 'Failed') {
        return NextResponse.json({ error: '生成失敗', detail: pollData }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'タイムアウト' }, { status: 500 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'エラー'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
