import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function detectFacilityType(jobName: string): string {
  const n = jobName ?? ''
  if (/こども園|保育|幼稚|小学|中学|高校|学校|校庭|園庭/.test(n))        return 'school'
  if (/グラウンド|運動場|競技|スポーツ|テニス|サッカー|野球|体育|球技/.test(n)) return 'sports'
  if (/工場|倉庫|物流|製造|産業|工業/.test(n))                           return 'factory'
  if (/マンション|アパート|集合住宅|駐車場|住宅|自治会|管理組合/.test(n))   return 'residential'
  if (/公園|広場|緑地|児童/.test(n))                                     return 'park'
  if (/病院|クリニック|医療|介護|福祉|老人|デイ/.test(n))                  return 'medical'
  if (/ドッグ|犬|ペット|動物/.test(n))                                    return 'dogrun'
  if (/神社|寺|仏|境内/.test(n))                                         return 'shrine'
  if (/ゴルフ|打ちっ放し|練習場/.test(n))                                 return 'golf'
  if (/商業|ショッピング|モール|店舗|商店|スーパー|量販/.test(n))           return 'commercial'
  if (/役所|市役所|区役所|町役場|官公庁|公共|市営|県営|区営/.test(n))       return 'government'
  return 'general'
}

function getFacilityContext(type: string): string {
  switch (type) {
    case 'school':
      return 'a Japanese kindergarten or elementary school. Background: school building with warm-colored tiled roof, colorful playground equipment (slides, swings), rubber-paved play area with painted markings. Ground inside shade: bright artificial green turf.'
    case 'sports':
      return 'a Japanese outdoor sports facility or athletic field. Background: open sky, sports facility fencing. Ground inside shade: athletic surface with white court boundary lines painted on it. Open athletic surroundings.'
    case 'factory':
      return 'a Japanese industrial or factory premises. Background: large industrial warehouse building with corrugated metal walls. Ground: grey concrete hardstanding surface throughout. Loading dock area visible.'
    case 'residential':
      return 'a Japanese residential condominium complex outdoor area. Background: modern multi-story apartment building. Ground: paved concrete parking lot surface.'
    case 'park':
      return 'a Japanese public park or civic green space. Background: mature zelkova trees and manicured hedges. Ground inside shade: park paving stones. Park benches and pathways visible.'
    case 'medical':
      return 'a Japanese hospital or care facility outdoor courtyard. Background: clean white institutional building with regular windows. Ground: smooth concrete paving with tactile guide tiles.'
    case 'dogrun':
      return 'a Japanese dog run facility. Ground inside fence: bright lush artificial green turf. Ground outside fence: grey gravel paving. Background: wooden deck terrace and trailer house structures. No dogs or people in the image.'
    case 'shrine':
      return 'a Japanese Shinto shrine or temple precincts. Background: wooden shrine buildings with curved tile roofs, stone lanterns, tall trees. Ground: raked gravel or stone paving.'
    case 'golf':
      return 'a Japanese golf driving range or practice facility. Background: large net structure, driving range bay structure. Ground: artificial turf hitting surface.'
    case 'commercial':
      return 'a Japanese retail or commercial facility. Background: commercial building with signage area, customer parking. Ground: paved concrete with painted parking lines.'
    case 'government':
      return 'a Japanese municipal government facility or public institution. Background: clean modern public building with Japanese flag pole. Ground: paved concrete plaza.'
    default:
      return 'a Japanese commercial outdoor facility. Background: clean modern building facade. Ground inside: bright artificial green turf. Ground outside: grey gravel paving.'
  }
}

type ViewAngle = 'right' | 'left'

function getCameraAngle(viewAngle: ViewAngle | undefined, unitCount: number): string {
  const corner =
    viewAngle === 'left' ? 'front-left' : viewAngle === 'right' ? 'front-right' : 'front-right'

  if (unitCount >= 3) {
    return `very wide elevated perspective at 20-25 degrees above ground, from ${corner} corner, pulled back to show ALL ${unitCount} units from left end to right end in one frame`
  }
  if (unitCount === 2) {
    return `wide elevated perspective at 25-30 degrees, from ${corner} corner, showing both units clearly side by side`
  }
  return `elevated perspective at 35-40 degrees, from ${corner} corner`
}

function getPillarDescription(pillarType: number | string): string {
  const t = String(pillarType)
  if (t === '2' || t.includes('片側') || t.includes('片端')) {
    return 'CANTILEVER design: thick white square hollow steel columns 150mm×150mm on ONE side only (left side), no columns on the right side, shade cantilevering outward to the right. The single row of columns is very prominent.'
  }
  if (t === '3' || t.includes('既存') || t.includes('中央')) {
    return 'CENTER POST design: thick white square hollow steel columns 150mm×150mm running along the center line only, shade panels extending symmetrically left and right from the center beam.'
  }
  return 'DUAL END-POST design: thick white square hollow steel columns 150mm×150mm standing prominently at both ends (left end and right end). Each end has a pair of columns. Large square base plates (450mm×950mm) bolted to concrete at ground level with visible anchor bolts.'
}

export async function POST(req: NextRequest) {
  try {
    const { width, length, count, units, pillarType, jobName, viewAngle } = await req.json()

    const facilityType = detectFacilityType(jobName ?? '')
    const facilityContext = getFacilityContext(facilityType)
    const pillarDesc = getPillarDescription(pillarType ?? 1)
    const unitCount = Math.max(1, units ?? 1)
    const panelCount = Math.max(1, count ?? 1)

    const installDesc =
      unitCount === 1
        ? `a single shade structure unit with ${panelCount} span(s), ${width}m wide × ${length}m long`
        : `EXACTLY ${unitCount} completely separate independent shade structure units installed side by side. Each unit is ${width}m wide × ${length}m long with ${panelCount} span(s), its own white columns at both ends, and its own vivid orange canvas. There are ${unitCount} sets of column pairs visible. A small gap between each unit clearly separates them.`

    const cameraAngle = getCameraAngle(viewAngle as ViewAngle | undefined, unitCount)

    const prompt = `
Professional photorealistic 3D architectural CGI rendering for a Japanese construction company proposal document, showing a large retractable outdoor shade structure installed at ${facilityContext}

CAMERA: ${cameraAngle}. Bright sunny day. Vivid blue sky with some white clouds in upper portion of image. Wide composition showing full structure.

SHADE STRUCTURE:
- ${installDesc}
- ${pillarDesc}
- White H-beam steel (150mm×150mm H-section) running along the top of both long sides, connecting column tops
- The H-beams are clearly visible as white steel structural members along the length
- Canvas: VIVID SATURATED ORANGE retractable mesh canvas, fully extended/open covering the full area
- CRITICAL CANVAS DETAIL: the orange canvas has very strongly defined accordion bellows folds — imagine a tightly compressed harmonica or corrugated cardboard viewed from above. The folds run perpendicular to the length of the structure (across the width). There are approximately 10-15 uniform parallel ridges and valleys. Each ridge is raised and brightly lit, each valley is in shadow, creating a dramatic alternating bright-orange / dark-orange stripe pattern across the entire canvas surface. This corrugated texture is the most prominent visual feature.
- Thin stainless steel wire ropes (φ6mm) visible as fine silver lines running parallel along the length, spaced at regular intervals

ENVIRONMENT:
- White powder-coated steel mesh panel fence surrounding entire perimeter — the fence has a grid pattern of horizontal and vertical wires, approximately 2m tall, clearly visible panels
- Inside fence ground: bright vivid artificial green turf (lush, saturated green)  
- Outside fence ground: medium grey gravel surface
- Structure casts realistic sharp shadows on green turf below

RENDERING QUALITY:
- White steel frame: clean matte white with subtle 3D shading showing column thickness and beam profiles
- Photorealistic architectural visualization, matching quality of professional Japanese construction CGI proposal documents
- Sharp crisp image throughout

ABSOLUTE REQUIREMENT: Zero text, zero labels, zero watermarks, zero people, zero animals anywhere in the image.
`.trim()

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'high',
    })

    const imageData = response.data?.[0]
    const imageUrl =
      imageData?.url ||
      (imageData?.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null)

    if (!imageUrl) {
      return NextResponse.json({ error: '画像生成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl, prompt })
  } catch (error: unknown) {
    console.error('Image generation error:', error)
    const message = error instanceof Error ? error.message : '画像生成エラー'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
