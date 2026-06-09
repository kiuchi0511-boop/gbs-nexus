// PDF用画像URL（@react-pdf/renderer は public 画像を絶対URLで指定する必要がある）
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export function getPdfImageUrls() {
  const siteUrl = getSiteUrl()
  return {
    logo: `${siteUrl}/images/gbs_logo.jpeg`,
    title: `${siteUrl}/images/gbs_title.jpeg`,
  }
}
