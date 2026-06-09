'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  DollarSign,
  List,
  LogOut,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/estimates', label: '見積書一覧', icon: FileText },
  { href: '/estimates/new', label: '新規見積作成', icon: FilePlus },
  { href: '/master/prices', label: '単価マスタ', icon: DollarSign },
  { href: '/master/items', label: '工事項目マスタ', icon: List },
  { href: '/settings', label: '設定', icon: Settings },
] as const

export default function Sidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r bg-card">
      {/* 上部：ロゴ */}
      <div className="shrink-0 border-b px-6 py-5">
        <h1 className="text-lg font-bold tracking-tight">GBS nexus</h1>
        <p className="mt-1 text-xs text-muted-foreground">見積管理システム</p>
      </div>

      {/* 中部：ナビメニュー（縦並び） */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href === '/estimates' && pathname === '/estimates') ||
            (href !== '/dashboard' &&
              href !== '/estimates' &&
              (pathname === href || pathname.startsWith(href + '/')))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 下部：ログアウト（固定） */}
      <div className="mt-auto shrink-0 border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0" />
          ログアウト
        </Button>
      </div>
    </aside>
  )
}
