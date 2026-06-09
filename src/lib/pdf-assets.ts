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
