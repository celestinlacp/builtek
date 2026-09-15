'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export async function createWorkspace(formData: FormData) {
  // 1. Verificar sesión con cliente normal
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  // 2. Usar service role para bypass de RLS en operaciones de servidor
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const name = (formData.get('workspace_name') as string).trim()
  const slug = toSlug(name) + '-' + Math.random().toString(36).slice(2, 6)

  const { data: workspace, error: wsError } = await admin
    .from('workspaces')
    .insert({ name, slug, owner_id: user.id, plan: 'free' })
    .select('id')
    .single()

  if (wsError) return { error: wsError.message }

  const { error: memberError } = await admin
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })

  if (memberError) return { error: memberError.message }

  return { success: true }
}
