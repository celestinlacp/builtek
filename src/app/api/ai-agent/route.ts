import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { claude, CLAUDE_MODEL } from '@/lib/ai/claude'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

// ── Hints por tipo de plano ────────────────────────────────────────────────────
const TIPO_PLANO_HINTS: Record<string, string> = {
  COR: "CORTE ESTRUCTURAL. Busca específicamente: tipo y resistencia de concreto (f'c) por elemento, dimensiones de sección transversal (ancho×alto), armado longitudinal y transversal, recubrimientos, número o ID del elemento (pila, viga, losa).",
  PLT: 'PLANTA ESTRUCTURAL. Busca: ubicación y espaciamiento de elementos, dimensiones en planta, chainage o abscisa si aplica.',
  DET: 'DETALLE CONSTRUCTIVO. Busca: conexiones y traslapes, tolerancias y acabados, materiales y especificaciones de instalación.',
  ALZ: 'ALZADO / ELEVACIÓN. Busca: alturas totales y parciales, cotas de nivel, geometría de fachada o perfil.',
  PLN: "PLANTA DE CIMENTACIÓN. Busca: profundidades, tipo de cimentación, dimensiones de zapatas/pilas/pilotes, nivel de desplante.",
  SEC: 'SECCIÓN. Busca: capas de materiales, espesores, cotas y referencias de nivel.',
  ESQ: 'ESQUEMA O DIAGRAMA. Busca: relaciones entre elementos, cotas generales, nomenclatura.',
}

const SYSTEM_PROMPT = `Eres un agente experto en ingeniería de construcción especializado en la extracción de metrados (cuantificación) de planos técnicos en formato PDF.

Tu tarea es analizar el plano o documento técnico proporcionado y extraer TODOS los metrados que encuentres, organizados por especialidad.

Responde ÚNICAMENTE con un JSON válido con la siguiente estructura, sin texto adicional:

{
  "titulo": "nombre del plano o documento detectado",
  "especialidades": [
    {
      "nombre": "nombre de la especialidad (Geométrico, Estructuras, Hidráulica, Electromecánico, Arquitectura, etc.)",
      "elementos": [
        {
          "tipo": "nombre del elemento o concepto",
          "cantidad": número_o_null,
          "unidad": "m², m³, ml, pza, kg, etc.",
          "descripcion": "descripción adicional si aplica"
        }
      ]
    }
  ],
  "notas": "observaciones generales sobre el plano o extracción",
  "confianza": "alta | media | baja"
}

Si el documento no es un plano técnico de construcción, indica en el campo "notas" el motivo y devuelve una estructura vacía de especialidades.`

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── GET /api/ai-agent?projectId=... — historial de extracciones por proyecto ──
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('extractions')
    .select('id, document_id, doc_hints, raw_extraction, status, confidence, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ extractions: data ?? [] })
}

// ── POST /api/ai-agent — extraer metrados + guardar en BD ─────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Solo Owner puede extraer
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role, workspace_id')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Solo el Owner puede usar Cota' }, { status: 403 })
  }
  const workspaceId = membership.workspace_id

  const formData = await req.formData()
  const file       = formData.get('file')       as File   | null
  const documentId = formData.get('documentId') as string | null
  const projectId  = formData.get('projectId')  as string | null
  const hintsRaw   = formData.get('docHints')   as string | null
  const docHints   = hintsRaw ? JSON.parse(hintsRaw) : {}

  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  let base64: string
  let fileName: string

  if (documentId) {
    // ── Cargar PDF desde R2 ──────────────────────────────────────────────────
    if (!r2IsConfigured()) return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })

    const { data: doc } = await supabase
      .from('documents')
      .select('storage_key, file_name, doc_key, doc_type, mic_version, specialty:specialties(code, name)')
      .eq('id', documentId)
      .single()

    if (!doc?.storage_key) {
      return NextResponse.json({ error: 'Documento sin archivo en R2' }, { status: 404 })
    }

    const command = new GetObjectCommand({ Bucket: R2_BUCKET(), Key: doc.storage_key })
    const r2Res   = await getR2Client().send(command)
    const bytes   = await r2Res.Body?.transformToByteArray()
    if (!bytes) return NextResponse.json({ error: 'No se pudo leer el archivo de R2' }, { status: 500 })

    base64   = Buffer.from(bytes).toString('base64')
    fileName = doc.file_name || doc.doc_key || 'documento.pdf'

    // Enriquecer hints con metadata del documento
    if (doc.doc_key)              docHints.doc_key           = doc.doc_key
    if (doc.doc_type)             docHints.tipo_plano        = doc.doc_type
    if (doc.mic_version)          docHints.version           = doc.mic_version
    if ((doc.specialty as any)?.code) docHints.especialidad_code = (doc.specialty as any).code
    if ((doc.specialty as any)?.name) docHints.especialidad      = (doc.specialty as any).name

  } else if (file) {
    // ── PDF subido manualmente ───────────────────────────────────────────────
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 20MB' }, { status: 400 })
    }
    base64   = Buffer.from(await file.arrayBuffer()).toString('base64')
    fileName = file.name
  } else {
    return NextResponse.json({ error: 'Falta archivo o documentId' }, { status: 400 })
  }

  // ── Construir prompt con hints de contexto ───────────────────────────────────
  const tipoPlanHint = docHints.tipo_plano
    ? TIPO_PLANO_HINTS[docHints.tipo_plano.toUpperCase()]
    : null

  const contextLines = [
    docHints.proyecto_name     && `Proyecto: ${docHints.proyecto_name}`,
    docHints.doc_key           && `Clave de documento: ${docHints.doc_key}`,
    docHints.especialidad      && `Especialidad: ${docHints.especialidad}`,
    docHints.version           && `Versión: ${docHints.version}`,
    tipoPlanHint               && `Contexto: ${tipoPlanHint}`,
  ].filter(Boolean).join('\n')

  const userText = contextLines
    ? `${contextLines}\n\nAnaliza este plano técnico y extrae todos los metrados. Archivo: ${fileName}`
    : `Analiza este plano técnico y extrae todos los metrados. Archivo: ${fileName}`

  // ── Llamar a Claude ──────────────────────────────────────────────────────────
  try {
    const response = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 4096,
      system:     SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type:   'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as any,
          { type: 'text', text: userText },
        ],
      }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Sin respuesta del modelo' }, { status: 500 })
    }

    // Parsear JSON
    const text      = textBlock.text.trim()
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    const raw       = jsonMatch ? jsonMatch[1].trim() : text

    let extraction
    try {
      extraction = JSON.parse(raw)
    } catch {
      const start = text.indexOf('{')
      const end   = text.lastIndexOf('}')
      if (start !== -1 && end !== -1) {
        extraction = JSON.parse(text.slice(start, end + 1))
      } else {
        return NextResponse.json({ error: 'No se pudo parsear la respuesta', raw: text }, { status: 500 })
      }
    }

    // ── Guardar en BD ────────────────────────────────────────────────────────
    const admin = getAdminClient()
    const { data: saved, error: dbError } = await admin
      .from('extractions')
      .insert({
        workspace_id:   workspaceId,
        project_id:     projectId,
        document_id:    documentId || null,
        doc_hints:      { ...docHints, file_name: fileName },
        raw_extraction: extraction,
        status:         'raw',
        confidence:     extraction.confianza || null,
        created_by:     user.id,
      })
      .select('id')
      .single()

    if (dbError) console.error('[COTA] Error saving extraction:', dbError.message)

    return NextResponse.json({
      extraction,
      extractionId: saved?.id ?? null,
      usage:        response.usage,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
