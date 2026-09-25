/**
 * Menvio API — cliente para disparar plantillas WhatsApp
 * Docs: integración Builtek × Menvio
 */

const MENVIO_ENDPOINT = 'https://api.menvio.app/api/send-template'

export type MenvioContact = {
  name: string
  phone: string // formato: +521XXXXXXXXXX
}

type SendTemplateParams = {
  contacts: MenvioContact[]
  template_name: string
  language?: string
  variables: string[]
  button_url?: string
}

type SendResult = {
  ok: boolean
  sent: string[]
  failed: { phone: string; error: string }[]
  error?: string
}

/**
 * Normaliza un número de teléfono mexicano a formato +521XXXXXXXXXX.
 * Acepta: 10 dígitos, +52 + 10 dígitos, 521 + 10 dígitos, etc.
 * Retorna null si no se puede normalizar.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')

  // Ya tiene código país completo: 521XXXXXXXXXX (13 dígitos)
  if (digits.length === 13 && digits.startsWith('521')) return `+${digits}`

  // 52 + 10 dígitos (12 total)
  if (digits.length === 12 && digits.startsWith('52')) {
    const local = digits.slice(2)
    if (local.startsWith('1')) return `+52${local}`
    return `+521${local}`
  }

  // Solo 10 dígitos locales
  if (digits.length === 10) return `+521${digits}`

  return null
}

/**
 * Envía una plantilla WhatsApp vía Menvio.
 * Nunca lanza excepción — retorna { ok: false, error } si algo falla.
 */
export async function sendMenvioTemplate(params: SendTemplateParams): Promise<SendResult> {
  const apiKey = process.env.MENVIO_API_KEY
  if (!apiKey) {
    return { ok: false, sent: [], failed: [], error: 'MENVIO_API_KEY no configurada' }
  }

  try {
    const res = await fetch(MENVIO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contacts:      params.contacts,
        template_name: params.template_name,
        language:      params.language ?? 'es',
        variables:     params.variables,
        ...(params.button_url ? { button_url: params.button_url } : {}),
      }),
    })

    const body = await res.json().catch(() => ({}))

    if (res.ok || res.status === 207) {
      return {
        ok:     (body.failed?.length ?? 0) === 0,
        sent:   body.sent   ?? [],
        failed: body.failed ?? [],
      }
    }

    return {
      ok:     false,
      sent:   [],
      failed: body.failed ?? [],
      error:  body.message ?? `HTTP ${res.status}`,
    }
  } catch (err: any) {
    return { ok: false, sent: [], failed: [], error: err?.message ?? 'Error de red' }
  }
}
