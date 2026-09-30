import { ImageResponse } from 'next/og'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: share } = await admin
    .from('drive_shares')
    .select('label, drive_files(name, file_type)')
    .eq('token', token)
    .single()

  const fileName = share?.label || (share?.drive_files as any)?.name || 'Archivo compartido'
  const fileType = ((share?.drive_files as any)?.file_type ?? 'other').toUpperCase()

  const TYPE_COLOR: Record<string, string> = {
    PDF: '#E53935', PPT: '#FF5722', PPTX: '#FF5722',
    XLS: '#1E7E45', XLSX: '#1E7E45', DOC: '#1565C0', DOCX: '#1565C0',
    DWG: '#1976D2', DXF: '#1976D2', IMG: '#7B1FA2', ZIP: '#F57F17', RAR: '#E65100',
  }
  const badgeColor = TYPE_COLOR[fileType] ?? '#607D8B'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A2744',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 80% 20%, rgba(0,194,255,0.12) 0%, transparent 60%)',
          display: 'flex',
        }} />

        {/* Logo BT */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 100,
          height: 100,
          borderRadius: 20,
          background: '#1A2744',
          border: '2px solid rgba(0,194,255,0.3)',
          marginBottom: 36,
          boxShadow: '0 0 40px rgba(0,194,255,0.15)',
        }}>
          <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, display: 'flex' }}>
            <span style={{ color: '#00C2FF' }}>B</span>
            <span style={{ color: '#ffffff' }}>T</span>
          </span>
        </div>

        {/* Badge tipo archivo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 20,
        }}>
          <div style={{
            background: badgeColor,
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 6,
            letterSpacing: 1,
          }}>
            {fileType}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 500 }}>
            ARCHIVO COMPARTIDO
          </span>
        </div>

        {/* Nombre del archivo */}
        <div style={{
          color: '#ffffff',
          fontSize: fileName.length > 50 ? 30 : 38,
          fontWeight: 800,
          textAlign: 'center',
          maxWidth: 900,
          lineHeight: 1.2,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {fileName}
        </div>

        {/* Dominio */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'rgba(255,255,255,0.35)',
          fontSize: 16,
          fontWeight: 500,
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
