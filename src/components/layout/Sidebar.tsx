'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import Logo from '@/components/Logo'
import {
  LayoutDashboard, CheckSquare, Calendar, Package,
  FileText, Bot, Settings, LogOut, ChevronRight, HardDrive, Mail
} from 'lucide-react'

const BASE_NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks',        icon: CheckSquare,     label: 'Tareas' },
  { href: '/calendar',     icon: Calendar,        label: 'Calendario' },
  { href: '/deliverables', icon: Package,         label: 'Entregables' },
  { href: '/documents',    icon: FileText,        label: 'Documentos' },
  { href: '/drive',        icon: HardDrive,       label: 'Drive', badge: 'NEW' },
  { href: '/ai-agent',     icon: Bot,             label: 'Agente AI' },
]

export default function Sidebar({ workspaceName, features }: { workspaceName: string; features?: Record<string, boolean> }) {
  const NAV = [
    ...BASE_NAV,
    ...(features?.oficios ? [{ href: '/oficios', icon: Mail, label: 'Oficios' }] : []),
  ]
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1A2744] flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <Logo size={34} />
        <div className="ml-3">
          <p className="text-white font-bold text-sm leading-none">Builtek</p>
          <p className="text-white/40 text-xs mt-0.5 truncate max-w-[140px]">{workspaceName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-[#00C2FF]/15 text-[#00C2FF]'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[9px] font-bold bg-[#00C2FF] text-[#1A2744] px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-0.5">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Configuración</span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
