'use client'

import { useState } from 'react'
import { Project, Workspace, WorkspaceMember, UserRole, Company } from '@/types'
import { createProject, updateProject, deleteProject, updateWorkspace, updateMemberRole, removeMember, inviteMember, cancelInvite, createCompany, updateCompany, deleteCompany, updateMemberProfile, updateDocKey, updateDocSegments } from './actions'
import { deleteDocumentVersion } from '../documents/actions'
import {
  Plus, Pencil, Trash2, X, FolderOpen, Users, Settings,
  Calendar, CheckCircle2, PauseCircle, Archive, Shield, Crown, UserCog, Eye, Wrench,
  Mail, Clock, Send, Link2, LinkIcon, Building2, Zap, HardDrive, FileText, Files, Loader2,
  Database, Factory, ChevronDown, ChevronUp, Search, BookOpen, Info, Layers, Check, Share2,
} from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toggleFeature, createMicNomenclature, updateMicNomenclature, deleteMicNomenclature, seedAllMicNomenclatures, syncIdentificadoresFromProjects, backfillMicIdentifiers, createMesaTecnica, updateMesaTecnica, deleteMesaTecnica } from './actions'
import { ShareProjectModal } from './ShareProjectModal'

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

type MemberWithProfile = WorkspaceMember & {
  email?:           string | null
  last_seen_at?: string | null
  user?: { id: string; full_name: string | null; avatar_url: string | null; phone: string | null; initials: string | null } | null
}

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
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(member.user?.full_name || '')
  const [editPhone, setEditPhone] = useState(member.user?.phone || '')
  const [saving, setSaving] = useState(false)
  const isSelf  = member.user_id === currentUserId
  const isOwner = member.role === 'owner'
  const canEdit = canManage && !isOwner && !isSelf
  const canEditProfile = canManage || isSelf   // owner/admin pueden editar a todos; cualquiera puede editarse a sí mismo
  const cfg = ROLE_CONFIG[member.role as UserRole] || ROLE_CONFIG.viewer
  const RoleIcon = cfg.icon

  const displayName = member.user?.full_name || member.email || member.user_id.slice(0, 8)

  async function handleSaveProfile() {
    if (!editName.trim()) return
    setSaving(true); setError(null)
    const result = await updateMemberProfile(member.user_id, {
      full_name: editName,
      phone:     editPhone.trim() || null,
    })
    setSaving(false)
    if (result?.error) setError(result.error)
    else setEditing(false)
  }

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
            {member.user?.phone && (
              <span className="text-xs text-slate-400 font-mono">{member.user.phone}</span>
            )}
            {canEditProfile && !editing && (
              <button onClick={() => { setEditing(true); setEditName(member.user?.full_name || ''); setEditPhone(member.user?.phone || '') }}
                title="Editar nombre y teléfono"
                className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-[#00C2FF] hover:bg-slate-100 transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
          {member.email && <p className="text-xs text-slate-400 truncate">{member.email}</p>}
          <div className="flex items-center gap-3 mt-0.5">
            {member.last_seen_at ? (
              <p className="text-xs text-slate-400">
                Última conexión: {new Date(member.last_seen_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <p className="text-xs text-slate-300">Sin conexiones registradas</p>
            )}
            {member.joined_at && (
              <p className="text-xs text-slate-300">
                · Miembro desde {new Date(member.joined_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
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

      {/* Formulario edición inline de nombre y teléfono */}
      {editing && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 mt-1">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Nombre completo</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveProfile(); if (e.key === 'Escape') setEditing(false) }}
                placeholder="Nombre completo"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
              />
            </div>
            <div className="w-40">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Teléfono celular</label>
              <input
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveProfile(); if (e.key === 'Escape') setEditing(false) }}
                placeholder="+52 55 0000 0000"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
              />
            </div>
            <button onClick={handleSaveProfile} disabled={saving || !editName.trim()}
              className="px-3 py-1.5 bg-[#1A2744] text-white text-xs font-bold rounded-lg hover:bg-[#243560] disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Guardar
            </button>
            <button onClick={() => setEditing(false)}
              className="px-3 py-1.5 border border-slate-200 text-xs text-slate-500 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

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
  project, projects, onClose
}: {
  project?: Project | null
  projects: Project[]
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Frente</label>
              <select name="frente" defaultValue={project?.frente || ''}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                <option value="">Sin frente</option>
                <option value="Frente 1">Frente 1</option>
                <option value="Frente 2">Frente 2</option>
                <option value="Frente 3">Frente 3</option>
                <option value="Frente 4">Frente 4</option>
                <option value="Frente 5">Frente 5</option>
                <option value="Frente 6">Frente 6</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tipo de proyecto</label>
              <select name="project_type" defaultValue={project?.project_type || ''}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                <option value="">Sin tipo</option>
                <option value="Estación">Estación</option>
                <option value="Puente Ferroviario">Puente Ferroviario</option>
                <option value="Puente Vehicular">Puente Vehicular</option>
                <option value="Paso Inferior Ferroviario">Paso Inf. Ferroviario</option>
                <option value="Paso Superior Ferroviario">Paso Sup. Ferroviario</option>
                <option value="Puente Peatonal">Puente Peatonal</option>
                <option value="Viaducto">Viaducto</option>
                <option value="Túnel">Túnel</option>
                <option value="Muro">Muro</option>
                <option value="Cruce a Nivel">Cruce a Nivel</option>
                <option value="Drenaje Transversal">Drenaje Transversal</option>
                <option value="Vía Ferrea">Vía Ferrea</option>
                <option value="Vialidad">Vialidad</option>
                <option value="Cuneta">Cuneta</option>
                <option value="Parapeto">Parapeto</option>
                <option value="Mesa">Mesa</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {isEdit && (
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">ID Builtek</label>
                <input name="mic_identifier" defaultValue={project?.mic_identifier || ''}
                  placeholder="Ej: 0001 o 0001.02"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
              </div>
            </div>
          )}

          {/* Proyecto padre (subproyecto) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Proyecto padre (opcional)</label>
              <select name="parent_project_id"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                <option value="">Ninguno (proyecto raíz)</option>
                {projects.filter(p => !p.parent_project_id && p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.mic_identifier ? `${p.mic_identifier} — ` : ''}{p.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Si es subproyecto, el ID Builtek se hereda automáticamente.</p>
            </div>
          )}

          {/* Cruce vial */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Cruce vial</label>
            <input name="cruce_vial" defaultValue={project?.cruce_vial || ''}
              placeholder="Ej: CV-001, KM+450"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
          </div>

          {/* Badges especiales */}
          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" name="is_inah" defaultChecked={project?.is_inah ?? false}
                className="w-4 h-4 rounded border-slate-300 accent-yellow-500 cursor-pointer" />
              <span className="text-sm font-semibold text-slate-700">Proyecto INAH</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-bold">INAH</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" name="cauces_federales" defaultChecked={project?.cauces_federales ?? false}
                className="w-4 h-4 rounded border-slate-300 accent-blue-500 cursor-pointer" />
              <span className="text-sm font-semibold text-slate-700">Cauces Federales</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">CF</span>
            </label>
          </div>

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

function ProjectCard({ project, onEdit, onShare }: { project: Project; onEdit: (p: Project) => void; onShare: (p: Project) => void }) {
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
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#1A2744] text-sm leading-tight truncate">{project.name}</h3>
              {project.mic_identifier && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1A2744]/8 text-[#1A2744]/60 flex-shrink-0">
                  {project.mic_identifier}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onShare(project)} title="Compartir archivos"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF] transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
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

      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
          {project.frente && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#00C2FF]/10 text-[#0099CC]">
              {project.frente}
            </span>
          )}
          {project.project_type && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">
              {project.project_type}
            </span>
          )}
          {project.is_inah && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-yellow-100 text-yellow-700">
              INAH
            </span>
          )}
          {project.cauces_federales && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-700">
              Cauces Federales
            </span>
          )}
          {project.cruce_vial && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-100 text-orange-600">
              {project.cruce_vial}
            </span>
          )}
        </div>

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

// ── Almacenamiento ────────────────────────────────────────────────────────────

const PLAN_STORAGE_BYTES: Record<string, number> = {
  free:       1    * 1024 * 1024 * 1024,
  starter:    10   * 1024 * 1024 * 1024,
  pro:        100  * 1024 * 1024 * 1024,
  contractor: 2000 * 1024 * 1024 * 1024,
  enterprise: 1000 * 1024 * 1024 * 1024,
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function StorageGauge({ pct }: { pct: number }) {
  const fill  = Math.min(pct, 1)
  const color = fill > 0.9 ? '#ef4444' : fill > 0.7 ? '#f59e0b' : '#00C2FF'
  return (
    <svg width="200" height="114" viewBox="0 0 200 114" className="overflow-visible">
      <path d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
      <path d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 - fill * 100}
        style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s' }}
      />
    </svg>
  )
}

function StoragePanel({
  workspace, storageUsed, storageByModule, storageByUser,
}: {
  workspace: Workspace
  storageUsed: number
  storageByModule: { documents: number; oficios: number; drive: number }
  storageByUser: { userId: string; name: string; initials: string; bytes: number }[]
}) {
  const limit     = PLAN_STORAGE_BYTES[workspace.plan] || PLAN_STORAGE_BYTES.free
  const pct       = storageUsed / limit
  const available = Math.max(limit - storageUsed, 0)

  const modules = [
    { label: 'Documentos', bytes: storageByModule.documents, icon: Files,       color: 'bg-[#00C2FF]' },
    { label: 'Oficios',    bytes: storageByModule.oficios,   icon: FileText,    color: 'bg-indigo-400' },
    { label: 'Drive',      bytes: storageByModule.drive,     icon: HardDrive,   color: 'bg-violet-400' },
  ]

  return (
    <div className="max-w-lg space-y-4">

      {/* Gauge */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col items-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 self-start">
          Uso de almacenamiento
        </p>
        <div className="relative mt-2">
          <StorageGauge pct={pct} />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span className="text-3xl font-black text-[#1A2744] leading-none">
              {(pct * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {formatBytes(storageUsed)} de {formatBytes(limit)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full mt-5">
          <div className="bg-slate-50 rounded-xl px-3 py-3 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">Usado</p>
            <p className="text-sm font-bold text-[#1A2744]">{formatBytes(storageUsed)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-3 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">Libre</p>
            <p className="text-sm font-bold text-green-600">{formatBytes(available)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-3 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-slate-600">{formatBytes(limit)}</p>
          </div>
        </div>
      </div>

      {/* Desglose */}
      <div className="bg-white border border-slate-100 rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Desglose por módulo
        </p>
        <div className="space-y-4">
          {modules.map(({ label, bytes, icon: Icon, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600 font-medium">{label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">{formatBytes(bytes)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${Math.min((bytes / limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desglose por usuario */}
      {storageByUser.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Desglose por usuario
          </p>
          <div className="space-y-3">
            {storageByUser.map(({ userId, name, initials, bytes }) => (
              <div key={userId}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1A2744]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-[#1A2744]">{initials}</span>
                    </div>
                    <span className="text-sm text-slate-600 font-medium truncate max-w-[180px]">{name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 flex-shrink-0">{formatBytes(bytes)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1A2744]/30 transition-all duration-500"
                    style={{ width: `${Math.min((bytes / storageUsed) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerta de capacidad */}
      {pct > 0.8 && (
        <div className={`border rounded-xl p-4 flex items-start gap-3 ${pct > 0.9 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pct > 0.9 ? 'bg-red-100' : 'bg-amber-100'}`}>
            <Zap className={`w-4 h-4 ${pct > 0.9 ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${pct > 0.9 ? 'text-red-800' : 'text-amber-800'}`}>
              {pct > 0.9 ? 'Almacenamiento crítico' : 'Almacenamiento casi lleno'}
            </p>
            <p className={`text-xs mt-0.5 ${pct > 0.9 ? 'text-red-600' : 'text-amber-600'}`}>
              Has usado el {(pct * 100).toFixed(0)}% de tu plan {workspace.plan}. Considera actualizar para evitar interrupciones.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

type Tab = 'projects' | 'team' | 'settings' | 'workspace' | 'storage' | 'empresas' | 'database' | 'nomenclaturas' | 'builtek-id' | 'bd-oficios'

type MicNomenclature = { id: string; segment: string; code: string; name: string; description: string | null; is_active: boolean; sort_order: number }

type MesaTecnica = { id: string; nombre: string; codigo: string | null; especialidad: string | null; is_active: boolean; sort_order: number }

const PLAN_LABELS: Record<string, { label: string; color: string; description: string }> = {
  free:       { label: 'Free',        color: 'bg-slate-100 text-slate-600',   description: 'Hasta 3 proyectos · 5 miembros · 1 GB' },
  starter:    { label: 'Starter',     color: 'bg-blue-100 text-blue-700',     description: 'Hasta 10 proyectos · 15 miembros · 10 GB' },
  pro:        { label: 'Pro',         color: 'bg-purple-100 text-purple-700', description: 'Proyectos ilimitados · 50 miembros · 100 GB' },
  contractor: { label: 'Contractor',  color: 'bg-cyan-100 text-cyan-700',     description: 'Hasta 20 seats · 2 TB · Soporte prioritario' },
  enterprise: { label: 'Enterprise',  color: 'bg-amber-100 text-amber-700',   description: 'Sin límites · SLA · Soporte dedicado' },
}

const AVAILABLE_MODULES = [
  {
    key: 'oficios',
    label: 'Oficios',
    description: 'Control de correspondencia oficial — oficios de entrada y salida',
    icon: Mail,
  },
]

function WorkspacePanel({
  workspace, members, projects, currentUserRole,
}: {
  workspace: Workspace
  members: MemberWithProfile[]
  projects: Project[]
  currentUserRole: UserRole
}) {
  const planCfg = PLAN_LABELS[workspace.plan] || PLAN_LABELS.free
  const [toggling, setToggling] = useState<string | null>(null)
  const canManageModules = ['owner', 'admin'].includes(currentUserRole)

  async function handleToggle(feature: string, enabled: boolean) {
    setToggling(feature)
    await toggleFeature(feature, enabled)
    setToggling(null)
  }

  const createdDate = new Date(workspace.created_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-2xl space-y-4">

      {/* Info general */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Información del workspace</p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Nombre</p>
            <p className="font-semibold text-[#1A2744]">{workspace.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Slug</p>
            <p className="font-mono text-slate-600">{workspace.slug}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Plan</p>
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${planCfg.color}`}>
              {planCfg.label}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Creado</p>
            <p className="text-slate-600">{createdDate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Miembros</p>
            <p className="font-semibold text-[#1A2744]">{members.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Proyectos</p>
            <p className="font-semibold text-[#1A2744]">{projects.length}</p>
          </div>
        </div>
      </div>

      {/* Workspace ID */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Workspace ID</p>
        <p className="text-xs text-slate-400 mb-2">Úsalo para activar módulos o configuraciones en Supabase</p>
        <code className="block text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 select-all break-all">
          {workspace.id}
        </code>
      </div>

      {/* Módulos */}
      <div className="bg-white border border-slate-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Módulos adicionales</p>
        </div>
        <div className="space-y-4">
          {AVAILABLE_MODULES.map(mod => {
            const isEnabled = !!(workspace.features?.[mod.key])
            const ModIcon = mod.icon
            return (
              <div key={mod.key} className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isEnabled ? 'bg-[#00C2FF]/10' : 'bg-slate-100'}`}>
                    <ModIcon className={`w-4 h-4 ${isEnabled ? 'text-[#00C2FF]' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{mod.label}</p>
                    <p className="text-xs text-slate-400">{mod.description}</p>
                  </div>
                </div>
                {canManageModules ? (
                  <button
                    onClick={() => handleToggle(mod.key, !isEnabled)}
                    disabled={toggling === mod.key}
                    title={isEnabled ? 'Desactivar módulo' : 'Activar módulo'}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${isEnabled ? 'bg-[#00C2FF]' : 'bg-slate-200'}`}
                  >
                    {toggling === mod.key
                      ? <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 animate-spin text-white" />
                      : <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    }
                  </button>
                ) : (
                  isEnabled && (
                    <span className="text-[10px] text-[#00C2FF] font-semibold bg-[#00C2FF]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      Activo
                    </span>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Miembros */}
      <div className="bg-white border border-slate-100 rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Equipo
          <span className="ml-2 font-normal text-slate-400">{members.length} miembros</span>
        </p>
        <div className="space-y-2">
          {members.map(m => {
            const displayName = m.user?.full_name || m.email || m.user_id.slice(0, 8)
            const cfg = ROLE_CONFIG[m.role as UserRole] || ROLE_CONFIG.viewer
            const RoleIcon = cfg.icon
            return (
              <div key={m.user_id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-[#1A2744]/10 flex items-center justify-center text-xs font-bold text-[#1A2744] flex-shrink-0">
                  {m.user?.initials || displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2744] truncate">{displayName}</p>
                  {m.email && <p className="text-xs text-slate-400 truncate">{m.email}</p>}
                </div>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>
                  <RoleIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

// ── Panel de Empresas ─────────────────────────────────────────────────────────

type BiDoc = {
  id: string
  name: string
  file_name: string | null
  display_name: string | null
  ref_code: string | null
  file_type: string | null
  file_size: number | null
  status: string
  doc_status: string
  version: number
  version_number: number | null
  doc_key: string | null
  is_current: boolean
  emission_date: string | null
  author: string | null
  notes: string | null
  created_at: string
  project_id: string | null
  specialty_id: string | null
  company_id: string | null
  project?: { name: string } | null
  specialty?: { name: string; code: string } | null
  company?: { name: string; short_name: string | null } | null
  uploaded_by?: string | null
  uploader?: { full_name: string | null; initials: string | null } | null
}

function EmpresasPanel({ companies, workspaceId, userRole }: {
  companies: Company[]
  workspaceId: string
  userRole: UserRole
}) {
  const [showForm,    setShowForm]    = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [name,        setName]        = useState('')
  const [shortName,   setShortName]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const isAdmin = ['owner', 'admin', 'manager'].includes(userRole)

  function openCreate() { setName(''); setShortName(''); setEditCompany(null); setShowForm(true); setError(null) }
  function openEdit(c: Company) { setName(c.name); setShortName(c.short_name || ''); setEditCompany(c); setShowForm(true); setError(null) }
  function cancel() { setShowForm(false); setEditCompany(null); setError(null) }

  async function handleSave() {
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError(null)
    const result = editCompany
      ? await updateCompany(editCompany.id, { name, short_name: shortName || null, is_active: editCompany.is_active })
      : await createCompany({ name, short_name: shortName || null })
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    setShowForm(false); setEditCompany(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta empresa? Solo podrás hacerlo si no tiene documentos asociados.')) return
    await deleteCompany(id)
  }

  async function handleToggleActive(c: Company) {
    await updateCompany(c.id, { name: c.name, short_name: c.short_name, is_active: !c.is_active })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {companies.length} empresa{companies.length !== 1 ? 's' : ''} registrada{companies.length !== 1 ? 's' : ''}
        </p>
        {isAdmin && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
            <Plus className="w-4 h-4" />
            Nueva empresa
          </button>
        )}
      </div>

      {/* Formulario crear/editar */}
      {showForm && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#1A2744]">{editCompany ? 'Editar empresa' : 'Nueva empresa'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                Nombre completo <span className="text-red-400">*</span>
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ej: Ingenieros Civiles Asociados"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                Siglas / Nombre corto
              </label>
              <input value={shortName} onChange={e => setShortName(e.target.value)}
                placeholder="Ej: ICA, CICSA, INGENIEROS MX"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button onClick={cancel}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 py-2 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {saving ? 'Guardando...' : editCompany ? 'Guardar cambios' : 'Crear empresa'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {companies.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
          <Factory className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400 mb-1">Sin empresas registradas</p>
          <p className="text-xs text-slate-300">Agrega las empresas que elaboran los documentos del proyecto.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Siglas</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                {isAdmin && <th className="px-4 py-2.5 w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-[#1A2744]">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.short_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {c.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)} title="Editar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#1A2744]">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} title="Eliminar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Panel Builtek ID ──────────────────────────────────────────────────────────

function BuilditekIDPanel({ docs, projects, nomenclatures, isOwner }: {
  docs: BiDoc[]
  projects: Project[]
  nomenclatures: MicNomenclature[]
  isOwner: boolean
}) {
  const [search,       setSearch]       = useState('')
  const [filterProj,   setFilterProj]   = useState('all')
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [editSegs,     setEditSegs]     = useState({ troncal: '', identificador: '', tipo_doc: '', especialidad: '', tipo_plano: '', version: 1 })

  const troncalOpts       = nomenclatures.filter(n => n.segment === 'TRONCAL'       && n.is_active)
  const identificadorOpts = nomenclatures.filter(n => n.segment === 'IDENTIFICADOR' && n.is_active)
  const tipoDocOpts       = nomenclatures.filter(n => n.segment === 'TIPO_DOC'      && n.is_active)
  const especialidadOpts  = nomenclatures.filter(n => n.segment === 'ESPECIALIDAD'  && n.is_active)
  const tipoPlanoOpts     = nomenclatures.filter(n => n.segment === 'TIPO_PLANO'    && n.is_active)
  const rootProjects      = projects.filter(p => !p.parent_project_id)

  const filtered = docs
    .filter(d => d.is_current !== false)
    .filter(d => {
      if (filterProj !== 'all' && d.project_id !== filterProj) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          d.name?.toLowerCase().includes(q) ||
          d.file_name?.toLowerCase().includes(q) ||
          d.doc_key?.toLowerCase().includes(q) ||
          d.ref_code?.toLowerCase().includes(q) ||
          d.project?.name?.toLowerCase().includes(q)
        )
      }
      return true
    })

  function parseSegs(doc: BiDoc) {
    const parts = doc.doc_key?.split('-') ?? []
    return {
      troncal:       parts[0] ?? '',
      identificador: parts[1] ?? '',
      tipo_doc:      parts[2] ?? '',
      especialidad:  parts[3] ?? '',
      tipo_plano:    parts[4] ?? '',
      version:       doc.version_number ?? 1,
    }
  }

  function openEdit(doc: BiDoc) {
    setEditingId(doc.id)
    setEditSegs(parseSegs(doc))
  }

  async function handleSave(docId: string) {
    setSaving(true)
    await updateDocSegments(docId, editSegs)
    setSaving(false)
    setEditingId(null)
  }

  async function handleDeleteVersion(docId: string) {
    if (!confirm('¿Eliminar esta versión? La versión anterior quedará como activa.')) return
    setDeletingId(docId)
    await deleteDocumentVersion(docId)
    setDeletingId(null)
  }

  const SelCell = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: MicNomenclature[] }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="font-mono text-[10px] border border-[#00C2FF] rounded px-1 py-0.5 bg-white focus:outline-none w-full">
      <option value="">—</option>
      {options.map(o => <option key={o.id} value={o.code}>{o.code} — {o.name}</option>)}
    </select>
  )

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, ID..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
        </div>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none bg-white">
          <option value="all">Todos los proyectos</option>
          {rootProjects.map(p => {
            const subs = projects.filter(s => s.parent_project_id === p.id)
            return (
              <optgroup key={p.id} label={p.name}>
                <option value={p.id}>{p.name}</option>
                {subs.map(s => <option key={s.id} value={s.id}>↳ {s.name}</option>)}
              </optgroup>
            )
          })}
        </select>
        <span className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} registros</span>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">ID Builtek</th>
              <th className="text-left px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wide">Proyecto</th>
              <th className="text-center px-3 py-2.5 font-bold text-[#00C2FF] uppercase tracking-wide">TRONCAL</th>
              <th className="text-center px-3 py-2.5 font-bold text-[#00C2FF] uppercase tracking-wide">IDENTIFICADOR</th>
              <th className="text-center px-3 py-2.5 font-bold text-[#00C2FF] uppercase tracking-wide">TIPO_DOC</th>
              <th className="text-center px-3 py-2.5 font-bold text-[#00C2FF] uppercase tracking-wide">ESPECIALIDAD</th>
              <th className="text-center px-3 py-2.5 font-bold text-[#00C2FF] uppercase tracking-wide">TIPO_PLANO</th>
              <th className="text-center px-3 py-2.5 font-bold text-[#00C2FF] uppercase tracking-wide">VERSIÓN</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">Sin resultados</td></tr>
            ) : filtered.map(doc => {
              const segs      = parseSegs(doc)
              const fullId    = doc.doc_key
                ? `${doc.doc_key}-${String(doc.version_number ?? 1).padStart(4, '0')}`
                : doc.ref_code || '—'
              const isEditing = editingId === doc.id
              const docName   = doc.display_name || doc.file_name || doc.name

              return (
                <tr key={doc.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                  {/* ID completo */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-mono text-[10px] bg-[#1A2744]/5 text-[#1A2744] px-1.5 py-0.5 rounded font-semibold">
                      {isEditing
                        ? `${editSegs.troncal || '?'}-${editSegs.identificador || '?'}-${editSegs.tipo_doc || '?'}-${editSegs.especialidad || '?'}-${editSegs.tipo_plano || '?'}-${String(editSegs.version).padStart(4, '0')}`
                        : fullId}
                    </span>
                  </td>
                  {/* Nombre */}
                  <td className="px-3 py-2.5 max-w-[160px]">
                    <p className="font-medium text-[#1A2744] truncate" title={docName}>{docName}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{doc.file_type || ''}</p>
                  </td>
                  {/* Proyecto */}
                  <td className="px-3 py-2.5 text-slate-500 max-w-[120px] truncate whitespace-nowrap">
                    {doc.project?.name || '—'}
                  </td>
                  {/* Segmentos */}
                  {isEditing ? (
                    <>
                      <td className="px-2 py-1.5 w-28">
                        <SelCell value={editSegs.troncal} onChange={v => setEditSegs(s => ({ ...s, troncal: v }))} options={troncalOpts} />
                      </td>
                      <td className="px-2 py-1.5 w-36">
                        <SelCell value={editSegs.identificador} onChange={v => setEditSegs(s => ({ ...s, identificador: v }))} options={identificadorOpts} />
                      </td>
                      <td className="px-2 py-1.5 w-28">
                        <SelCell value={editSegs.tipo_doc} onChange={v => setEditSegs(s => ({ ...s, tipo_doc: v }))} options={tipoDocOpts} />
                      </td>
                      <td className="px-2 py-1.5 w-32">
                        <SelCell value={editSegs.especialidad} onChange={v => setEditSegs(s => ({ ...s, especialidad: v }))} options={especialidadOpts} />
                      </td>
                      <td className="px-2 py-1.5 w-28">
                        <SelCell value={editSegs.tipo_plano} onChange={v => setEditSegs(s => ({ ...s, tipo_plano: v }))} options={tipoPlanoOpts} />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <input type="number" min={1} value={editSegs.version} onChange={e => setEditSegs(s => ({ ...s, version: parseInt(e.target.value) || 1 }))}
                          className="font-mono text-[10px] border border-[#00C2FF] rounded px-1.5 py-0.5 w-full focus:outline-none" />
                      </td>
                    </>
                  ) : (
                    <>
                      {[segs.troncal, segs.identificador, segs.tipo_doc, segs.especialidad, segs.tipo_plano].map((seg, i) => (
                        <td key={i} className="px-3 py-2.5 text-center">
                          {seg
                            ? <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">{seg}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                          {String(segs.version).padStart(4, '0')}
                        </span>
                      </td>
                    </>
                  )}
                  {/* Acciones */}
                  <td className="px-2 py-2.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSave(doc.id)} disabled={saving}
                          className="w-6 h-6 flex items-center justify-center rounded bg-green-100 hover:bg-green-200 text-green-700">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(doc)} title="Editar segmentos"
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                          <Pencil className="w-3 h-3" />
                        </button>
                        {isOwner && (
                          <button onClick={() => handleDeleteVersion(doc.id)} disabled={deletingId === doc.id}
                            title="Eliminar esta versión"
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-300 hover:text-red-500 disabled:opacity-50">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Panel Base de Datos (BI) ───────────────────────────────────────────────────

function DatabasePanel({ docs, projects }: { docs: BiDoc[]; projects: Project[] }) {
  const [search,       setSearch]       = useState('')
  const [filterProj,   setFilterProj]   = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType,   setFilterType]   = useState('all')
  const [sortField,    setSortField]    = useState<'created_at' | 'ref_code' | 'name' | 'project'>('created_at')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc')
  const [editingDocKey, setEditingDocKey] = useState<string | null>(null)
  const [editDocKeyVal, setEditDocKeyVal] = useState('')
  const [savingDocKey,  setSavingDocKey]  = useState(false)

  async function handleSaveDocKey(docId: string) {
    setSavingDocKey(true)
    await updateDocKey(docId, editDocKeyVal)
    setSavingDocKey(false)
    setEditingDocKey(null)
  }

  const fileTypes = [...new Set(docs.map(d => d.file_type).filter(Boolean))] as string[]
  const rootProjects = projects.filter(p => !p.parent_project_id)

  const filtered = docs
    .filter(d => d.is_current !== false)
    .filter(d => {
      if (filterProj   !== 'all' && d.project_id !== filterProj) return false
      if (filterStatus !== 'all' && d.status     !== filterStatus) return false
      if (filterType   !== 'all' && d.file_type  !== filterType)  return false
      if (search) {
        const q = search.toLowerCase()
        return (
          d.name?.toLowerCase().includes(q) ||
          d.file_name?.toLowerCase().includes(q) ||
          d.doc_key?.toLowerCase().includes(q) ||
          d.ref_code?.toLowerCase().includes(q) ||
          d.author?.toLowerCase().includes(q) ||
          d.project?.name?.toLowerCase().includes(q) ||
          d.company?.name?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      let va: string, vb: string
      if (sortField === 'ref_code') { va = a.ref_code || ''; vb = b.ref_code || '' }
      else if (sortField === 'name') { va = a.display_name || a.file_name || a.name; vb = b.display_name || b.file_name || b.name }
      else if (sortField === 'project') { va = a.project?.name || ''; vb = b.project?.name || '' }
      else { va = a.created_at; vb = b.created_at }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-300" />
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-[#00C2FF]" /> : <ChevronUp className="w-3 h-3 text-[#00C2FF]" />
  }

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft:    { label: 'ELAB', color: 'bg-slate-100 text-slate-500' },
    review:   { label: 'REV',  color: 'bg-amber-100 text-amber-700' },
    approved: { label: 'APR',  color: 'bg-green-100 text-green-700' },
    rejected: { label: 'OBS',  color: 'bg-red-100 text-red-600'    },
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ID, autor..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
        </div>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
          <option value="all">Todos los proyectos</option>
          {rootProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
          <option value="all">Todos los estados</option>
          <option value="draft">ELAB</option>
          <option value="review">REV</option>
          <option value="approved">APR</option>
          <option value="rejected">OBS</option>
        </select>
        {fileTypes.length > 0 && (
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
            <option value="all">Todos los tipos</option>
            {fileTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} registros</span>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-3 py-2.5">
                  <button onClick={() => toggleSort('ref_code')} className="flex items-center gap-1 font-semibold text-slate-500 uppercase tracking-wide hover:text-[#1A2744]">
                    ID Builtek <SortIcon field="ref_code" />
                  </button>
                </th>
                <th className="text-left px-3 py-2.5">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 font-semibold text-slate-500 uppercase tracking-wide hover:text-[#1A2744]">
                    Nombre <SortIcon field="name" />
                  </button>
                </th>
                <th className="text-left px-3 py-2.5">
                  <button onClick={() => toggleSort('project')} className="flex items-center gap-1 font-semibold text-slate-500 uppercase tracking-wide hover:text-[#1A2744]">
                    Proyecto <SortIcon field="project" />
                  </button>
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Disciplina</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Versión</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Tamaño</th>
                <th className="text-left px-3 py-2.5">
                  <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 font-semibold text-slate-500 uppercase tracking-wide hover:text-[#1A2744]">
                    Subido <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Subido por</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Fecha versión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                    {search || filterProj !== 'all' || filterStatus !== 'all' || filterType !== 'all'
                      ? 'Sin resultados para estos filtros'
                      : 'No hay documentos aún'}
                  </td>
                </tr>
              ) : filtered.map(doc => {
                const stCfg = STATUS_LABEL[doc.status] ?? STATUS_LABEL.draft
                const docName = doc.display_name || doc.file_name || doc.name
                const fullDocKey = doc.doc_key
                  ? `${doc.doc_key}-${String(doc.version_number ?? 1).padStart(4, '0')}`
                  : null
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      {editingDocKey === doc.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={editDocKeyVal}
                            onChange={e => setEditDocKeyVal(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveDocKey(doc.id); if (e.key === 'Escape') setEditingDocKey(null) }}
                            className="font-mono text-[10px] border border-[#00C2FF] rounded px-1.5 py-0.5 w-48 focus:outline-none"
                            placeholder="TQM-0004-INF-GECT-GEN-0001"
                          />
                          <button onClick={() => handleSaveDocKey(doc.id)} disabled={savingDocKey}
                            className="w-5 h-5 flex items-center justify-center rounded bg-green-100 hover:bg-green-200 text-green-700">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => setEditingDocKey(null)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <span className="font-mono text-[10px] bg-[#1A2744]/5 text-[#1A2744] px-1.5 py-0.5 rounded font-semibold">
                            {fullDocKey || doc.ref_code || '—'}
                          </span>
                          <button
                            onClick={() => { setEditingDocKey(doc.id); setEditDocKeyVal(fullDocKey || doc.doc_key || '') }}
                            className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400"
                            title="Editar ID Builtek">
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="font-medium text-[#1A2744] truncate" title={docName}>{docName}</p>
                      {doc.doc_key && doc.ref_code && (
                        <p className="text-[10px] text-slate-400 font-mono truncate">{doc.ref_code}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[140px] truncate">{doc.project?.name || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {doc.specialty ? (
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{doc.specialty.code}</span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate">
                      {doc.company?.short_name || doc.company?.name || doc.author || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono">
                      v{String(doc.version_number ?? doc.version).padStart(4, '0')}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stCfg.color}`}>{stCfg.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 font-mono uppercase">{doc.file_type || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400">{doc.file_size ? formatBytes(doc.file_size) : '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {doc.uploader ? (
                        <span className="flex items-center gap-1.5">
                          {doc.uploader.initials && (
                            <span className="w-5 h-5 rounded-full bg-[#1A2744]/10 text-[#1A2744] text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                              {doc.uploader.initials}
                            </span>
                          )}
                          <span className="text-slate-600 text-[11px]">{doc.uploader.full_name || doc.uploader.initials || '—'}</span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                      {doc.emission_date
                        ? new Date(doc.emission_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── BD Oficios — Mesas Técnicas ──────────────────────────────────────────────

function MesasTecnicasPanel({
  mesas,
  especialidades,
}: {
  mesas: MesaTecnica[]
  especialidades: { code: string; name: string }[]
}) {
  const router = useRouter()
  const [showForm,    setShowForm]    = useState(false)
  const [editItem,    setEditItem]    = useState<MesaTecnica | null>(null)
  const [formNombre,  setFormNombre]  = useState('')
  const [formCodigo,  setFormCodigo]  = useState('')
  const [formEsp,     setFormEsp]     = useState('')
  const [formOrder,   setFormOrder]   = useState(0)
  const [formActive,  setFormActive]  = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  function openCreate() {
    setEditItem(null)
    setFormNombre(''); setFormCodigo(''); setFormEsp(''); setFormOrder(mesas.length + 1); setFormActive(true)
    setShowForm(true); setError(null)
  }

  function openEdit(item: MesaTecnica) {
    setEditItem(item)
    setFormNombre(item.nombre); setFormCodigo(item.codigo || ''); setFormEsp(item.especialidad || '')
    setFormOrder(item.sort_order); setFormActive(item.is_active)
    setShowForm(true); setError(null)
  }

  async function handleSave() {
    if (!formNombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError(null)
    const payload = {
      nombre:       formNombre.trim(),
      codigo:       formCodigo.trim() || null,
      especialidad: formEsp || null,
      is_active:    formActive,
      sort_order:   formOrder,
    }
    const result = editItem
      ? await updateMesaTecnica(editItem.id, payload)
      : await createMesaTecnica(payload)
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    setShowForm(false); router.refresh()
  }

  async function handleDelete(item: MesaTecnica) {
    if (!confirm(`¿Eliminar la mesa "${item.nombre}"? Los oficios vinculados quedarán sin mesa asignada.`)) return
    const res = await deleteMesaTecnica(item.id)
    if (res?.error) { alert(res.error); return }
    router.refresh()
  }

  const activeMesas   = mesas.filter(m => m.is_active)
  const inactiveMesas = mesas.filter(m => !m.is_active)

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-slate-500 max-w-lg">
          Catálogo de mesas técnicas para clasificar y filtrar oficios por destinatario.
          Cada mesa se asocia a una especialidad del catálogo MIC.
        </p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A2744] text-white text-sm font-semibold hover:bg-[#233366] transition-colors">
          <Plus className="w-4 h-4" />
          Nueva mesa
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-[#1A2744] text-sm">{editItem ? 'Editar mesa' : 'Nueva mesa técnica'}</h3>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nombre literal *</label>
              <input value={formNombre} onChange={e => setFormNombre(e.target.value)}
                placeholder="Ej: Mesa de Arquitectura e Imagen Urbana"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Código corto</label>
              <input value={formCodigo} onChange={e => setFormCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: MESA-ARQ"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00C2FF]" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Especialidad</label>
              <select value={formEsp} onChange={e => setFormEsp(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]">
                <option value="">Sin especialidad</option>
                {especialidades.map(e => (
                  <option key={e.code} value={e.code}>{e.code} — {e.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 block mb-1">Orden</label>
                <input type="number" value={formOrder} onChange={e => setFormOrder(Number(e.target.value))} min={0}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]" />
              </div>
              {editItem && (
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="mesa-active" checked={formActive} onChange={e => setFormActive(e.target.checked)}
                    className="rounded" />
                  <label htmlFor="mesa-active" className="text-sm text-slate-600">Activa</label>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#00C2FF] text-white text-sm font-semibold hover:bg-[#00aee6] disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editItem ? 'Guardar cambios' : 'Crear mesa'}
            </button>
          </div>
        </div>
      )}

      {/* Lista activas */}
      {activeMesas.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-400 text-sm">
          <Database className="w-8 h-8 mx-auto mb-3 opacity-40" />
          No hay mesas técnicas. Crea la primera.
        </div>
      )}

      {activeMesas.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Activas ({activeMesas.length})</p>
          {activeMesas.map(mesa => {
            const espLabel = especialidades.find(e => e.code === mesa.especialidad)
            return (
              <div key={mesa.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-[#1A2744] text-sm truncate">{mesa.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {mesa.codigo && (
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{mesa.codigo}</span>
                      )}
                      {espLabel && (
                        <span className="text-xs text-[#00C2FF] font-semibold">{espLabel.code} — {espLabel.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(mesa)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(mesa)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista inactivas */}
      {inactiveMesas.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600">
            Inactivas ({inactiveMesas.length})
          </summary>
          <div className="space-y-2 mt-2">
            {inactiveMesas.map(mesa => (
              <div key={mesa.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 gap-3 opacity-60">
                <div className="min-w-0">
                  <p className="font-medium text-slate-500 text-sm truncate">{mesa.nombre}</p>
                  {mesa.codigo && <p className="text-xs font-mono text-slate-400">{mesa.codigo}</p>}
                </div>
                <button onClick={() => openEdit(mesa)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

const MIC_SEGMENTS = ['TRONCAL', 'IDENTIFICADOR', 'TIPO_DOC', 'ESPECIALIDAD', 'TIPO_PLANO'] as const

function NomenclaturasPanel({ nomenclatures, workspaceId }: { nomenclatures: MicNomenclature[]; workspaceId: string }) {
  const router = useRouter()
  const [activeSegment, setActiveSegment] = useState<string>('TIPO_PLANO')
  const [showForm,      setShowForm]      = useState(false)
  const [editItem,      setEditItem]      = useState<MicNomenclature | null>(null)
  const [formCode,      setFormCode]      = useState('')
  const [formName,      setFormName]      = useState('')
  const [formDesc,      setFormDesc]      = useState('')
  const [formOrder,     setFormOrder]     = useState(0)
  const [formActive,    setFormActive]    = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [seeding,       setSeeding]       = useState(false)
  const [syncing,       setSyncing]       = useState(false)
  const [backfilling,   setBackfilling]   = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Auto-seed si la tabla está vacía
  useEffect(() => {
    if (nomenclatures.length === 0) {
      seedAllMicNomenclatures().then(() => router.refresh())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const segmentItems = nomenclatures.filter(n => n.segment === activeSegment)

  function openCreate() {
    setEditItem(null)
    setFormCode(''); setFormName(''); setFormDesc(''); setFormOrder(segmentItems.length + 1); setFormActive(true)
    setShowForm(true); setError(null)
  }

  function openEdit(item: MicNomenclature) {
    setEditItem(item)
    setFormCode(item.code); setFormName(item.name); setFormDesc(item.description || '')
    setFormOrder(item.sort_order); setFormActive(item.is_active)
    setShowForm(true); setError(null)
  }

  async function handleSave() {
    if (!formCode.trim() || !formName.trim()) { setError('Código y nombre son requeridos'); return }
    setSaving(true); setError(null)
    const result = editItem
      ? await updateMicNomenclature(editItem.id, { code: formCode, name: formName, description: formDesc || null, is_active: formActive, sort_order: formOrder })
      : await createMicNomenclature({ segment: activeSegment, code: formCode, name: formName, description: formDesc || null, sort_order: formOrder })
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    setShowForm(false)
    router.refresh()
  }

  async function handleDelete(item: MicNomenclature) {
    if (!confirm(`¿Eliminar [${item.code}] ${item.name}?`)) return
    await deleteMicNomenclature(item.id)
    router.refresh()
  }

  async function handleSeedAll() {
    setSeeding(true)
    await seedAllMicNomenclatures()
    setSeeding(false)
    router.refresh()
  }

  async function handleSyncProjects() {
    setSyncing(true)
    await syncIdentificadoresFromProjects()
    setSyncing(false)
    router.refresh()
  }

  async function handleBackfill() {
    if (!confirm('¿Asignar identificadores automáticos a todos los proyectos que no tienen uno? Esta acción no se puede deshacer.')) return
    setBackfilling(true)
    const res = await backfillMicIdentifiers()
    setBackfilling(false)
    if (res?.error) { alert(res.error); return }
    alert(`${(res as any).assigned} proyecto(s) actualizados.`)
    router.refresh()
  }

  const segmentDescriptions: Record<string, string> = {
    TRONCAL:       'Clave del proyecto troncal (ej: TQM = Tren México-Querétaro)',
    IDENTIFICADOR: 'Subtramo o frente de trabajo (ej: F012 = Frente 12, 0000 = Global)',
    TIPO_DOC:      'Naturaleza del documento (ej: PLA = Plano, MEM = Memorias, ESP = Especificaciones)',
    ESPECIALIDAD:  'Disciplina de ingeniería (ej: EEST = Estructuras, AARQ = Arquitectura)',
    TIPO_PLANO:    'Tipo de vista o presentación del plano (ej: PLT = Planta, COR = Corte)',
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-500 max-w-lg">
            Catálogo de segmentos del ID Builtek.<br />
            <span className="font-mono text-[#00C2FF] text-xs">TRONCAL-IDENTIFICADOR-TIPO_DOC-ESPECIALIDAD-TIPO_PLANO-0001</span>
          </p>
        </div>
        <button onClick={handleSeedAll} disabled={seeding}
          title="Agrega entradas base que falten — no sobreescribe las existentes"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60">
          {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
          Completar catálogo
        </button>
      </div>

      {/* Selector de segmento */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {MIC_SEGMENTS.map(seg => (
          <button key={seg} onClick={() => { setActiveSegment(seg); setShowForm(false) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSegment === seg ? 'bg-[#1A2744] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {seg}
          </button>
        ))}
      </div>

      {/* Descripción del segmento activo */}
      <p className="text-xs text-slate-400 mb-4 italic">{segmentDescriptions[activeSegment]}</p>

      {/* Formulario inline */}
      {showForm && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-[#1A2744] uppercase tracking-wide">
            {editItem ? 'Editar entrada' : `Nueva entrada — ${activeSegment}`}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Código *</label>
              <input value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())}
                placeholder="Ej: COR"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Nombre *</label>
              <input value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="Ej: Corte"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Descripción</label>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                placeholder="Descripción opcional"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Orden</label>
                <input type="number" value={formOrder} onChange={e => setFormOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
              </div>
              {editItem && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer pb-2">
                  <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)}
                    className="w-4 h-4 accent-[#1A2744]" />
                  Activo
                </label>
              )}
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !formCode.trim() || !formName.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {editItem ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {activeSegment} — {segmentItems.length} entrada{segmentItems.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {/* Botones IDENTIFICADOR */}
            {activeSegment === 'IDENTIFICADOR' && (
              <>
                <button onClick={handleBackfill} disabled={backfilling}
                  title="Asigna un ID Builtek a todos los proyectos que aún no tienen uno"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-50 disabled:opacity-60">
                  {backfilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Asignar pendientes
                </button>
                <button onClick={handleSyncProjects} disabled={syncing}
                  title="Sincroniza la tabla de identificadores con los proyectos"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 text-violet-600 text-xs font-semibold hover:bg-violet-50 disabled:opacity-60">
                  {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  Desde proyectos
                </button>
              </>
            )}
            {/* No mostrar botón Agregar para TRONCAL (es fijo: TQM) */}
            {activeSegment !== 'TRONCAL' && (
              <button onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660]">
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            )}
          </div>
        </div>

        {/* Banner informativo para TRONCAL */}
        {activeSegment === 'TRONCAL' && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              El TRONCAL identifica el proyecto principal y es fijo para todo el workspace. Solo debe existir un valor: <span className="font-mono font-bold">TQM</span>.
            </p>
          </div>
        )}

        {segmentItems.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Sin entradas para este segmento.</p>
            {activeSegment === 'IDENTIFICADOR' ? (
              <button onClick={handleSyncProjects} disabled={syncing}
                className="mt-3 text-xs text-violet-500 hover:text-violet-700 font-medium flex items-center gap-1 mx-auto">
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                Crear desde proyectos →
              </button>
            ) : (
              <button onClick={handleSeedAll} disabled={seeding}
                className="mt-3 text-xs text-[#00C2FF] hover:text-[#0099CC] font-medium">
                Completar catálogo →
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide w-24">Código</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide hidden md:table-cell">Descripción</th>
                <th className="text-center px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide w-20">Estado</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...segmentItems].sort((a, b) => a.sort_order - b.sort_order).map(item => (
                <tr key={item.id} className={`hover:bg-slate-50 ${!item.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-bold text-[#1A2744] bg-[#00C2FF]/10 text-[#0099CC] px-2 py-0.5 rounded text-xs">{item.code}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{item.name}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs hidden md:table-cell">{item.description || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {item.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(item)} title="Editar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {/* TRONCAL no se puede borrar */}
                      {activeSegment !== 'TRONCAL' && (
                        <button onClick={() => handleDelete(item)} title="Eliminar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function AdminPanel({
  projects, workspace, members, currentUserId, currentUserRole,
  currentUserEmail, currentUserName, pendingInvites, dropboxConnected,
  storageUsed, storageByModule, storageByUser, companies, biDocs, workspaceId, micNomenclatures, mesasTecnicas,
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
  storageUsed: number
  storageByModule: { documents: number; oficios: number; drive: number }
  storageByUser: { userId: string; name: string; initials: string; bytes: number }[]
  companies: Company[]
  biDocs: BiDoc[]
  workspaceId: string
  micNomenclatures: MicNomenclature[]
  mesasTecnicas: MesaTecnica[]
}) {
  const [tab, setTab] = useState<Tab>('projects')
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [shareProject, setShareProject] = useState<Project | null>(null)
  const [filterInah,           setFilterInah]           = useState(false)
  const [filterCaucesFederales, setFilterCaucesFederales] = useState(false)
  const [filterCruceVial,      setFilterCruceVial]      = useState('')
  const [searchProjects,       setSearchProjects]       = useState('')
  const [showDbDropdown,       setShowDbDropdown]       = useState(false)

  const DB_TABS = ['bd-oficios', 'database', 'builtek-id'] as const
  const isDbTab = DB_TABS.includes(tab as typeof DB_TABS[number])
  const dbSubTabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'bd-oficios',  label: 'BD Oficios',    icon: FileText },
    { id: 'database',    label: 'Base de Datos',  icon: Database },
    { id: 'builtek-id',  label: 'Builtek ID',     icon: Layers   },
  ]
  const dbActiveLabel = tab === 'bd-oficios' ? 'BD Oficios' : tab === 'builtek-id' ? 'Builtek ID' : tab === 'database' ? 'Base de Datos' : 'Base de datos'

  const mainTabsBefore: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'projects',      label: 'Proyectos',     icon: FolderOpen },
    { id: 'empresas',      label: 'Empresas',       icon: Factory    },
    { id: 'nomenclaturas', label: 'ID Builtek',      icon: BookOpen   },
  ]
  const mainTabsAfter: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'team',      label: 'Equipo',         icon: Users     },
    { id: 'workspace', label: 'Workspace',      icon: Building2 },
    { id: 'storage',   label: 'Almacenamiento', icon: HardDrive },
    { id: 'settings',  label: 'Config.',        icon: Settings  },
  ]

  return (
    <div>
      {shareProject && (
        <ShareProjectModal
          projectId={shareProject.id}
          projectName={shareProject.name}
          onClose={() => setShareProject(null)}
        />
      )}

      {/* Tabs */}
      {showDbDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setShowDbDropdown(false)} />
      )}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {mainTabsBefore.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}

        {/* Dropdown Base de datos */}
        <div className="relative">
          <button onClick={() => setShowDbDropdown(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDbTab ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Database className="w-4 h-4" />
            {isDbTab ? dbActiveLabel : 'Base de datos'}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showDbDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
              {dbSubTabs.map(({ id, label, icon: Icon }) => (
                <button key={id}
                  onClick={() => { setTab(id); setShowDbDropdown(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                    tab === id ? 'bg-slate-50 text-[#1A2744] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {mainTabsAfter.map(({ id, label, icon: Icon }) => (
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
      {tab === 'projects' && (() => {
        const allRootProjects = projects.filter(p => !p.parent_project_id)
        const cruceVialOptions = [...new Set(projects.filter(p => p.cruce_vial).map(p => p.cruce_vial!))]
          .sort()
        const q = searchProjects.toLowerCase().trim()
        const rootProjects = allRootProjects
          .filter(p => !q || [p.name, p.mic_identifier, p.frente, p.project_type, p.description].some(v => v?.toLowerCase().includes(q)))
          .filter(p => !filterInah           || p.is_inah)
          .filter(p => !filterCaucesFederales || p.cauces_federales)
          .filter(p => !filterCruceVial      || p.cruce_vial === filterCruceVial)
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">
                {rootProjects.length} proyecto{rootProjects.length !== 1 ? 's' : ''} ·{' '}
                {rootProjects.filter(p => p.status === 'active').length} activos
              </p>
              {['owner', 'admin', 'manager'].includes(currentUserRole) && (
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
                  <Plus className="w-4 h-4" />
                  Nuevo proyecto
                </button>
              )}
            </div>

            {/* Buscador */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                value={searchProjects}
                onChange={e => setSearchProjects(e.target.value)}
                placeholder="Buscar por nombre, ID, frente, tipo..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF]"
              />
              {searchProjects && (
                <button onClick={() => setSearchProjects('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setFilterInah(v => !v)}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors border ${
                  filterInah
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-yellow-300 hover:text-yellow-600'
                }`}
              >
                INAH
              </button>
              <button
                onClick={() => setFilterCaucesFederales(v => !v)}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors border ${
                  filterCaucesFederales
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                Cauces Federales
              </button>
              {cruceVialOptions.length > 0 && (
                <select
                  value={filterCruceVial}
                  onChange={e => setFilterCruceVial(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 focus:outline-none focus:border-[#00C2FF]"
                >
                  <option value="">Cruces viales</option>
                  {cruceVialOptions.map(cv => (
                    <option key={cv} value={cv}>{cv}</option>
                  ))}
                </select>
              )}
              {(filterInah || filterCaucesFederales || filterCruceVial) && (
                <button
                  onClick={() => { setFilterInah(false); setFilterCaucesFederales(false); setFilterCruceVial(''); setSearchProjects('') }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {rootProjects.length === 0 ? (
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
              <div className="space-y-4">
                {rootProjects.map(p => {
                  const subs = projects.filter(s => s.parent_project_id === p.id)
                  return (
                    <div key={p.id}>
                      <ProjectCard project={p} onEdit={setEditProject} onShare={setShareProject} />
                      {subs.length > 0 && (
                        <div className="ml-6 mt-2 space-y-2 border-l-2 border-slate-100 pl-4">
                          {subs.map(s => (
                            <ProjectCard key={s.id} project={s} onEdit={setEditProject} onShare={setShareProject} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* Team tab */}
      {tab === 'team' && (
        <TeamPanel
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          pendingInvites={pendingInvites}
        />
      )}

      {/* Workspace tab */}
      {tab === 'workspace' && (
        <WorkspacePanel workspace={workspace} members={members} projects={projects} currentUserRole={currentUserRole} />
      )}

      {/* Storage tab */}
      {tab === 'storage' && (
        <StoragePanel
          workspace={workspace}
          storageUsed={storageUsed}
          storageByModule={storageByModule}
          storageByUser={storageByUser}
        />
      )}

      {/* Empresas tab */}
      {tab === 'empresas' && (
        <EmpresasPanel
          companies={companies}
          workspaceId={workspaceId}
          userRole={currentUserRole}
        />
      )}

      {/* Nomenclaturas ID Builtek tab */}
      {tab === 'nomenclaturas' && (
        <NomenclaturasPanel
          nomenclatures={micNomenclatures}
          workspaceId={workspaceId}
        />
      )}

      {/* BD Oficios — Mesas Técnicas tab */}
      {tab === 'bd-oficios' && (
        <MesasTecnicasPanel
          mesas={mesasTecnicas}
          especialidades={micNomenclatures
            .filter(n => n.segment === 'ESPECIALIDAD' && n.is_active)
            .map(n => ({ code: n.code, name: n.name }))}
        />
      )}

      {/* Base de Datos tab */}
      {tab === 'database' && (
        <DatabasePanel docs={biDocs} projects={projects} />
      )}

      {/* Builtek ID tab */}
      {tab === 'builtek-id' && (
        <BuilditekIDPanel docs={biDocs} projects={projects} nomenclatures={micNomenclatures} isOwner={currentUserRole === 'owner'} />
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

          {/* Workspace ID — para activar módulos custom en Supabase */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Workspace ID</p>
            <p className="text-xs text-slate-400 mb-2">Usa este ID para activar módulos en Supabase (ej: Oficios para un workspace)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 select-all">
                {workspace.id}
              </code>
            </div>
          </div>

          <WorkspaceSettings workspace={workspace} dropboxConnected={dropboxConnected} />
        </div>
      )}

      {(showModal || editProject) && (
        <ProjectModal
          project={editProject}
          projects={projects}
          onClose={() => { setShowModal(false); setEditProject(null) }}
        />
      )}
    </div>
  )
}
