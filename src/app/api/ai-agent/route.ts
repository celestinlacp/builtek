import { NextRequest, NextResponse } from 'next/server'
import { claude, CLAUDE_MODEL } from '@/lib/ai/claude'

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 20MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analiza este plano técnico y extrae todos los metrados. Archivo: ${file.name}`,
            },
          ],
        },
      ],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Sin respuesta del modelo' }, { status: 500 })
    }

    // Extraer JSON de la respuesta — buscar el primer objeto JSON válido
    const text = textBlock.text.trim()
    console.log('[AI-AGENT] Full length:', text.length)
    console.log('[AI-AGENT] Starts with:', JSON.stringify(text.slice(0, 20)))
    console.log('[AI-AGENT] Ends with:', JSON.stringify(text.slice(-30)))
    // Intentar extraer JSON de bloques markdown o del texto directo
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    const raw = jsonMatch ? jsonMatch[1].trim() : text

    let extraction
    try {
      extraction = JSON.parse(raw)
    } catch {
      // Último intento: buscar el primer { hasta el último }
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start !== -1 && end !== -1) {
        try {
          extraction = JSON.parse(text.slice(start, end + 1))
        } catch {
          return NextResponse.json(
            { error: 'No se pudo parsear la respuesta', raw: text },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'No se pudo parsear la respuesta', raw: text },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      extraction,
      usage: response.usage,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
