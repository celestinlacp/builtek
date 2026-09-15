'use client'

import { Bell, Search } from 'lucide-react'

export default function Topbar({ userName }: { userName: string }) {
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar tareas, documentos, proyectos..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF] transition-all"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00C2FF] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 bg-[#1A2744] rounded-lg flex items-center justify-center">
          <span className="text-[#00C2FF] text-xs font-bold">{initials}</span>
        </div>
      </div>
    </header>
  )
}
