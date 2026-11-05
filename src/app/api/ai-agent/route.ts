import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { claude, CLAUDE_MODEL } from '@/lib/ai/claude'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import { jsonrepair } from 'jsonrepair'

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
  "titulo": "nombre del plano o documento detectado en el cuadro de referencia",
  "descripcion": "resumen ejecutivo de 2-3 oraciones: tipo de estructura, elementos principales con cantidades más relevantes, alcance geométrico si aplica",
  "numero_plano": "código alfanumérico del cuadro de referencia (ej. EST-COR-001, PF-001-A). null si no se lee.",
  "revision": "letra o número de revisión del cuadro de referencia (A, B, 0, 1). null si no se lee.",
  "escala": "escala principal del plano (ej. 1:50, 1:100, 1:200). null si no aplica o no se lee.",
  "disciplina": "Estructural | Hidráulico | Arquitectónico | Geotécnico | Electromecánico | Geométrico | General",
  "notas_materiales": [
    "Lista de especificaciones de materiales extraídas de notas generales del plano",
    "Ej: Concreto f'c=250 kg/cm²",
    "Ej: Acero de refuerzo fy=4200 kg/cm²",
    "Ej: Recubrimiento mínimo 4 cm"
  ],
  "especialidades": [
    {
      "nombre": "nombre de la especialidad (Estructuras, Hidráulica, Electromecánico, Arquitectura, Geométrico, etc.)",
      "elementos": [
        {
          "tipo": "nombre del elemento o concepto",
          "cantidad": número_o_null,
          "unidad": "m², m³, ml, pza, kg, ton, etc.",
          "tipo_medicion": "volumen | area | lineal | conteo | peso | otro",
          "especificacion": "detalle técnico del material o norma (ej. f'c=250 kg/cm², fy=4200 kg/cm², Ø16mm, Clase I). null si no aplica.",
          "descripcion": "descripción adicional si aplica"
        }
      ]
    }
  ],
  "notas": "observaciones generales sobre el plano o limitaciones de la extracción",
  "confianza": "alta | media | baja"
}

Si el documento no es un plano técnico de construcción, indica en el campo "notas" el motivo y devuelve una estructura vacía de especialidades.

REGLAS DE EXTRACCIÓN — OBLIGATORIAS:
1. NUNCA agregues cantidades de elementos distintos. Si el plano muestra MC-01, MC-02 y MC-03 como tipos separados, extrae cada uno como elemento independiente. Los totales generales solo se incluyen si el plano los indica explícitamente como totales del proyecto.
2. Detecta SIEMPRE los identificadores de estructura del plano (MC-01, MC-02, PF-01, ODT-01, PSF-03, etc.) y úsalos como prefijo o sufijo del nombre del elemento en el campo "tipo".
3. Si el plano tiene múltiples módulos o tipos del mismo elemento, crea una fila por cada tipo, no una fila agregada.
4. Cuando el usuario proporcione instrucciones específicas, síguelas con prioridad máxima sobre estas reglas generales.
5. Para cantidades desconocidas o ilegibles usa null, no 0 ni un guion.
6. Lee SIEMPRE el cuadro de referencia (title block): extrae numero_plano, revision y escala. Si alguno no es legible, usa null.
7. Para tipo_medicion: "volumen" para m³/m3, "area" para m²/m2/ha, "lineal" para m/ml/km/lm, "conteo" para pza/und/piezas/no., "peso" para kg/ton/t, "otro" para el resto.
8. En especificacion incluye resistencia o norma técnica del material cuando aparezca en el plano (f'c, fy, clase, tipo, diámetro).
9. notas_materiales: extrae TODAS las especificaciones de materiales de las notas generales del plano, aunque no tengan cantidad asociada.`

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Genera resumen ejecutivo del proyecto a partir de todas sus extracciones ──
async function generateProjectSummary(projectId: string, adminClient: ReturnType<typeof getAdminClient>) {
  try {
    const [{ data: extractions }, { data: proj }] = await Promise.all([
      adminClient
        .from('extractions')
        .select('raw_extraction, corrected_extraction')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20),
      adminClient
        .from('projects')
        .select('name, frente, kota_data, structure_type_id')
        .eq('id', projectId)
        .single(),
    ])

    if (!extractions?.length) return

    // Agregar cantidades: (tipo, unidad) → total
    const agg: Record<string, { total: number; unidad: string }> = {}
    for (const ext of extractions) {
      const data = (ext.corrected_extraction ?? ext.raw_extraction) as any
      for (const esp of (data?.especialidades ?? [])) {
        for (const el of (esp.elementos ?? [])) {
          if (el.cantidad !== null && el.tipo && el.unidad) {
            const key = `${el.tipo}||${el.unidad}`
            if (!agg[key]) agg[key] = { total: 0, unidad: el.unidad }
            agg[key].total += Number(el.cantidad)
          }
        }
      }
    }

    const topElements = Object.entries(agg)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 12)
      .map(([key, v]) => `- ${key.split('||')[0]}: ${v.total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${v.unidad}`)
      .join('\n')

    const prompt = `Genera un párrafo ejecutivo de 3-4 oraciones sobre este proyecto de construcción basándote en las cantidades acumuladas de sus planos técnicos analizados hasta ahora.

Proyecto: ${proj?.name ?? ''}${proj?.frente ? ` — ${proj.frente}` : ''}
Planos analizados: ${extractions.length}

Cantidades principales:
${topElements || '(sin datos aún)'}

Describe: tipo de estructura, materiales principales, cantidades destacadas y alcance de obra. Español técnico pero comprensible. Solo el párrafo, sin título ni viñetas.`

    const response = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = (response.content.find(b => b.type === 'text') as any)?.text?.trim() ?? ''
    if (!text) return

    const current = proj?.kota_data ? JSON.parse(JSON.stringify(proj.kota_data)) : {}
    current.resumen_ejecutivo      = text
    current.resumen_generado_en    = new Date().toISOString()
    await adminClient.from('projects').update({ kota_data: current }).eq('id', projectId)
  } catch (err) {
    console.error('[KOTA] generateProjectSummary error:', err)
  }
}

// [KOTA] GET /api/ai-agent?projectId=...&documentId=... — historial de extracciones
export async function GET(req: NextRequest) {
  const projectId  = req.nextUrl.searchParams.get('projectId')
  const documentId = req.nextUrl.searchParams.get('documentId')
  if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let query = supabase
    .from('extractions')
    .select('id, document_id, doc_hints, raw_extraction, corrected_extraction, correction_notes, corrected_by, corrected_at, status, confidence, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (documentId) {
    // Return most recent extraction for this specific document
    query = query.eq('document_id', documentId).limit(1)
  } else {
    query = query.limit(30)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (documentId) {
    return NextResponse.json({ extraction: data?.[0] ?? null })
  }
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
    return NextResponse.json({ error: 'Solo el Owner puede usar Kota' }, { status: 403 })
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

  // [KOTA] Datos técnicos del proyecto
  const admin = getAdminClient()
  const { data: projRow } = await admin
    .from('projects')
    .select('kota_data, name, frente, chainage_start, chainage_end, structure_type_id')
    .eq('id', projectId)
    .single()

  if (projRow?.name && !docHints.proyecto_name) docHints.proyecto_name = projRow.name

  // Resolver código de tipo de estructura del proyecto
  let structureTypeCode: string | null = null
  if (projRow?.structure_type_id) {
    const { data: stRow } = await admin
      .from('structure_types')
      .select('code, name')
      .eq('id', projRow.structure_type_id)
      .single()
    if (stRow) structureTypeCode = stRow.code
  }

  // Serializar kota_data a texto legible para el prompt
  const kotaData = projRow?.kota_data as Record<string, unknown> | null | undefined
  let projectBrief: string | null = null
  if (kotaData && Object.keys(kotaData).length > 0) {
    const lines: string[] = [`Datos técnicos del proyecto ${projRow?.name ?? ''}:`]
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
    if (lines.length > 1) projectBrief = lines.join('\n')
  }

  // ── Few-shot: extracciones aprobadas del mismo proyecto como referencia ──────
  let fewShotText = ''
  {
    const { data: examples } = await admin
      .from('extractions')
      .select('raw_extraction, corrected_extraction, doc_hints')
      .eq('project_id', projectId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(2)

    if (examples?.length) {
      const blocks = examples.map((ex) => {
        const ext    = ex.corrected_extraction ?? ex.raw_extraction
        const docRef = (ex.doc_hints as any)?.doc_key || (ex.doc_hints as any)?.file_name || 'referencia'
        return `[${docRef}]\n${JSON.stringify(ext, null, 2)}`
      }).join('\n\n')
      fewShotText = `\n\n## Extracciones aprobadas de este proyecto como referencia de formato y detalle:\n\n${blocks}\n\nUsa estas referencias para calibrar nivel de detalle, unidades y estructura JSON.`
    }
  }

  // ── Parsear doc_key en segmentos ─────────────────────────────────────────────
  function parseDocKeySegments(docKey: string) {
    const p = docKey.split('-')
    if (p.length === 6) return { troncal: p[0], tipo_est: p[1], identificador: p[2], tipo_doc: p[3], especialidad: p[4], tipo_plano: p[5] }
    if (p.length === 5) return { troncal: p[0], tipo_est: null,  identificador: p[1], tipo_doc: p[2], especialidad: p[3], tipo_plano: p[4] }
    return null
  }

  const docKeyParsed = docHints.doc_key ? parseDocKeySegments(docHints.doc_key) : null

  // Cadena km formateada
  function fmtKm(m: number) { return `${Math.floor(m / 1000)}+${String(m % 1000).padStart(3, '0')}` }
  const chainageText = (projRow?.chainage_start != null && projRow?.chainage_end != null)
    ? `${fmtKm(projRow.chainage_start)} — ${fmtKm(projRow.chainage_end)}`
    : null

  // ── Construir prompt con hints de contexto ───────────────────────────────────
  const tipoPlanHint = (docKeyParsed?.tipo_plano ?? docHints.tipo_plano)
    ? TIPO_PLANO_HINTS[(docKeyParsed?.tipo_plano ?? docHints.tipo_plano)!.toUpperCase()]
    : null

  // Línea resumen del proyecto
  const proyectoLine = [
    docHints.proyecto_name && `Proyecto: ${docHints.proyecto_name}`,
    structureTypeCode      && `Tipo de estructura: ${structureTypeCode}`,
    projRow?.frente        && `Frente: ${projRow.frente}`,
    chainageText           && `Cadena km: ${chainageText}`,
  ].filter(Boolean).join(' | ')

  // Desglose del ID Builtek
  const docKeyBlock = docKeyParsed
    ? [
        `ID Builtek: ${docHints.doc_key}`,
        `  Troncal: ${docKeyParsed.troncal}`,
        docKeyParsed.tipo_est    && `  Tipo de estructura: ${docKeyParsed.tipo_est}`,
        `  Identificador: ${docKeyParsed.identificador}`,
        `  Tipo de documento: ${docKeyParsed.tipo_doc}`,
        `  Especialidad: ${docKeyParsed.especialidad}`,
        `  Tipo de plano: ${docKeyParsed.tipo_plano}`,
      ].filter(Boolean).join('\n')
    : docHints.doc_key
      ? `ID Builtek: ${docHints.doc_key}`
      : null

  const contextLines = [
    projectBrief   && `DATOS TÉCNICOS DEL PROYECTO:\n${projectBrief}`,
    proyectoLine,
    docKeyBlock,
    docHints.version  && `Versión del plano: ${docHints.version}`,
    tipoPlanHint      && `Contexto del tipo de plano:\n${tipoPlanHint}`,
  ].filter(Boolean).join('\n\n')

  let userText = [
    contextLines,
    `Analiza este plano técnico y extrae todos los metrados. Archivo: ${fileName}`,
    fewShotText,
  ].filter(Boolean).join('\n\n')

  if (docHints?.user_hint) {
    userText += `\n\nINSTRUCCIONES ESPECÍFICAS DEL USUARIO PARA ESTE PLANO:\n${docHints.user_hint}`
  }

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
      extraction = JSON.parse(jsonrepair(raw))
    } catch {
      return NextResponse.json({ error: 'No se pudo parsear la respuesta', raw: text }, { status: 500 })
    }

    // ── Guardar en BD ────────────────────────────────────────────────────────
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

    if (dbError) console.error('[KOTA] Error saving extraction:', dbError.message)

    // Generar resumen ejecutivo del proyecto en background (fire & forget)
    generateProjectSummary(projectId, admin)

    // [KOTA] Infer technical fields from extraction and PATCH kota_data
    // Only update fields that are empty or have source: 'kota' (never overwrite source: 'human')
    if (projectId && extraction?.especialidades?.length) {
      try {
        const inferredPatches: Array<{ field_path: string[]; value: unknown }> = []

        for (const esp of extraction.especialidades) {
          for (const el of (esp.elementos ?? [])) {
            const tipo = el.tipo?.toLowerCase() ?? ''
            // Infer longitud_total_m
            if ((tipo.includes('longitud') || tipo.includes('largo')) && el.cantidad !== null) {
              inferredPatches.push({ field_path: ['campos_comunes', 'longitud_total_m'], value: el.cantidad })
            }
            // Infer altura_maxima_m
            if ((tipo.includes('altura') || tipo.includes('alto')) && el.cantidad !== null) {
              inferredPatches.push({ field_path: ['campos_comunes', 'altura_maxima_m'], value: el.cantidad })
            }
            // Infer tipo_estructura from title/notas if not already set
          }
        }

        // Infer tipo_estructura from extraction titulo if available
        if (extraction.titulo) {
          inferredPatches.push({ field_path: ['campos_comunes', 'tipo_estructura'], value: extraction.titulo })
        }

        for (const patch of inferredPatches) {
          await admin
            .from('projects')
            .select('kota_data')
            .eq('id', projectId)
            .single()
            .then(async ({ data: p }) => {
              const current = (p?.kota_data && Object.keys(p.kota_data).length > 0)
                ? JSON.parse(JSON.stringify(p.kota_data))
                : { campos_comunes: {}, campos_disciplina: {}, notas: '', ultima_actualizacion: new Date().toISOString(), actualizado_por: 'kota' }

              const [section, fieldKey] = patch.field_path
              if (section === 'campos_comunes' && fieldKey) {
                const existing = (current.campos_comunes as Record<string, unknown>)?.[fieldKey] as { source?: string } | undefined
                if (!existing || existing?.source === 'kota') {
                  ;(current.campos_comunes as Record<string, unknown>)[fieldKey] = { valor: patch.value, source: 'kota' }
                  current.ultima_actualizacion = new Date().toISOString()
                  current.actualizado_por = 'kota'
                  await admin.from('projects').update({ kota_data: current }).eq('id', projectId)
                }
              }
            })
        }
      } catch (patchErr) {
        console.error('[KOTA] Error patching kota_data after extraction:', patchErr)
      }
    }

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

// ── PATCH /api/ai-agent — aprobar o corregir extracción ──────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role, workspace_id')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Solo el Owner puede gestionar extracciones de Kota' }, { status: 403 })
  }

  const { id, status, corrected_extraction, correction_notes } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Faltan campos id y status' }, { status: 400 })

  const updateData: Record<string, unknown> = {
    status,
    corrected_by: user.id,
    corrected_at: new Date().toISOString(),
  }
  if (corrected_extraction !== undefined) updateData.corrected_extraction = corrected_extraction
  if (correction_notes)                   updateData.correction_notes     = correction_notes

  const admin = getAdminClient()
  const { data: updated, error } = await admin
    .from('extractions')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', membership.workspace_id)
    .select('id, document_id, doc_hints, raw_extraction, corrected_extraction, correction_notes, corrected_by, corrected_at, status, confidence, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, extraction: updated })
}
