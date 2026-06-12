import dynamic from 'next/dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getLatestLayoutImageUrl } from '@/actions/estimate-images'
import { getEstimateWithItems } from '@/actions/estimates'
import { getCompanySettings } from '@/actions/settings'
import { getImageAsBase64 } from '@/lib/pdf-assets'
import { Button } from '@/components/ui/button'

const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer'), {
  ssr: false,
  loading: () => <p className="p-8 text-muted-foreground">PDFを生成中...</p>,
})

type Props = {
  params: { id: string }
}

export default async function EstimatePdfPage({ params }: Props) {
  const [data, company] = await Promise.all([
    getEstimateWithItems(params.id),
    getCompanySettings(),
  ])
  if (!data) notFound()

  const { estimate, items } = data

  const layoutImageRemoteUrl = await getLatestLayoutImageUrl(params.id)
  const layoutImageUrl = layoutImageRemoteUrl
    ? await getImageAsBase64(layoutImageRemoteUrl)
    : null

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link href={`/estimates/${params.id}`} />}>
        <ArrowLeft className="size-4" />
        見積詳細に戻る
      </Button>
      <PDFViewer
        estimate={estimate}
        items={items}
        company={company}
        layoutImageUrl={layoutImageUrl}
      />
    </div>
  )
}
