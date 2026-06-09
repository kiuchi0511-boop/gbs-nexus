import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-[240px] min-h-screen flex-1 p-8">{children}</main>
    </div>
  )
}
