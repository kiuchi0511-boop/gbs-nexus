import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getPillarDescription(pillarType: number | string): string {
  const t = String(pillarType)
  if (t === '2' || t.includes('片側')) {
    return 'cantilever: white square steel columns 150mm×150mm on ONE side only'
  }
  if (t === '3' || t.includes('中央')) {
    return 'center post: white square steel columns 150mm×150mm along center line'
  }
  return 'dual end-post: white square steel columns 150mm×150mm at both ends'
}

export async function POST(req: NextRequest) {
  try {
    const { width, length, count, pillarType } = await req.json()
    const panelCount = Math.max(1, count ?? 1)

    const prompt = `
3D architectural CGI of a single retractable shade structure.
PURE WHITE BACKGROUND ONLY — no ground, no sky, no surroundings.

STRUCTURE:
- ${panelCount} span(s), ${width}m wide × ${length}m long
- ${getPillarDescription(pillarType ?? 1)}
- White H-beam steel (150mm×150mm) along the top
- VIVID ORANGE accordion bellows canvas with clear parallel pleat shadows
- Silver wire ropes φ6mm at 780mm intervals

VIEW: isometric 35-40 degree elevation from front-right corner
STYLE: white powder-coated steel, photorealistic CGI, subtle drop shadow beneath
CRITICAL: pure white (#FFFFFF) background only, no text, no labels
`.trim()

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    })

    const imageData = response.data?.[0]
    const imageUrl =
      imageData?.url ||
      (imageData?.b64_json
        ? `data:image/png;base64,${imageData.b64_json}`
        : null)

    if (!imageUrl) {
      return NextResponse.json({ error: '生成失敗' }, { status: 500 })
    }
    return NextResponse.json({ imageUrl })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'エラー'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
