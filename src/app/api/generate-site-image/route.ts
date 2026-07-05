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
    const width = formData.get('width') as string
    const length = formData.get('length') as string
    const count = formData.get('count') as string
    const pillarType = formData.get('pillarType') as string
    const color = (formData.get('color') as string | null) ?? 'green'

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 })
    }

    void pillarType

    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const colorDesc =
      color === 'orange'
        ? 'オレンジ色の蛇腹式メッシュキャンバス、アコーディオン状の折り目が均等に並ぶ'
        : 'グリーン系の半透明メッシュ生地、スカラップ状のたわみで波打つ可動式オーニング幕'

    const frameColor = color === 'orange' ? '白色' : 'アイボリー（薄いベージュ）色'

    const prompt = `
施工後イメージの合成：この屋外施設の写真に、
以下の仕様のシェード構造物を追加してください。

【追加するシェードの仕様】
- フレーム：${frameColor}のスチール角型ポール（直線的、垂直の柱4本）
- 幕材：${colorDesc}
- 幕の形状：等間隔のスカラップ状たわみ（波打つ曲線）が端から端まで続く
- サイズ：幅${width}m × 奥行き${length}m、設置台数${count}台
- 高さ：地面から約2.5〜3m
- 屋根形状：水平フラットな屋根面

【設置位置・条件】
- 写真内の人工芝エリアまたは空きスペース全体を覆うように配置
- 既存の背景（建物・空・電柱・フェンス・タイヤ・人工芝・舗装）は一切変更しない
- カメラアングルと遠近感は元写真と完全一致させる
- 柱の根元は地面にしっかり接地させる
- 太陽光の方向・強さに合わせて自然な影を地面に落とす

【画質・仕上がり条件】
- 実際の建築写真のような高いリアリズム（フォトリアリスティック）
- CG感・イラスト感を出さない
- テキスト・ラベル・透かしは一切入れない
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
