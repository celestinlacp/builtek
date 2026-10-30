import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { claude, CLAUDE_MODEL } from '@/lib/ai/claude'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

const QUERY_SYSTEM = `Eres Kota, agente experto en metrados y cuantificación de ingeniería de construcción.

Tienes acceso a las extracciones aprobadas de los planos técnicos del proyecto que se te proporcionan como contexto.

Reglas:
- Responde ÚNICAMENTE basándote en las extracciones proporcionadas — no en conocimiento general
- Si la información solicitada no está en los datos, dilo claramente: "No encontré datos sobre esto en las extracciones del proyecto."
- Siempre cita la fuente (clave del plano o nombre del documento) de donde obtuviste los datos
- Sé conciso y directo — este es un contexto de ingeniería técnica
- Conserva las unidades tal como aparecen en los datos
- Si el mismo elemento aparece en múltiples planos, consolida o detalla según sea más útil
- Usa formato markdown para tablas cuando consolides cantidades de múltiples fuentes`

// [KOTA] GET /api/ai-agent/query?projectId=... — historial de consultas
export async function GET(req: NextRequest) {
  const auth = await getOwner()
  if (!auth) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('cota_queries')
    .select('id, question, answer, sources, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ queries: data ?? [] })
}

// [KOTA] POST /api/ai-agent/query — consulta RAG
export async function POST(req: NextRequest) {
  const auth = await getOwner()
  if (!auth) return NextResponse.json({ error: 'Solo el Owner puede usar Kota' }, { status: 403 })

  const { projectId, question } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })
  if (!question?.trim()) return NextResponse.json({ error: 'Falta la pregunta' }, { status: 400 })

  const admin = getAdminClient()

  // 1. Extracciones aprobadas del proyecto
  const { data: extractions } = await admin
    .from('extractions')
    .select('id, doc_hints, raw_extraction, corrected_extraction')
    .eq('project_id', projectId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (!extractions?.length) {
    return NextResponse.json({
      answer: 'No hay extracciones aprobadas para este proyecto. Aprueba al menos una extracción antes de hacer consultas.',
      sources: [],
    })
  }

  // 2. [KOTA] Datos técnicos del proyecto (kota_data)
  const { data: proj } = await admin
    .from('projects')
    .select('name, kota_data')
    .eq('id', projectId)
    .single()

  // 3. Construir contexto
  const sources: Array<{ doc_key: string; titulo: string }> = []

  const contextBlocks = extractions.map(ex => {
    const ext    = ex.corrected_extraction ?? ex.raw_extraction
    const docKey = (ex.doc_hints as any)?.doc_key || (ex.doc_hints as any)?.file_name || 'Plano'
    const titulo = ext?.titulo || docKey
    sources.push({ doc_key: docKey, titulo })
    return `## [${docKey}] ${titulo}\n${JSON.stringify(ext, null, 2)}`
  }).join('\n\n---\n\n')

  // Serialize kota_data to readable text
  const kotaData = (proj as any)?.kota_data as Record<string, unknown> | null | undefined
  let kotaSection = ''
  if (kotaData && Object.keys(kotaData).length > 0) {
    const lines: string[] = [`## Datos técnicos del proyecto ${proj?.name ?? ''}`]
    const camposComunes = kotaData.campos_comunes as Record<string, { valor: unknown; source: string }> | undefined
    if (camposComunes) {
      for (const [k, v] of Object.entries(camposComunes)) {
        if (v?.valor !== null && v?.valor !== undefined && v?.valor !== '') {
          const estado = v.source === 'kota' ? 'sugerido' : 'confirmado'
          lines.push(`- ${k}: ${v.valor} (${estado})`)
        }
      }
    }
    const camposDisciplina = kotaData.campos_disciplina as Record<string, Record<string, { valor: unknown; source: string }>> | undefined
    if (camposDisciplina) {
      for (const [disc, campos] of Object.entries(camposDisciplina)) {
        for (const [k, v] of Object.entries(campos)) {
          if (v?.valor !== null && v?.valor !== undefined && v?.valor !== '') {
            const estado = v.source === 'kota' ? 'sugerido' : 'confirmado'
            lines.push(`- [${disc}] ${k}: ${v.valor} (${estado})`)
          }
        }
      }
    }
    const notas = kotaData.notas as string | undefined
    if (notas?.trim()) lines.push(`Notas: ${notas.trim()}`)
    if (lines.length > 1) kotaSection = lines.join('\n') + '\n\n---\n\n'
  }

  const userMessage = [
    kotaSection,
    `## Extracciones aprobadas (${extractions.length} planos)\n\n${contextBlocks}`,
    `---\n\nPregunta: ${question.trim()}`,
  ].filter(Boolean).join('\n\n')

  // 4. Llamar a Claude
  try {
    const response = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 2048,
      system:     QUERY_SYSTEM,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Sin respuesta del modelo' }, { status: 500 })
    }

    const answer = textBlock.text.trim()

    // 5. Guardar en BD
    await admin.from('cota_queries').insert({
      workspace_id: auth.workspaceId,
      project_id:   projectId,
      question:     question.trim(),
      answer,
      sources,
      created_by:   auth.user.id,
    })

    return NextResponse.json({ answer, sources })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
