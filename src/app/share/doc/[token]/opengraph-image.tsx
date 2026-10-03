import { ImageResponse } from 'next/og'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime     = 'nodejs'
export const contentType = 'image/png'
export const size        = { width: 1200, height: 630 }

const TYPE_COLOR: Record<string, string> = {
  PDF: '#E53935', DWG: '#1976D2', DXF: '#1976D2',
  XLS: '#1E7E45', XLSX: '#1E7E45', DOC: '#1565C0', DOCX: '#1565C0',
  IMG: '#7B1FA2', PNG: '#7B1FA2', JPG: '#7B1FA2',
}

export default async function Image(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: share } = await admin
    .from('document_shares')
    .select('documents(name, display_name, file_type, author, specialty:specialties(name, code), project:projects(name))')
    .eq('token', token)
    .single()

  const doc        = (share as any)?.documents
  const docName    = doc?.display_name || doc?.name || 'Documento compartido'
  const fileType   = (doc?.file_type ?? 'doc').toUpperCase()
  const specialty  = doc?.specialty?.name ?? null
  const project    = doc?.project?.name ?? null
  const badgeColor = TYPE_COLOR[fileType] ?? '#607D8B'

  const nameFontSize = docName.length > 60 ? 36 : docName.length > 40 ? 44 : 52

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#1A2744',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow background */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 70% 15%, rgba(0,194,255,0.18) 0%, transparent 55%)',
          display: 'flex',
        }} />

        {/* Logo BT */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 96, height: 96, borderRadius: 20,
          background: 'rgba(0,194,255,0.08)',
          border: '2px solid rgba(0,194,255,0.25)',
          marginBottom: 28,
          boxShadow: '0 0 48px rgba(0,194,255,0.18)',
        }}>
          <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: -2, display: 'flex' }}>
            <span style={{ color: '#00C2FF' }}>B</span>
            <span style={{ color: '#ffffff' }}>T</span>
          </span>
        </div>

        {/* Badges: tipo + disciplina */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{
            background: badgeColor, color: '#fff',
            fontSize: 13, fontWeight: 800,
            padding: '4px 12px', borderRadius: 6, letterSpacing: 1,
          }}>
            {fileType}
          </div>
          {specialty && (
            <div style={{
              background: 'rgba(0,194,255,0.15)',
              border: '1px solid rgba(0,194,255,0.3)',
              color: '#00C2FF',
              fontSize: 13, fontWeight: 700,
              padding: '4px 12px', borderRadius: 6,
            }}>
              {specialty}
            </div>
          )}
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500 }}>
            DOCUMENTO TÉCNICO
          </span>
        </div>

        {/* Nombre del documento */}
        <div style={{
          color: '#ffffff',
          fontSize: nameFontSize,
          fontWeight: 800,
          textAlign: 'center',
          maxWidth: 960,
          lineHeight: 1.2,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {docName}
        </div>

        {/* Proyecto */}
        {project && (
          <div style={{
            marginTop: 16,
            color: 'rgba(255,255,255,0.45)',
            fontSize: 18,
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 800,
            display: 'flex',
          }}>
            {project}
          </div>
        )}

        {/* Footer */}
        <div style={{
          position: 'absolute', bottom: 32,
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'rgba(255,255,255,0.35)', fontSize: 16, fontWeight: 500,
        }}>
          <span style={{ color: '#00C2FF', fontWeight: 700 }}>builtek</span>
          <span>.app</span>
          <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.15)' }}>·</span>
          <span>Gestión de proyectos AEC</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
