import { Suspense } from 'react'
import { getEstimatesList } from '@/actions/estimates'
import EstimatesTable from '@/components/estimates/EstimatesTable'
import EstimatesTableSkeleton from '@/components/estimates/EstimatesTableSkeleton'

async function EstimatesContent() {
  const estimates = await getEstimatesList()
  return <EstimatesTable estimates={estimates} />
}

export default function EstimatesPage() {
  return (
    <Suspense fallback={<EstimatesTableSkeleton />}>
      <EstimatesContent />
    </Suspense>
  )
}
