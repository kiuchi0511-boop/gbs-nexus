// PDF用画像URL（@react-pdf/renderer は public 画像を絶対URLで指定する必要がある）
export function getPdfImageUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}${path}`
}

export function getPdfImageUrls() {
  return {
    logo: getPdfImageUrl('/images/gbs_logo.jpeg'),
    title: getPdfImageUrl('/images/gbs_title.jpeg'),
  }
}

export async function getImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/png'
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}
