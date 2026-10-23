'use client'

import { useState, useTransition } from 'react'
import { Building2, Users, FolderOpen, FileText, Trash2, ChevronDown, AlertTriangle, X, Loader2, RefreshCw } from 'lucide-react'
import { deleteWorkspace, changeWorkspacePlan } from './actions'

const PLANS = ['free', 'starter', 'obra', 'pro', 'contractor', 'partner', 'enterprise']

const PLAN_COLORS: Record<string, string> = {
  free:         'bg-slate-700 text-slate-300',
  starter:      'bg-blue-900 text-blue-300',
  obra:         'bg-yellow-900 text-yellow-300',
  pro:          'bg-indigo-900 text-indigo-300',
  contractor:   'bg-purple-900 text-purple-300',
  partner:      'bg-pink-900 text-pink-300',
  enterprise:   'bg-green-900 text-green-300',
}

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
  owner_id: string
  owner_email: string
  member_count: number
  project_count: number
  created_at: string
}

interface Kpis {
  totalWorkspaces: number
  totalUsers: number
  totalProjects: number
  totalDocs: number
}

interface Props {
  workspaces: Workspace[]
  kpis: Kpis
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SuperAdminPanel({ workspaces: initial, kpis }: Props) {
  const [workspaces, setWorkspaces] = useState(initial)
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [changingPlan, setChangingPlan] = useState<string | null>(null)

  function handleDeleteClick(ws: Workspace) {
    setDeleteTarget(ws)
    setConfirmText('')
    setError(null)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    setError(null)
    startTransition(async () => {
      const res = await deleteWorkspace(deleteTarget.id)
      if (res.error) {
        setError(res.error)
      } else {
        setWorkspaces(prev => prev.filter(w => w.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    })
  }

  async function handlePlanChange(wsId: string, newPlan: string) {
    setChangingPlan(wsId)
    setError(null)
    const res = await changeWorkspacePlan(wsId, newPlan)
    if (res.error) {
      setError(res.error)
    } else {
      setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, plan: newPlan } : w))
    }
    setChangingPlan(null)
  }

  const kpiItems = [
    { label: 'Workspaces', value: kpis.totalWorkspaces, icon: Building2, color: 'text-cyan-400' },
    { label: 'Usuarios', value: kpis.totalUsers, icon: Users, color: 'text-indigo-400' },
    { label: 'Proyectos', value: kpis.totalProjects, icon: FolderOpen, color: 'text-yellow-400' },
    { label: 'Documentos', value: kpis.totalDocs, icon: FileText, color: 'text-green-400' },
  ]

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpiItems.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-slate-400 text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Workspaces Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Workspaces ({workspaces.length})
          </h2>
          <a href="/super-admin" className="text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                <th className="px-6 py-3 text-left font-medium">Workspace</th>
                <th className="px-6 py-3 text-left font-medium">Owner</th>
                <th className="px-6 py-3 text-left font-medium">Plan</th>
                <th className="px-6 py-3 text-center font-medium">Miembros</th>
                <th className="px-6 py-3 text-center font-medium">Proyectos</th>
                <th className="px-6 py-3 text-left font-medium">Creado</th>
                <th className="px-6 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {workspaces.map(ws => (
                <tr key={ws.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{ws.name}</p>
                    <p className="text-slate-500 text-xs">{ws.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate">
                    {ws.owner_email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-flex items-center">
                      <select
                        value={ws.plan}
                        onChange={e => handlePlanChange(ws.id, e.target.value)}
                        disabled={changingPlan === ws.id}
                        className={`appearance-none pl-2 pr-6 py-1 rounded text-xs font-medium cursor-pointer border-0 outline-none ${PLAN_COLORS[ws.plan] ?? 'bg-slate-700 text-slate-300'}`}
                      >
                        {PLANS.map(p => (
                          <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>
                        ))}
                      </select>
                      {changingPlan === ws.id
                        ? <Loader2 className="absolute right-1 w-3 h-3 animate-spin text-slate-400" />
                        : <ChevronDown className="absolute right-1 w-3 h-3 text-slate-400 pointer-events-none" />
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">{ws.member_count}</td>
                  <td className="px-6 py-4 text-center text-slate-300">{ws.project_count}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                    {formatDate(ws.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteClick(ws)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar workspace"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {workspaces.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No hay workspaces registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-900/40 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Eliminar workspace</h3>
                <p className="text-slate-400 text-sm">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-4">
              Se eliminará <span className="font-semibold text-white">{deleteTarget.name}</span> junto con todos sus proyectos, documentos y miembros.
            </p>

            <p className="text-slate-400 text-xs mb-2">
              Escribe <span className="text-white font-mono">{deleteTarget.slug}</span> para confirmar:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={deleteTarget.slug}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 outline-none focus:border-red-500 mb-4"
            />

            {error && (
              <p className="text-red-400 text-xs mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={confirmText !== deleteTarget.slug || isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
