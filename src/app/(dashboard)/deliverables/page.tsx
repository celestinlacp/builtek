import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'

export default async function DeliverablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <Package className="w-6 h-6 text-[#00C2FF]" />
          Entregables
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Seguimiento de entregables por proyecto y disciplina</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-lg font-bold text-[#1A2744] mb-2">Módulo en desarrollo</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Matriz de entregables, fechas contractuales y estado de revisión. Disponible próximamente.
        </p>
      </div>
    </div>
  )
}
