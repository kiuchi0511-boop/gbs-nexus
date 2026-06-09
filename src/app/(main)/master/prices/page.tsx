import { Suspense } from 'react'
import { getPriceMaster } from '@/actions/prices'
import PriceMasterTable from '@/components/master/PriceMasterTable'
import { Skeleton } from '@/components/ui/skeleton'

async function PricesContent() {
  const data = await getPriceMaster()
  return <PriceMasterTable initialData={data} />
}

function PricesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function PricesMasterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">単価マスタ</h1>
        <p className="text-sm text-muted-foreground">
          GBS㎡単価の管理（セルを編集すると自動保存されます）
        </p>
      </div>
      <Suspense fallback={<PricesSkeleton />}>
        <PricesContent />
      </Suspense>
    </div>
  )
}
