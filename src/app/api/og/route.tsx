import { ImageResponse } from 'next/og'

export const runtime     = 'nodejs'
export const contentType = 'image/png'

/**
 * GET /api/og
 * Imagen estática de branding Builtek para og:image de todos los share links.
 * 1200×1200 cuadrada (óptima para WhatsApp thumbnail).
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 1200,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #1A2C4E 0%, #12203A 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow radial */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 60% 35%, rgba(31,176,236,0.14) 0%, transparent 60%)',
          display: 'flex',
        }} />

        {/* BT monogram + badge — contenedor principal */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          position: 'relative',
          marginBottom: 48,
        }}>
          {/* B blanco */}
          <span style={{
            fontSize: 500, fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1,
            letterSpacing: -16,
          }}>B</span>

          {/* T cyan */}
          <span style={{
            fontSize: 500, fontWeight: 900,
            color: '#1FB0EC',
            lineHeight: 1,
            letterSpacing: -16,
          }}>T</span>

          {/* Icon badge — superpuesto en bottom-right de la T */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: -12,
            width: 148, height: 148,
            borderRadius: 38,
            background: '#1FB0EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}>
            {/* Layers icon */}
            <svg width="82" height="66" viewBox="0 0 82 66" fill="none">
              <path
                d="M41 4L78 24L41 44L4 24L41 4Z"
                fill="#12203A"
                stroke="#12203A"
                strokeWidth="2"
              />
              <path
                d="M4 42L41 62L78 42"
                stroke="#12203A"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 30L41 50L78 30"
                stroke="#12203A"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
              />
            </svg>
          </div>
        </div>

        {/* Wordmark bottom */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 0,
        }}>
          <span style={{
            fontSize: 52, fontWeight: 700,
            color: 'rgba(185,198,216,0.85)',
            letterSpacing: 1,
          }}>builtek</span>
          <span style={{
            fontSize: 52, fontWeight: 700,
            color: '#1FB0EC',
            letterSpacing: 1,
          }}>.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 1200 }
  )
}
