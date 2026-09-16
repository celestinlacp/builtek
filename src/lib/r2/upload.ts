import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET } from './client'

// ── Detección de tipo de archivo por MIME (no por extensión) ─────────────────
const MIME_TO_TYPE: Record<string, string> = {
  'application/pdf':    'pdf',
  // DWG / CAD
  'application/dwg':    'dwg',
  'image/vnd.dwg':      'dwg',
  'application/acad':   'dwg',
  'application/dxf':    'dxf',
  'image/vnd.dxf':      'dxf',
  // Office
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel':   'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':      'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  // Imágenes técnicas
  'image/jpeg': 'img',
  'image/png':  'img',
  'image/tiff': 'img',
  'image/bmp':  'img',
  // Comprimidos
  'application/zip':            'zip',
  'application/x-zip-compressed': 'zip',
  'application/x-rar-compressed': 'rar',
}

export function detectFileType(mimeType: string): string {
  return MIME_TO_TYPE[mimeType] ?? 'other'
}

/**
 * Construye el storage key en R2.
 * Estructura: {workspaceId}/{projectId}/{specialtyCode}/{fileId}.{ext}
 * Permite filtrar por workspace, proyecto y especialidad con prefijos.
 */
export function buildStorageKey(params: {
  workspaceId:   string
  projectId:     string
  specialtyCode: string
  fileId:        string
  extension:     string
}): string {
  const { workspaceId, projectId, specialtyCode, fileId, extension } = params
  return `${workspaceId}/${projectId}/${specialtyCode.toLowerCase()}/${fileId}.${extension}`
}

/**
 * Genera una URL pre-firmada para que el browser suba directamente a R2.
 * El archivo NO pasa por el servidor Next.js.
 * Expira en 5 minutos.
 */
export async function getPresignedUploadUrl(params: {
  storageKey:    string
  contentType:   string
  fileSizeBytes: number
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket:      R2_BUCKET(),
    Key:         params.storageKey,
    ContentType: params.contentType,
    // ContentLength omitido — causa mismatch de firma en algunos clientes
  })
  return getSignedUrl(getR2Client(), command, { expiresIn: 300 })
}

/**
 * URL pública del objeto.
 * Requiere configurar un Custom Domain en el bucket R2
 * y definir R2_PUBLIC_DOMAIN en .env (ej: docs.builtek.mx)
 */
export function getPublicUrl(storageKey: string): string {
  const domain = process.env.R2_PUBLIC_DOMAIN
  if (!domain) throw new Error('R2_PUBLIC_DOMAIN no configurado en .env')
  return `https://${domain}/${storageKey}`
}
