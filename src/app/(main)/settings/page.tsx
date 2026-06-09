import { Suspense } from 'react'
import { getCompanySettings } from '@/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'
import { Skeleton } from '@/components/ui/skeleton'

async function SettingsContent() {
  const settings = await getCompanySettings()
  return <SettingsForm initialSettings={settings} />
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">
          PDFに表示する会社情報を管理します
        </p>
      </div>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  )
}
