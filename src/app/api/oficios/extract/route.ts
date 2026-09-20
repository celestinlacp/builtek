import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/oficios/extract
 * Extrae metadata de un PDF de oficio usando Claude.
 * Body: { pdfBase64: string, fileName: string }
 * Responde: { asunto, no_oficio, fecha_documento, especialidad }
 *
 * Fallback: si Claude falla, parsea el nombre del archivo.
 */

const ESPECIALIDAD_MAP: Record<string, string> = {
  ARQ: 'Arquitectura', EST: 'Estructuras', HID: 'Hidráulica',
  SAN: 'Sanitaria',   ELE: 'Eléctrica',   MEC: 'Mecánica',
  TOP: 'Topografía',  CIV: 'Civil',        INS: 'Instalaciones',
  GEN: 'General',
}

function parseDate(s: string): string | null {
  const d = s.trim()
  if (/^\d{8}$/.test(d)) return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`
  if (/^\d{7}$/.test(d)) return `${d.slice(0,4)}-${d.slice(4,5).padStart(2,'0')}-${d.slice(5,7)}`
  return null
}

function parseFilename(fileName: string) {
  const name  = fileName.replace(/\.[^/.]+$/, '')
  const parts = name.split('-')
  if (parts.length < 3) return {}

  const fecha_documento = parseDate(parts[0])
  const espCode         = parts[2]?.trim().toUpperCase()
  const especialidad    = ESPECIALIDAD_MAP[espCode] || null

  // Asunto: primer segmento desde índice 3 que contiene espacios
  let asuntoIdx = -1
  for (let i = 3; i < parts.length; i++) {
    if (parts[i].includes(' ')) { asuntoIdx = i; break }
  }

  const no_oficio = parts.slice(2, asuntoIdx === -1 ? undefined : asuntoIdx).join('-') || null
  const asunto    = asuntoIdx !== -1 ? parts.slice(asuntoIdx).join('-').trim() : null

  return { fecha_documento, especialidad, no_oficio, asunto }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { pdfBase64, fileName } = await req.json()
  if (!pdfBase64 || !fileName) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  // Intentar extracción con Claude
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const response = await client.messages.create({
      model:      'claude-opus-4-6',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          } as any,
          {
            type: 'text',
            text: `Eres un asistente que extrae datos de oficios de construcción mexicanos.
Extrae del documento los siguientes campos y responde ÚNICAMENTE con JSON válido (sin texto extra):

{
  "asunto": "El asunto del oficio tal como aparece en el documento",
  "no_oficio": "El número o clave del oficio (ej: ARQ-1040/AIFA)",
  "fecha_documento": "La fecha del documento en formato YYYY-MM-DD",
  "especialidad": "La disciplina (Arquitectura, Estructuras, Hidráulica, etc.)"
}

Si no puedes extraer un campo, usa null.`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0])
      return NextResponse.json({ ...extracted, source: 'ai' })
    }
  } catch {
    // Claude falló — continuar con fallback de filename
  }

  // Fallback: parsear desde el nombre del archivo
  const parsed = parseFilename(fileName)
  return NextResponse.json({ ...parsed, source: 'filename' })
}
