/**
 * Ruta de diagnóstico WhatsApp — TEMPORAL
 * GET /api/test-whatsapp?phone=+524422818834
 *
 * Verifica: API key, normalización de teléfono y respuesta de Menvio.
 * ELIMINAR después de confirmar que funciona.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendMenvioWhatsApp, normalizePhone } from '@/lib/menvio'

export async function GET(req: NextRequest) {
  const rawPhone = req.nextUrl.searchParams.get('phone') ?? '+524422818834'

  const normalized = normalizePhone(rawPhone)

  const apiKey = process.env.BUILTEK_API_KEY
  const keyPresent = !!apiKey
  const keyPreview = apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : null

  if (!normalized) {
    return NextResponse.json({
      ok: false,
      step: 'normalize',
      rawPhone,
      normalized: null,
      message: 'normalizePhone() retornó null — formato de teléfono inválido',
    })
  }

  if (!keyPresent) {
    return NextResponse.json({
      ok: false,
      step: 'api_key',
      rawPhone,
      normalized,
      message: 'MENVIO_BUILTEK_API_KEY no está configurada en Railway',
    })
  }

  const result = await sendMenvioWhatsApp(
    'tarea_asignada',
    normalized,
    ['Luis Antonio', 'Tarea de prueba diagnóstico', 'Frente 12', '10 oct 2026']
  )

  return NextResponse.json({
    ok: result.ok,
    step: 'send',
    rawPhone,
    normalized,
    keyPresent,
    keyPreview,
    menvioResponse: result,
  })
}
