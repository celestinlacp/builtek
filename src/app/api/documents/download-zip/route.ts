import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import JSZip from 'jszip'

/**
 * POST /api/documents/download-zip
 * Body: { docIds: string[], projectName?: string }
 * Descarga los documentos de R2 y los devuelve como un ZIP organizado por disciplina.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado en el servidor' }, { status: 503 })
  }

  const { docIds, projectName } = await req.json() as { docIds: string[]; projectName?: string }

  if (!Array.isArray(docIds) || docIds.length === 0) {
    return NextResponse.json({ error: 'No se especificaron documentos' }, { status: 400 })
  }

  // Supabase RLS garantiza que solo se devuelven docs del workspace del usuario
  const { data: docs } = await supabase
    .from('documents')
    .select('id, storage_key, file_name, specialty:specialties(code, name)')
    .in('id', docIds)
    .neq('doc_status', 'deleted')

  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: 'Documentos no encontrados' }, { status: 404 })
  }

  const r2 = getR2Client()
  const zip = new JSZip()

  for (const doc of docs) {
    if (!doc.storage_key) continue

    try {
      const r2Res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET(), Key: doc.storage_key }))
      if (!r2Res.Body) continue

      const chunks: Uint8Array[] = []
      for await (const chunk of r2Res.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)

      const folder = (doc.specialty as any)?.code || 'General'
      const fileName = doc.file_name || `${doc.id}`
      zip.folder(folder)?.file(fileName, buffer)
    } catch (err) {
      console.error(`[download-zip] Error al obtener doc ${doc.id}:`, err)
    }
  }

  const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
  const safeName = (projectName || 'documentos')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_\s]/g, '').trim().replace(/\s+/g, '_')

  const blob = new Blob([zipArrayBuffer], { type: 'application/zip' })
  return new Response(blob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}_documentos.zip"`,
    },
  })
}
