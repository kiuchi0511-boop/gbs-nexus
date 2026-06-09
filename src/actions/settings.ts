'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { DEFAULT_COMPANY_SETTINGS, type CompanySettings } from '@/types/database'

export type UpdateCompanySettingsInput = Omit<CompanySettings, 'id' | 'updated_at'>

export type SettingsResult =
  | { success: true }
  | { success: false; error: string }

// 会社設定を取得する
export async function getCompanySettings(): Promise<CompanySettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return DEFAULT_COMPANY_SETTINGS
  }

  return data as CompanySettings
}

// 会社設定を保存する
export async function updateCompanySettings(
  input: UpdateCompanySettingsInput
): Promise<SettingsResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('company_settings')
      .update({
        company_name: input.company_name,
        department: input.department,
        representative: input.representative,
        postal_code: input.postal_code,
        address: input.address,
        tel: input.tel,
        fax: input.fax,
        email: input.email,
        logo_text: input.logo_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    if (error) {
      console.error('[updateCompanySettings] error:', error)
      return { success: false, error: `保存に失敗しました: ${error.message}` }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('[updateCompanySettings] unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
    }
  }
}
