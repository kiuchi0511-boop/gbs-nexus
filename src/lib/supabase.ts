import { createBrowserClient } from '@supabase/ssr'

// ブラウザ用 Supabase クライアント
// シングルトンはセッション状態が古くなるため、呼び出しごとに生成する
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
