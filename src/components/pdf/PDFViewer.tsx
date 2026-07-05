'use client'

import { useEffect, useState } from 'react'
import { Font, PDFDownloadLink, PDFViewer as ReactPdfViewer } from '@react-pdf/renderer'
import EstimatePDF from '@/components/pdf/EstimatePDF'
import type { CompanySettings } from '@/types/database'
import type { Estimate, EstimateItem } from '@/types/estimate'

type Props = {
  estimate: Estimate
  items: EstimateItem[]
  company: CompanySettings
  siteImageUrl?: string | null
}

let fontRegistered = false

function registerFonts() {
  if (fontRegistered || typeof window === 'undefined') return
  Font.register({
    family: 'NotoSansJP',
    src: '/fonts/NotoSansJP-Regular.ttf',
  })
  fontRegistered = true
}

export default function PDFViewer({
  estimate,
  items,
  company,
  siteImageUrl = null,
}: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    registerFonts()
    setReady(true)
  }, [])

  if (!ready) {
    return <p className="p-8 text-muted-foreground">PDFを生成中...</p>
  }

  const fileName = `見積書_${estimate.estimate_no}.pdf`
  const document = (
    <EstimatePDF
      estimate={estimate}
      items={items}
      company={company}
      siteImageUrl={siteImageUrl}
    />
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDFプレビュー</h1>
        <PDFDownloadLink document={document} fileName={fileName}>
          {({ loading }) => (
            <button
              type="button"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? '生成中...' : 'PDFダウンロード'}
            </button>
          )}
        </PDFDownloadLink>
      </div>
      <div className="h-[calc(100vh-200px)] w-full overflow-hidden rounded-xl border">
        <ReactPdfViewer width={900} height={700} showToolbar>
          {document}
        </ReactPdfViewer>
      </div>
    </div>
  )
}
