import { Document } from '@react-pdf/renderer'
import CoverPage from '@/components/pdf/CoverPage'
import DetailPage from '@/components/pdf/DetailPage'
import LayoutImagePage from '@/components/pdf/LayoutImagePage'
import { getPdfImageUrls } from '@/lib/pdf-assets'
import type { CompanySettings } from '@/types/database'
import type { Estimate, EstimateItem } from '@/types/estimate'

// 画像URL（CoverPage・DetailPage で使用）
export const PDF_IMAGE_URLS = getPdfImageUrls()

type Props = {
  estimate: Estimate
  items: EstimateItem[]
  company: CompanySettings
  layoutImageUrl?: string | null
}

export default function EstimatePDF({
  estimate,
  items,
  company,
  layoutImageUrl = null,
}: Props) {
  return (
    <Document title={`見積書_${estimate.estimate_no}`}>
      <CoverPage estimate={estimate} company={company} />
      <DetailPage estimate={estimate} items={items} company={company} />
      <LayoutImagePage estimate={estimate} layoutImageUrl={layoutImageUrl} />
    </Document>
  )
}
