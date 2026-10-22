'use client'

import { useMemo } from 'react'
import { FileText, Users, LayoutGrid, TrendingUp } from 'lucide-react'

type Doc = {
  doc_type:    string | null
  file_type:   string | null
  sheet_count?: number | null
  author:      string | null
  specialty?:  { name: string; code: string; category?: string } | null
  doc_status:  string
  doc_key?:    string | null
  status:      string
  is_current:  boolean
}

type Props = {
  docs: Doc[]
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex flex-col gap-0.5">
      <span className="text-2xl font-bold text-[#1A2744]">{value}</span>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
    </div>
  )
}

export default function DocumentMetricsTab({ docs }: Props) {
  const metrics = useMemo(() => {
    const planos    = docs.filter(d => d.doc_type === 'PLA')
    const oficios   = docs.filter(d => d.doc_type === 'OFI')
    const otros     = docs.filter(d => d.doc_type !== 'PLA' && d.doc_type !== 'OFI')

    const totalSheets     = planos.reduce((s, d) => s + (d.sheet_count ?? 1), 0)
    const pdfSheets       = planos.filter(d => d.file_type === 'pdf')
                                  .reduce((s, d) => s + (d.sheet_count ?? 1), 0)
    const dwgSheets       = planos.filter(d => d.file_type === 'dwg' || d.file_type === 'dxf')
                                  .reduce((s, d) => s + (d.sheet_count ?? 1), 0)

    // Por especialidad (conteo de láminas)
    const bySpec: Record<string, { name: string; sheets: number; files: number }> = {}
    for (const d of planos) {
      const code = d.specialty?.code || d.doc_key?.split('-')[3] || 'SIN'
      const name = d.specialty?.name || code
      if (!bySpec[code]) bySpec[code] = { name, sheets: 0, files: 0 }
      bySpec[code].sheets += d.sheet_count ?? 1
      bySpec[code].files++
    }

    // Por autor (todos los documentos, no solo planos)
    const byAuthor: Record<string, number> = {}
    for (const d of docs) {
      const a = d.author?.trim() || 'Sin autor'
      byAuthor[a] = (byAuthor[a] ?? 0) + 1
    }

    // Archivos con múltiples láminas (sheet_count > 1)
    const multiSheet = planos.filter(d => (d.sheet_count ?? 1) > 1)

    return {
      totalDocs: docs.length,
      totalSheets,
      pdfSheets,
      dwgSheets,
      planosFiles: planos.length,
      oficiosCount: oficios.length,
      otrosCount: otros.length,
      bySpec: Object.entries(bySpec).sort((a, b) => b[1].sheets - a[1].sheets),
      byAuthor: Object.entries(byAuthor).sort((a, b) => b[1] - a[1]).slice(0, 8),
      multiSheet: multiSheet.length,
    }
  }, [docs])

  return (
    <div className="space-y-6 pb-8">

      {/* KPIs principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Planos totales" value={metrics.totalSheets} sub={`en ${metrics.planosFiles} archivo${metrics.planosFiles !== 1 ? 's' : ''}`} />
        <StatCard label="PDF" value={metrics.pdfSheets} sub="láminas en PDF" />
        <StatCard label="DWG / DXF" value={metrics.dwgSheets} sub="láminas en DWG" />
        <StatCard label="Total documentos" value={metrics.totalDocs} sub={`${metrics.oficiosCount} oficios · ${metrics.otrosCount} otros`} />
      </div>

      {metrics.multiSheet > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ {metrics.multiSheet} archivo{metrics.multiSheet !== 1 ? 's' : ''} con más de 1 lámina declarada — el conteo ya los incluye correctamente.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Por especialidad */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="text-sm font-bold text-[#1A2744]">Planos por especialidad</h3>
          </div>
          {metrics.bySpec.length === 0 ? (
            <p className="text-xs text-slate-400">Sin planos clasificados.</p>
          ) : (
            <div className="space-y-2">
              {metrics.bySpec.map(([code, { name, sheets, files }]) => {
                const pct = metrics.totalSheets > 0 ? Math.round((sheets / metrics.totalSheets) * 100) : 0
                return (
                  <div key={code}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-700">[{code}] {name}</span>
                      <span className="text-xs text-slate-500">{sheets} lám · {files} arch</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00C2FF] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Por autor */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="text-sm font-bold text-[#1A2744]">Documentos por autor</h3>
          </div>
          {metrics.byAuthor.length === 0 ? (
            <p className="text-xs text-slate-400">Sin datos de autor.</p>
          ) : (
            <div className="space-y-2">
              {metrics.byAuthor.map(([author, count]) => {
                const pct = metrics.totalDocs > 0 ? Math.round((count / metrics.totalDocs) * 100) : 0
                return (
                  <div key={author}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{author}</span>
                      <span className="text-xs text-slate-500">{count} doc</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1A2744] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Tipos de documento */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-[#00C2FF]" />
          <h3 className="text-sm font-bold text-[#1A2744]">Distribución por tipo</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Planos (PLA)', value: metrics.planosFiles, color: '#00C2FF' },
            { label: 'Oficios (OFI)', value: metrics.oficiosCount, color: '#1A2744' },
            { label: 'Otros', value: metrics.otrosCount, color: '#94a3b8' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-slate-700">{item.label}</span>
              <span className="text-xs font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
