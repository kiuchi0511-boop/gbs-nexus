import { getDashboardData } from '@/actions/estimates'
import DashboardView from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <DashboardView data={data} />
}
