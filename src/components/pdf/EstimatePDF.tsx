import { Document } from '@react-pdf/renderer'
import CoverPage from '@/components/pdf/CoverPage'
import DetailPage from '@/components/pdf/DetailPage'
import SiteImagePage from '@/components/pdf/SiteImagePage'
import { getPdfImageUrls } from '@/lib/pdf-assets'
import type { CompanySettings } from '@/types/database'
import type { Estimate, EstimateItem } from '@/types/estimate'

// 画像URL（CoverPage・DetailPage で使用）
export const PDF_IMAGE_URLS = getPdfImageUrls()

type Props = {
  estimate: Estimate
  items: EstimateItem[]
  company: CompanySettings
  siteImageUrl?: string | null
}

export default function EstimatePDF({
  estimate,
  items,
  company,
  siteImageUrl = null,
}: Props) {
  return (
    <Document title={`見積書_${estimate.estimate_no}`}>
      <CoverPage estimate={estimate} company={company} />
      <DetailPage estimate={estimate} items={items} company={company} />
      <SiteImagePage estimate={estimate} siteImageUrl={siteImageUrl} />
    </Document>
  )
}
