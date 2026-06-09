'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateCompanySettings } from '@/actions/settings'
import type { CompanySettings } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  initialSettings: CompanySettings
}

export default function SettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)

  const updateField = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateCompanySettings({
        company_name: settings.company_name,
        department: settings.department,
        representative: settings.representative,
        postal_code: settings.postal_code,
        address: settings.address,
        tel: settings.tel,
        fax: settings.fax,
        email: settings.email,
        logo_text: settings.logo_text,
      })

      if (!result.success) {
        toast.error('保存に失敗しました', { description: result.error })
        return
      }

      toast.success('会社情報を保存しました')
    } catch (err) {
      toast.error('保存に失敗しました', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>会社情報</CardTitle>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="会社名" value={settings.company_name} onChange={(v) => updateField('company_name', v)} />
          <Field label="部署名" value={settings.department ?? ''} onChange={(v) => updateField('department', v)} />
          <Field label="代表者" value={settings.representative ?? ''} onChange={(v) => updateField('representative', v)} />
          <Field label="郵便番号" value={settings.postal_code ?? ''} onChange={(v) => updateField('postal_code', v)} />
          <Field label="住所" value={settings.address ?? ''} onChange={(v) => updateField('address', v)} className="md:col-span-2" />
          <Field label="TEL" value={settings.tel ?? ''} onChange={(v) => updateField('tel', v)} />
          <Field label="FAX" value={settings.fax ?? ''} onChange={(v) => updateField('fax', v)} />
          <Field label="メール" value={settings.email ?? ''} onChange={(v) => updateField('email', v)} />
          <Field label="ロゴテキスト" value={settings.logo_text ?? ''} onChange={(v) => updateField('logo_text', v)} />
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
