export type UserRole = 'owner' | 'admin' | 'manager' | 'engineer' | 'viewer'

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'blocked'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type DocumentStatus = 'draft' | 'review' | 'approved' | 'rejected'

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  plan: 'free' | 'pro' | 'contractor' | 'enterprise'
  features: Record<string, boolean>
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: UserRole
  joined_at: string
  user?: {
    id: string
    email: string
    full_name: string
    initials: string | null
    avatar_url: string | null
  }
}

export type OficioStatus = 'pendiente' | 'en_atencion' | 'respondido' | 'archivado'
export type OficioTipo   = 'entrada' | 'salida'

export interface Oficio {
  id: string
  workspace_id: string
  tipo: OficioTipo
  no_oficio: string | null
  asunto: string
  fecha_documento: string | null
  proyecto_id: string | null
  especialidad: string | null
  estado: OficioStatus
  remitente: string | null
  destinatario: string | null
  assignee_id: string | null
  storage_key: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  notas: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  frente: string | null
  project_type: string | null
  cover_image_url: string | null
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  name: string
  description: string | null
  specialty: string | null
  assignee_id: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  assignee?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export interface Document {
  id: string
  project_id: string
  name: string
  version: number
  file_url: string
  file_type: string
  status: DocumentStatus
  uploaded_by: string
  approved_by: string | null
  created_at: string
}

export interface Extraction {
  id: string
  document_id: string
  data_json: Record<string, unknown>
  created_by_ai: boolean
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  user?: {
    full_name: string
    avatar_url: string | null
  }
}
