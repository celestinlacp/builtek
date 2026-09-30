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
    .select('label, drive_folders(name)')
    .eq('token', token)
    .single()

  const folderName = share?.label || (share?.drive_folders as any)?.name || 'Carpeta compartida'

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
        {/* Fondo decorativo */}
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

        {/* Folder icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 20,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
              fill="#00C2FF" fillOpacity="0.3" stroke="#00C2FF" strokeWidth="1.5" />
          </svg>
          <span style={{ color: '#00C2FF', fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>
            CARPETA COMPARTIDA
          </span>
        </div>

        {/* Nombre de carpeta */}
        <div style={{
          color: '#ffffff',
          fontSize: folderName.length > 50 ? 32 : 40,
          fontWeight: 800,
          textAlign: 'center',
          maxWidth: 900,
          lineHeight: 1.2,
          letterSpacing: -0.5,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {folderName}
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
