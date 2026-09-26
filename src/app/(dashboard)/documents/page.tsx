import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import DocumentsPanel from './DocumentsPanel'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')
  const wsId    = membership.workspace_id
  const userRole = membership.role as string

  const [projectsRes, docsRes, specialtiesRes, deleteReqRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, workspace_id, description, start_date, end_date, created_at')
      .eq('workspace_id', wsId)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('documents')
      .select('id, name, file_name, display_name, specialty_id, project_id, storage_key, file_type, file_size, status, doc_status, version, version_number, doc_key, is_current, emission_date, author, notes, created_at, approved_by, approved_at, review_requested_by, review_requested_at, rejection_note, project:projects(name), specialty:specialties(name, code, category)')
      .eq('workspace_id', wsId)
      .neq('doc_status', 'deleted')
      .order('version_number', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('specialties')
      .select('id, name, code, category')
      .eq('is_active', true)
      .order('category')
      .order('name'),
    getAdminClient()
      .from('delete_requests')
      .select('id, document_id, reason, requested_by, created_at, document:documents(id, name, file_name, display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const projects       = projectsRes.data    || []
  const documents      = docsRes.data        || []
  const specialties    = specialtiesRes.data || []
  const deleteRequests = deleteReqRes.data   || []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#00C2FF]" />
            Documentos de Proyecto
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Documentos organizados por proyecto y disciplina · {documents.length} archivo{documents.length !== 1 ? 's' : ''} en Cloudflare R2
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          R2 conectado
        </div>
      </div>

      <DocumentsPanel
        documents={documents as any}
        projects={projects as any}
        specialties={specialties}
        workspaceId={wsId}
        userRole={userRole}
        deleteRequests={deleteRequests as any}
        currentUserId={user.id}
      />
    </div>
  )
}
