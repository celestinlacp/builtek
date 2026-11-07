export type UserRole = 'owner' | 'admin' | 'manager' | 'engineer' | 'viewer'

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'blocked' | 'archived'

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

export interface StructureType {
  id: string
  workspace_id: string | null
  code: string
  name: string
  category: string | null
  icon: string | null
  kota_schema: Record<string, unknown>
  is_active: boolean
  created_at: string
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
  structure_type_id: string | null
  cover_image_url: string | null
  parent_project_id: string | null
  chainage_start: number | null
  chainage_end: number | null
  builtek_id: string | null
  is_inah: boolean
  cruce_vial: string | null
  cauces_federales: boolean
  kota_data?: Record<string, any> | null
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
  assignees?: { user_id: string; full_name: string | null; initials: string | null }[]
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

export interface Company {
  id: string
  workspace_id: string
  name: string
  short_name: string | null
  is_active: boolean
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

export interface PinData {
  document_id: string
  page: number
  x: number
  y: number
  label?: string
}

export interface Photo {
  id: string
  workspace_id: string
  project_id: string | null
  name: string | null
  captured_at: string
  uploaded_at: string
  uploaded_by: string | null
  storage_key_hot: string
  storage_key_cold: string
  file_size: number | null
  width: number | null
  height: number | null
  is_favorite: boolean
  tier_storage: 'hot' | 'cold'
  annotations_json: unknown | null
  exif_data: unknown | null
  created_at: string
  tags?: PhotoTag[]
  pin_data: PinData | null
}

export interface PhotoTag {
  id: string
  workspace_id: string
  name: string
  color: string
  created_by: string | null
  created_at: string
}

export interface PhotoTagAssignment {
  photo_id: string
  tag_id: string
}
