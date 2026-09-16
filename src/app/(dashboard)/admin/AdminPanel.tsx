'use client'

import { useState } from 'react'
import { Project, Workspace, WorkspaceMember, UserRole } from '@/types'
import { createProject, updateProject, deleteProject, updateWorkspace, updateMemberRole, removeMember, inviteMember, cancelInvite } from './actions'
import {
  Plus, Pencil, Trash2, X, FolderOpen, Users, Settings,
  Calendar, CheckCircle2, PauseCircle, Archive, Shield, Crown, UserCog, Eye, Wrench,
  Mail, Clock, Send, Link2, LinkIcon
} from 'lucide-react'

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  owner:    { label: 'Owner',    color: 'bg-purple-100 text-purple-700', icon: Crown },
  admin:    { label: 'Admin',    color: 'bg-red-100 text-red-700',       icon: Shield },
  manager:  { label: 'Manager',  color: 'bg-blue-100 text-blue-700',     icon: UserCog },
  engineer: { label: 'Engineer', color: 'bg-green-100 text-green-700',   icon: Wrench },
  viewer:   { label: 'Viewer',   color: 'bg-slate-100 text-slate-600',   icon: Eye },
}

const ROLE_PERMISSIONS: Record<string, { description: string; can: string[]; cannot: string[] }> = {
  owner: {
    description: 'Control total del workspace. Solo puede haber uno.',
    can: [
      'Todo lo que puede un Admin',
      'Gestionar billing y plan',
      'Eliminar el workspace',
      'Cambiar el rol de cualquier miembro',
    ],
    cannot: [],
  },
  admin: {
    description: 'Administrador del workspace con acceso casi completo.',
    can: [
      'Invitar y remover miembros',
      'Asignar y cambiar roles (excepto Owner)',
      'Crear, editar y eliminar proyectos',
      'Aprobar y rechazar documentos',
      'Crear y asignar tareas a cualquiera',
    ],
    cannot: [
      'Gestionar billing',
      'Eliminar el workspace',
      'Cambiar el rol del Owner',
    ],
  },
  manager: {
    description: 'Gestiona proyectos y tareas del equipo.',
    can: [
      'Crear y editar proyectos',
      'Crear tareas y asignarlas al equipo',
      'Subir y revisar documentos',
      'Ver todo el workspace',
    ],
    cannot: [
      'Eliminar proyectos',
      'Aprobar documentos',
      'Invitar o remover miembros',
      'Cambiar roles',
    ],
  },
  engineer: {
    description: 'Ejecutor técnico — actualiza su trabajo y sube documentos.',
    can: [
      'Actualizar el estado de sus tareas',
      'Subir documentos al proyecto',
      'Ver proyectos y tareas del workspace',
      'Agregar comentarios en tareas',
    ],
    cannot: [
      'Crear o eliminar proyectos',
      'Crear tareas nuevas',
      'Aprobar documentos',
      'Gestionar miembros',
    ],
  },
  viewer: {
    description: 'Acceso de solo lectura. No puede modificar nada.',
    can: [
      'Ver proyectos y tareas',
      'Ver documentos',
      'Ver miembros del workspace',
    ],
    cannot: [
      'Crear o editar cualquier cosa',
      'Subir documentos',
      'Agregar comentarios',
      'Gestionar miembros',
    ],
  },
}

function RoleDescription({ role }: { role: string }) {
  const info = ROLE_PERMISSIONS[role]
  if (!info) return null
  const cfg = ROLE_CONFIG[role as UserRole]

  return (
    <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2">
      <p className="text-slate-500 italic">{info.description}</p>
      <div className="grid grid-cols-1 gap-1">
        {info.can.map(item => (
          <div key={item} className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-px" />
            <span className="text-slate-600">{item}</span>
          </div>
        ))}
        {info.cannot.map(item => (
          <div key={item} className="flex items-start gap-1.5">
            <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-px" />
            <span className="text-slate-400">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type MemberWithProfile = WorkspaceMember & { email?: string | null }

function MemberRow({
  member, currentUserId, currentUserRole, canManage,
}: {
  member: MemberWithProfile
  currentUserId: string
  currentUserRole: UserRole
  canManage: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>(member.role)
  const [showDescription, setShowDescription] = useState(false)
  const isSelf = member.user_id === currentUserId
  const isOwner = member.role === 'owner'
  const canEdit = canManage && !isOwner && !isSelf
  const cfg = ROLE_CONFIG[member.role as UserRole] || ROLE_CONFIG.viewer
  const RoleIcon = cfg.icon

  const displayName = member.user?.full_name || member.email || member.user_id.slice(0, 8)

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value
    setSelectedRole(newRole)
    setShowDescription(true)
    setLoading(true)
    setError(null)
    const result = await updateMemberRole(member.user_id, newRole)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  async function handleRemove() {
    if (!confirm(`¿Remover a ${displayName} del workspace?`)) return
    setLoading(true)
    const result = await removeMember(member.user_id)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <div className={`rounded-xl border transition-colors ${isSelf ? 'bg-[#00C2FF]/5 border-[#00C2FF]/20' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#1A2744]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#1A2744]">
          {displayName.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1A2744] truncate">{displayName}</span>
            {isSelf && <span className="text-xs text-[#00C2FF] font-medium">(tú)</span>}
          </div>
          {member.email && <p className="text-xs text-slate-400 truncate">{member.email}</p>}
        </div>

        {/* Role badge / selector */}
        {canEdit ? (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              disabled={loading}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 disabled:opacity-50"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="engineer">Engineer</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="button"
              onClick={() => setShowDescription(v => !v)}
              title="Ver facultades del rol"
              className={`w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold border transition-colors ${showDescription ? 'bg-[#1A2744] text-white border-[#1A2744]' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}
            >
              ?
            </button>
          </div>
        ) : (
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
            <RoleIcon className="w-3 h-3" />
            {cfg.label}
          </span>
        )}

        {/* Remove button */}
        {canEdit && (
          <button
            onClick={handleRemove}
            disabled={loading}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}
      {showDescription && canEdit && (
        <div className="px-4 pb-3">
          <RoleDescription role={selectedRole} />
        </div>
      )}
    </div>
  )
}

interface PendingInvite {
  id: string
  email: string
  role: string
  created_at: string
}

function InviteForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('engineer')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    const result = await inviteMember(fd)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
      setSelectedRole('engineer')
    }
  }

  return (
    <div className="bg-[#1A2744]/3 border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Invitar miembro</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="email"
              type="email"
              required
              placeholder="correo@empresa.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]"
            />
          </div>
          <select
            name="role"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="engineer">Engineer</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A2744] text-white rounded-lg text-sm font-bold hover:bg-[#243660] disabled:opacity-60 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Enviando...' : 'Invitar'}
          </button>
        </div>

        <RoleDescription role={selectedRole} />

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">Invitación enviada. El usuario recibirá un email para unirse.</p>}
      </form>
    </div>
  )
}

function PendingInviteRow({ invite }: { invite: PendingInvite }) {
  const [loading, setLoading] = useState(false)
  const cfg = ROLE_CONFIG[invite.role as UserRole] || ROLE_CONFIG.viewer
  const RoleIcon = cfg.icon

  async function handleCancel() {
    if (!confirm(`¿Cancelar la invitación para ${invite.email}?`)) return
    setLoading(true)
    await cancelInvite(invite.id)
  }

  const sentDate = new Date(invite.created_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short',
  })

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-600 truncate">{invite.email}</p>
        <p className="text-xs text-slate-400">Invitado el {sentDate} · Pendiente de aceptar</p>
      </div>
      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
        <RoleIcon className="w-3 h-3" />
        {cfg.label}
      </span>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function TeamPanel({
  members, currentUserId, currentUserRole, pendingInvites,
}: {
  members: MemberWithProfile[]
  currentUserId: string
  currentUserRole: UserRole
  pendingInvites: PendingInvite[]
}) {
  const canManage = ['owner', 'admin'].includes(currentUserRole)

  return (
    <div className="max-w-2xl space-y-3">
      {canManage && <InviteForm />}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm font-semibold text-slate-700">
          Miembros activos
          <span className="ml-2 text-xs font-normal text-slate-400">{members.length}</span>
        </p>
      </div>
      {members.map(m => (
        <MemberRow
          key={m.user_id}
          member={m}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          canManage={canManage}
        />
      ))}

      {pendingInvites.length > 0 && (
        <>
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm font-semibold text-slate-700">
              Invitaciones pendientes
              <span className="ml-2 text-xs font-normal text-slate-400">{pendingInvites.length}</span>
            </p>
          </div>
          {pendingInvites.map(inv => (
            <PendingInviteRow key={inv.id} invite={inv} />
          ))}
        </>
      )}
    </div>
  )
}

const STATUS_CONFIG = {
  active:    { label: 'Activo',     color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  paused:    { label: 'Pausado',    color: 'bg-amber-100 text-amber-700',  icon: PauseCircle },
  completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700',    icon: CheckCircle2 },
  archived:  { label: 'Archivado',  color: 'bg-slate-100 text-slate-500',  icon: Archive },
}

function ProjectModal({
  project, onClose
}: {
  project?: Project | null
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!project

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = isEdit
      ? await updateProject(project!.id, fd)
      : await createProject(fd)
    if (result?.error) { setError(result.error); setLoading(false) }
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A2744]">
            {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
            <input name="name" required defaultValue={project?.name}
              placeholder="Ej: Carretera Federal Tramo A-B"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Descripción</label>
            <textarea name="description" rows={2} defaultValue={project?.description || ''}
              placeholder="Descripción breve del proyecto..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF] resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Fecha inicio</label>
              <input name="start_date" type="date" defaultValue={project?.start_date?.slice(0, 10) || ''}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Fecha fin</label>
              <input name="end_date" type="date" defaultValue={project?.end_date?.slice(0, 10) || ''}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Estado</label>
              <select name="status" defaultValue={project?.status}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="completed">Completado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ project, onEdit }: { project: Project; onEdit: (p: Project) => void }) {
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active

  async function handleDelete() {
    if (!confirm(`¿Eliminar el proyecto "${project.name}"? Se eliminarán todas sus tareas.`)) return
    await deleteProject(project.id)
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : null

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-[#1A2744]/5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <FolderOpen className="w-4 h-4 text-[#1A2744]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[#1A2744] text-sm leading-tight truncate">{project.name}</h3>
            {project.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(project)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
          {cfg.label}
        </span>

        {(project.start_date || project.end_date) && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>
              {formatDate(project.start_date)}
              {project.start_date && project.end_date && ' – '}
              {formatDate(project.end_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function WorkspaceSettings({ workspace, dropboxConnected }: { workspace: Workspace; dropboxConnected: boolean }) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    const result = await updateWorkspace(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) setError(result.error)
    else setSaved(true)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nombre del workspace</label>
          <input name="name" required defaultValue={workspace.name}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Plan</label>
          <div className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 capitalize">
            {workspace.plan}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}
        {saved && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-600">Cambios guardados correctamente.</div>}

        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 transition-colors">
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      {/* Dropbox */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 mt-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">Integraciones</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0061FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <LinkIcon className="w-4 h-4 text-[#0061FF]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A2744]">Dropbox</p>
              <p className="text-xs text-slate-400">Almacenamiento de documentos del proyecto</p>
            </div>
          </div>
          {dropboxConnected ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Conectado
            </span>
          ) : (
            <a
              href="/api/dropbox/auth"
              className="flex items-center gap-2 text-xs font-bold text-white bg-[#0061FF] hover:bg-[#0052d9] px-4 py-2 rounded-lg transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              Conectar Dropbox
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

type Tab = 'projects' | 'team' | 'settings'

const PLAN_LABELS: Record<string, { label: string; color: string; description: string }> = {
  free:       { label: 'Free',        color: 'bg-slate-100 text-slate-600',   description: 'Hasta 3 proyectos · 5 miembros · 1 GB' },
  starter:    { label: 'Starter',     color: 'bg-blue-100 text-blue-700',     description: 'Hasta 10 proyectos · 15 miembros · 10 GB' },
  pro:        { label: 'Pro',         color: 'bg-purple-100 text-purple-700', description: 'Proyectos ilimitados · 50 miembros · 100 GB' },
  enterprise: { label: 'Enterprise',  color: 'bg-amber-100 text-amber-700',   description: 'Sin límites · SLA · Soporte dedicado' },
}

export default function AdminPanel({
  projects, workspace, members, currentUserId, currentUserRole,
  currentUserEmail, currentUserName, pendingInvites, dropboxConnected,
}: {
  projects: Project[]
  workspace: Workspace
  members: MemberWithProfile[]
  currentUserId: string
  currentUserRole: UserRole
  currentUserEmail: string
  currentUserName: string
  pendingInvites: PendingInvite[]
  dropboxConnected: boolean
}) {
  const [tab, setTab] = useState<Tab>('projects')
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'projects', label: 'Proyectos', icon: FolderOpen },
    { id: 'team',     label: 'Equipo',    icon: Users },
    { id: 'settings', label: 'Config.',   icon: Settings },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Projects tab */}
      {tab === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {projects.length} proyecto{projects.length !== 1 ? 's' : ''} ·{' '}
              {projects.filter(p => p.status === 'active').length} activos
            </p>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
              <Plus className="w-4 h-4" />
              Nuevo proyecto
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-slate-300" />
              </div>
              <h2 className="text-lg font-bold text-[#1A2744] mb-2">Sin proyectos aún</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                Crea tu primer proyecto para empezar a gestionar tareas y documentos.
              </p>
              <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-[#1A2744] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#243660] transition-colors">
                <Plus className="w-4 h-4" />
                Crear proyecto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map(p => (
                <ProjectCard key={p.id} project={p} onEdit={setEditProject} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <TeamPanel
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          pendingInvites={pendingInvites}
        />
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-4">
          {/* Tarjeta de cuenta del usuario */}
          {(() => {
            const roleCfg = ROLE_CONFIG[currentUserRole] || ROLE_CONFIG.viewer
            const RoleIcon = roleCfg.icon
            const planCfg = PLAN_LABELS[workspace.plan] || PLAN_LABELS.free
            return (
              <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mi cuenta</p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1A2744]/10 flex items-center justify-center text-xl font-bold text-[#1A2744] flex-shrink-0">
                    {currentUserName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1A2744] truncate">{currentUserName}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUserEmail}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ml-auto flex-shrink-0 ${roleCfg.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleCfg.label}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Plan actual</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${planCfg.color}`}>
                      {planCfg.label}
                    </span>
                    <span className="text-xs text-slate-400">{planCfg.description}</span>
                  </div>
                </div>
              </div>
            )
          })()}

          <WorkspaceSettings workspace={workspace} dropboxConnected={dropboxConnected} />
        </div>
      )}

      {(showModal || editProject) && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null) }}
        />
      )}
    </div>
  )
}
