import { S3Client } from '@aws-sdk/client-s3'

let _r2: S3Client | null = null

export function getR2Client(): S3Client {
  if (_r2) return _r2
  if (!process.env.R2_ACCOUNT_ID)        throw new Error('R2_ACCOUNT_ID no definido en .env')
  if (!process.env.R2_ACCESS_KEY_ID)     throw new Error('R2_ACCESS_KEY_ID no definido en .env')
  if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY no definido en .env')
  _r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  return _r2
}

export const R2_BUCKET = () => process.env.R2_BUCKET_NAME ?? 'builtek-documents'
