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
  if (parts.length < 2) return {}

  // 1. Date: first segment
  const fecha_documento = parseDate(parts[0])

  // 2. Skip "OF" separator if present
  const ofSepIdx = parts.findIndex((p, i) => i > 0 && p.trim().toUpperCase() === 'OF')
  const startIdx = ofSepIdx !== -1 ? ofSepIdx + 1 : 1

  // 3. Asunto: first segment with a space
  let asuntoIdx = -1
  for (let i = startIdx; i < parts.length; i++) {
    if (parts[i].includes(' ')) { asuntoIdx = i; break }
  }
  const asunto = asuntoIdx !== -1 ? parts.slice(asuntoIdx).join('-').trim() : null

  const noOficioParts = parts.slice(startIdx, asuntoIdx !== -1 ? asuntoIdx : undefined)

  // 4. no_oficio — three strategies
  let no_oficio: string | null = noOficioParts.join('-') || null

  // A: SEDENA  →  LFMQ-F12-1040
  const sedenaMatch = name.match(/\b(LFMQ-F\d+-\d+)\b/i)
  if (sedenaMatch) no_oficio = sedenaMatch[1].toUpperCase()

  // B: Slash-separated  →  ATTRAPI/1.4.746/2026
  if (!sedenaMatch) {
    const slashMatch = name.match(/\b([A-Z]{3,10}\/[\w.\-\/]+\d{4})\b/i)
    if (slashMatch) no_oficio = slashMatch[1]
  }

  // C: Generic CODE-CODE-NUM-NUM  →  AIFA-MC-26-629 (covered by noOficioParts join)

  // 5. Specialty — parts first, then full name
  let especialidad: string | null = null
  for (const part of noOficioParts) {
    const code = ESPECIALIDAD_MAP[part.trim().toUpperCase()]
    if (code) { especialidad = code; break }
  }
  if (!especialidad) {
    const m = name.match(/\b(ARQ|EST|HID|SAN|ELE|MEC|TOP|CIV|INS|GEN)\b/i)
    if (m) especialidad = ESPECIALIDAD_MAP[m[1].toUpperCase()] || null
  }

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
