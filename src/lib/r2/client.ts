import { S3Client } from '@aws-sdk/client-s3'

let _r2: S3Client | null = null

export function getR2Client(): S3Client {
  if (_r2) return _r2
  const accountId  = process.env.R2_ACCOUNT_ID
  const accessKey  = process.env.R2_ACCESS_KEY_ID
  const secretKey  = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKey || !secretKey) {
    // No romper el servidor al arrancar — el error se manejará en cada route handler
    console.warn('[R2] Variables de entorno no configuradas. Las rutas de documentos no funcionarán.')
    throw new Error('R2 no configurado. Verifica R2_ACCOUNT_ID, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY en Railway.')
  }
  _r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return _r2
}

export const R2_BUCKET = () => process.env.R2_BUCKET_NAME ?? 'builtek-documents'

/** Verdadero si R2 está configurado — úsalo para verificar antes de llamar getR2Client() */
export const r2IsConfigured = () =>
  !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
