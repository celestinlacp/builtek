import { ImageResponse } from 'next/og'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime     = 'nodejs'
export const contentType = 'image/png'
export const size        = { width: 1200, height: 630 }

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
    .select('documents(name, display_name, file_type, specialty:specialties(name), project:projects(name))')
    .eq('token', token)
    .single()

  const doc       = (share as any)?.documents
  const docName   = doc?.display_name || doc?.name || 'Documento compartido'
  const fileType  = (doc?.file_type ?? 'doc').toUpperCase()
  const specialty = doc?.specialty?.name ?? null
  const project   = doc?.project?.name ?? null

  const nameFontSize = docName.length > 55 ? 32 : docName.length > 38 ? 38 : 44

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex',
          background: '#1A2744',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Lado izquierdo: BT grande ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 440,
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Glow detrás del BT */}
          <div style={{
            position: 'absolute',
            width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,194,255,0.12) 0%, transparent 70%)',
            display: 'flex',
          }} />

          {/* BT monogram */}
          <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
            <span style={{
              fontSize: 260, fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: -8,
            }}>B</span>
            <span style={{
              fontSize: 260, fontWeight: 900,
              color: '#00C2FF',
              lineHeight: 1,
              letterSpacing: -8,
            }}>T</span>

            {/* Icono badge (capas) abajo a la derecha de la T */}
            <div style={{
              position: 'absolute',
              bottom: 10,
              right: -8,
              width: 72, height: 72,
              borderRadius: 16,
              background: '#00C2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}>
              {/* Icono capas SVG simplificado */}
              <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
                <path d="M20 2L38 12L20 22L2 12L20 2Z" fill="#1A2744" fillOpacity="0.9"/>
                <path d="M2 20L20 30L38 20" stroke="#1A2744" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
                <path d="M2 14L20 24L38 14" stroke="#1A2744" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: 2,
          background: 'linear-gradient(to bottom, transparent, rgba(0,194,255,0.3), transparent)',
          margin: '60px 0',
          display: 'flex',
        }} />

        {/* ── Lado derecho: info del documento ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 60px',
          gap: 0,
        }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(0,194,255,0.15)',
              border: '1px solid rgba(0,194,255,0.3)',
              color: '#00C2FF',
              fontSize: 13, fontWeight: 800,
              padding: '5px 14px', borderRadius: 8, letterSpacing: 1,
            }}>
              {fileType}
            </div>
            {specialty && (
              <div style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13, fontWeight: 600,
                padding: '5px 14px', borderRadius: 8,
              }}>
                {specialty}
              </div>
            )}
          </div>

          {/* Nombre */}
          <div style={{
            color: '#ffffff',
            fontSize: nameFontSize,
            fontWeight: 800,
            lineHeight: 1.25,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 640,
          }}>
            {docName}
          </div>

          {/* Proyecto */}
          {project && (
            <div style={{
              marginTop: 16,
              color: 'rgba(255,255,255,0.4)',
              fontSize: 18, fontWeight: 500,
              display: 'flex',
              maxWidth: 620,
            }}>
              {project}
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 40,
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 500,
          }}>
            <span style={{ color: '#00C2FF', fontWeight: 700 }}>builtek</span>
            <span>.app</span>
            <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.12)' }}>·</span>
            <span>Documento técnico compartido</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
