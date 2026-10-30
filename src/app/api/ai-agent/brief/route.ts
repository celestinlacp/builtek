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

// [KOTA] Base structure for kota_data
function baseKotaData() {
  return {
    campos_comunes:    {},
    campos_disciplina: {},
    notas:             '',
    ultima_actualizacion: new Date().toISOString(),
    actualizado_por:   'system',
  }
}

// GET /api/ai-agent/brief?projectId=xxx
export async function GET(req: NextRequest) {
  const auth = await getOwner()
  if (!auth) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  const { data } = await admin()
    .from('projects')
    .select('id, name, kota_data')
    .eq('id', projectId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  // If kota_data is null or empty {}, initialize with base structure
  const kota = data?.kota_data && Object.keys(data.kota_data).length > 0
    ? data.kota_data
    : baseKotaData()

  return NextResponse.json({ kota_data: kota })
}

// PUT /api/ai-agent/brief { projectId, kota_data }
// Replaces the entire kota_data object
export async function PUT(req: NextRequest) {
  const auth = await getOwner()
  if (!auth) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const { projectId, kota_data } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  const updated = {
    ...kota_data,
    ultima_actualizacion: new Date().toISOString(),
    actualizado_por: 'human',
  }

  const { error } = await admin()
    .from('projects')
    .update({ kota_data: updated })
    .eq('id', projectId)
    .eq('workspace_id', auth.workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH /api/ai-agent/brief { projectId, field_path, value, source }
// Updates a single field without overwriting the rest.
// field_path is an array of keys, e.g. ['campos_comunes', 'tipo_estructura']
// or ['campos_disciplina', 'EEST', 'fc_concreto_kg_cm2']
export async function PATCH(req: NextRequest) {
  const auth = await getOwner()
  if (!auth) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const { projectId, field_path, value, source } = await req.json()
  if (!projectId)                      return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })
  if (!Array.isArray(field_path) || field_path.length < 2) {
    return NextResponse.json({ error: 'field_path inválido' }, { status: 400 })
  }

  const db = admin()

  // Read current kota_data
  const { data } = await db
    .from('projects')
    .select('kota_data')
    .eq('id', projectId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  const current: Record<string, unknown> =
    (data?.kota_data && Object.keys(data.kota_data).length > 0)
      ? JSON.parse(JSON.stringify(data.kota_data))
      : baseKotaData()

  // Merge in memory based on field_path depth
  const [section, ...rest] = field_path

  if (section === 'campos_comunes' && rest.length === 1) {
    const fieldKey = rest[0]
    const existing = (current.campos_comunes as Record<string, unknown>)?.[fieldKey] as { valor: unknown; source: string } | undefined
    // Never overwrite source: 'human' with source: 'kota'
    if (existing?.source === 'human' && source === 'kota') {
      return NextResponse.json({ ok: true, skipped: true })
    }
    ;(current.campos_comunes as Record<string, unknown>)[fieldKey] = { valor: value, source: source ?? 'human' }

  } else if (section === 'campos_disciplina' && rest.length === 2) {
    const [disc, campoKey] = rest
    if (!(current.campos_disciplina as Record<string, unknown>)[disc]) {
      ;(current.campos_disciplina as Record<string, unknown>)[disc] = {}
    }
    const disciplinaMap = (current.campos_disciplina as Record<string, Record<string, unknown>>)[disc]
    const existing = disciplinaMap[campoKey] as { valor: unknown; source: string } | undefined
    // Never overwrite source: 'human' with source: 'kota'
    if (existing?.source === 'human' && source === 'kota') {
      return NextResponse.json({ ok: true, skipped: true })
    }
    disciplinaMap[campoKey] = { valor: value, source: source ?? 'human' }

  } else {
    return NextResponse.json({ error: 'field_path no soportado' }, { status: 400 })
  }

  current.ultima_actualizacion = new Date().toISOString()
  current.actualizado_por = source === 'kota' ? 'kota' : 'human'

  const { error } = await db
    .from('projects')
    .update({ kota_data: current })
    .eq('id', projectId)
    .eq('workspace_id', auth.workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
