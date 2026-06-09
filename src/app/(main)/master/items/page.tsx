import { Suspense } from 'react'
import { getItemMaster } from '@/actions/items'
import ItemMasterTable from '@/components/master/ItemMasterTable'
import { Skeleton } from '@/components/ui/skeleton'

async function ItemsContent() {
  const data = await getItemMaster()
  return <ItemMasterTable initialData={data} />
}

function ItemsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function ItemsMasterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">工事項目マスタ</h1>
        <p className="text-sm text-muted-foreground">
          見積明細の標準項目管理（セルを編集すると自動保存されます）
        </p>
      </div>
      <Suspense fallback={<ItemsSkeleton />}>
        <ItemsContent />
      </Suspense>
    </div>
  )
}
