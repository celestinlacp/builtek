// ── Nomenclatura AEC ──────────────────────────────────────────────────────────
// Ejemplo: TQM-0000-PLA-AARQ-PLT-0004
// doc_key        = TQM-0000-PLA-AARQ-PLT  (todo menos el último segmento numérico)
// version_number = 4

export function parseDocKey(fileName: string): { doc_key: string; version_number: number } | null {
  const base = fileName.replace(/\.[^/.]+$/, '')
  const parts = base.split('-')
  if (parts.length < 2) return null

  const last = parts[parts.length - 1]
  if (!/^\d{4}$/.test(last)) return null

  const doc_key       = parts.slice(0, -1).join('-')
  const version_number = parseInt(last, 10)
  return { doc_key, version_number }
}
