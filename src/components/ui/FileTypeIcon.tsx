/**
 * FileTypeIcon — ícono de archivo estilo documento con badge de tipo.
 * Soporta: pdf, dwg, dxf, xlsx, xls, docx, doc, pptx, ppt, img, zip, rar, other
 */

type Props = {
  fileType: string
  size?: number   // ancho en px (alto = size * 1.25)
  className?: string
}

type BadgeDef = {
  bg: string     // color de fondo del badge
  label: string  // texto corto
  textColor?: string
}

const BADGES: Record<string, BadgeDef> = {
  pdf:   { bg: '#E53935', label: 'PDF',  textColor: '#fff' },
  dwg:   { bg: '#1565C0', label: 'DWG',  textColor: '#fff' },
  dxf:   { bg: '#1976D2', label: 'DXF',  textColor: '#fff' },
  xlsx:  { bg: '#1E7E45', label: 'XLS',  textColor: '#fff' },
  xls:   { bg: '#1E7E45', label: 'XLS',  textColor: '#fff' },
  docx:  { bg: '#1565C0', label: 'DOC',  textColor: '#fff' },
  doc:   { bg: '#1565C0', label: 'DOC',  textColor: '#fff' },
  pptx:  { bg: '#FF5722', label: 'PPT',  textColor: '#fff' },
  ppt:   { bg: '#FF5722', label: 'PPT',  textColor: '#fff' },
  img:   { bg: '#7B1FA2', label: 'IMG',  textColor: '#fff' },
  zip:   { bg: '#F57F17', label: 'ZIP',  textColor: '#fff' },
  rar:   { bg: '#E65100', label: 'RAR',  textColor: '#fff' },
  other: { bg: '#757575', label: 'FILE', textColor: '#fff' },
}

export function FileTypeIcon({ fileType, size = 40, className = '' }: Props) {
  const type  = fileType?.toLowerCase() ?? 'other'
  const badge = BADGES[type] ?? BADGES.other
  const w     = size
  const h     = Math.round(size * 1.25)
  const fold  = Math.round(size * 0.22)    // tamaño del pliegue en la esquina
  const bh    = Math.round(h * 0.30)       // altura del badge
  const by    = h - bh                     // y del badge
  const r     = Math.round(size * 0.06)    // border radius
  const fs    = Math.round(size * 0.185)   // font size del label

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={badge.label}
    >
      {/* Sombra suave */}
      <rect x="2" y="3" width={w - 4} height={h - 3} rx={r} fill="rgba(0,0,0,0.08)" />

      {/* Cuerpo del documento */}
      <path
        d={`M${r},1 H${w - fold - 1} L${w - 1},${fold + 1} V${h - r} Q${w - 1},${h - 1} ${w - r - 1},${h - 1} H${r + 1} Q1,${h - 1} 1,${h - r} V${r + 1} Q1,1 ${r + 1},1 Z`}
        fill="white"
        stroke="#E0E0E0"
        strokeWidth="1"
      />

      {/* Pliegue de esquina */}
      <path
        d={`M${w - fold - 1},1 L${w - fold - 1},${fold + 1} L${w - 1},${fold + 1}`}
        fill="#F5F5F5"
        stroke="#E0E0E0"
        strokeWidth="1"
      />

      {/* Badge de tipo — fondo */}
      <path
        d={`M1,${by} H${w - 1} V${h - r} Q${w - 1},${h - 1} ${w - r - 1},${h - 1} H${r + 1} Q1,${h - 1} 1,${h - r} Z`}
        fill={badge.bg}
      />

      {/* Texto del badge */}
      <text
        x={w / 2}
        y={by + bh * 0.68}
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize={fs}
        fill={badge.textColor ?? '#fff'}
        letterSpacing="-0.5"
      >
        {badge.label}
      </text>
    </svg>
  )
}
