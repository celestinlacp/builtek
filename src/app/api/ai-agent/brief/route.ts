import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: m } = await supabase
    .from('workspace_members')
    .select('role, workspace_id')
    .eq('user_id', user.id)
    .single()
  if (m?.role !== 'owner') return null
  return { user, workspaceId: m.workspace_id }
}

// GET /api/ai-agent/brief?projectId=xxx
export async function GET(req: NextRequest) {
  const auth = await getOwner()
  if (!auth) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  const { data } = await admin()
    .from('projects')
    .select('id, name, cota_brief')
    .eq('id', projectId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  return NextResponse.json({ brief: data?.cota_brief ?? '' })
}

// PUT /api/ai-agent/brief { projectId, brief }
export async function PUT(req: NextRequest) {
  const auth = await getOwner()
  if (!auth) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const { projectId, brief } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  const { error } = await admin()
    .from('projects')
    .update({ cota_brief: brief ?? null })
    .eq('id', projectId)
    .eq('workspace_id', auth.workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
