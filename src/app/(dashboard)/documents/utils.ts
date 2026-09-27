// ── Nomenclatura AEC / MIC ────────────────────────────────────────────────────
// Código MIC completo: TQM-F012-PLA-EEST-COR-0004
// doc_key        = TQM-F012-PLA-EEST-COR  (todo menos el último segmento numérico)
// version_number = 4                       (consecutivo de 4 dígitos)

export function parseDocKey(fileName: string): { doc_key: string; version_number: number } | null {
  const base = fileName.replace(/\.[^/.]+$/, '')
  const parts = base.split('-')
  if (parts.length < 2) return null

  const last = parts[parts.length - 1]
  if (!/^\d{4}$/.test(last)) return null

  const doc_key        = parts.slice(0, -1).join('-')
  const version_number = parseInt(last, 10)
  return { doc_key, version_number }
}

// ── Parseo de segmentos MIC desde doc_key ─────────────────────────────────────
// Estructura doc_key esperada: TRONCAL-IDENTIFICADOR-TIPO_DOC-ESPECIALIDAD-TIPO_PLANO
// Ejemplo: "TQM-F012-PLA-EEST-COR" → { troncal:'TQM', identificador:'F012', tipo_doc:'PLA', especialidad:'EEST', tipo_plano:'COR' }

export type MicSegments = {
  troncal:       string  // Ej: TQM
  identificador: string  // Ej: F012
  tipo_doc:      string  // Ej: PLA
  especialidad:  string  // Ej: EEST
  tipo_plano:    string  // Ej: COR — equivale a doc_view
}

export function parseMicSegments(docKey: string): MicSegments | null {
  const parts = docKey.split('-')
  if (parts.length < 5) return null
  return {
    troncal:       parts[0],
    identificador: parts[1],
    tipo_doc:      parts[2],
    especialidad:  parts[3],
    tipo_plano:    parts[4],
  }
}

// ── Catálogo estático TIPO_PLANO ───────────────────────────────────────────────
// Valores provisionales para doc_view. Extensible vía /admin/nomenclaturas.
export const TIPO_PLANO_DEFAULT: { code: string; name: string }[] = [
  { code: 'PLT', name: 'Planta' },
  { code: 'COR', name: 'Corte' },
  { code: 'ALZ', name: 'Alzado' },
  { code: 'PER', name: 'Perfil' },
  { code: 'DET', name: 'Detalle' },
  { code: 'ISO', name: 'Isométrico' },
  { code: 'DIA', name: 'Diagrama' },
  { code: 'CUA', name: 'Cuadro / Tabla' },
  { code: 'GEN', name: 'General' },
]
