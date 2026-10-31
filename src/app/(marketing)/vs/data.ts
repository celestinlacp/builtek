export type CompetitorFeature = {
  feature: string
  builtek: string
  competitor: string
}

export type Competitor = {
  slug: string
  name: string
  tagline: string
  pricingNote: string
  targetMarket: string
  builtekPitch: string
  table: CompetitorFeature[]
}

export const COMPETITORS: Competitor[] = [
  {
    slug: 'procore',
    name: 'Procore',
    tagline: '¿Procore es demasiado caro para tu obra?',
    pricingNote: '$35,000 USD/año o más. Sin precio público.',
    targetMarket: 'Empresas enterprise en EE.UU. y Europa.',
    builtekPitch: 'Builtek te da el 80% de las funciones de Procore al 5% del costo, en español, con precios en MXN y CFDI incluido.',
    table: [
      { feature: 'Precio de entrada', builtek: '$1,890 MXN/mes', competitor: '$35,000+ USD/año' },
      { feature: 'Idioma', builtek: 'Español nativo', competitor: 'Inglés (español limitado)' },
      { feature: 'Facturación CFDI', builtek: 'Incluida en todos los planes', competitor: 'No disponible' },
      { feature: 'Agente AI para planos', builtek: 'Kota — extrae cuantificación automáticamente', competitor: 'No disponible' },
      { feature: 'WhatsApp integrado', builtek: 'Desde plan Obra', competitor: 'No disponible' },
      { feature: 'Soporte', builtek: 'En español, con el fundador', competitor: 'Tickets en inglés' },
      { feature: 'Trial', builtek: '14 días gratis, sin tarjeta', competitor: 'Demo con ventas' },
    ],
  },
  {
    slug: 'autodesk-build',
    name: 'Autodesk Build',
    tagline: '¿Autodesk Build es demasiado caro por usuario?',
    pricingNote: '$75 USD/usuario/mes. Para 5 usuarios: $375 USD/mes.',
    targetMarket: 'Empresas que ya usan el ecosistema Autodesk (AutoCAD, Revit).',
    builtekPitch: 'Builtek no te cobra por usuario — pagas por empresa. Y tienes AI para planos y WhatsApp que Autodesk Build no ofrece.',
    table: [
      { feature: 'Modelo de precio', builtek: 'Por empresa (flat fee)', competitor: 'Por usuario ($75 USD/usuario/mes)' },
      { feature: 'Precio para 5 usuarios', builtek: '$1,890 MXN/mes (~$102 USD)', competitor: '$375 USD/mes' },
      { feature: 'Agente AI para planos', builtek: 'Kota — extrae cuantificación', competitor: 'No disponible' },
      { feature: 'WhatsApp integrado', builtek: 'Desde plan Obra', competitor: 'No disponible' },
      { feature: 'Facturación CFDI', builtek: 'Incluida', competitor: 'No disponible' },
      { feature: 'Idioma', builtek: 'Español nativo', competitor: 'Español parcial' },
      { feature: 'Trial', builtek: '14 días gratis, sin tarjeta', competitor: 'Demo con ventas' },
    ],
  },
  {
    slug: 'fieldwire',
    name: 'Fieldwire',
    tagline: '¿Fieldwire no tiene AI ni WhatsApp para tu obra?',
    pricingNote: '$39–$59 USD/usuario/mes.',
    targetMarket: 'Equipos de campo en EE.UU.',
    builtekPitch: 'Fieldwire es bueno para planos en campo pero no tiene AI, no tiene WhatsApp y no factura en MXN. Builtek cubre todo eso.',
    table: [
      { feature: 'Agente AI para planos', builtek: 'Kota — extrae cuantificación', competitor: 'No disponible' },
      { feature: 'WhatsApp integrado', builtek: 'Desde plan Obra', competitor: 'No disponible' },
      { feature: 'Precio de entrada', builtek: '$1,890 MXN/mes', competitor: '$39 USD/usuario/mes' },
      { feature: 'Facturación CFDI', builtek: 'Incluida', competitor: 'No disponible' },
      { feature: 'Control documental', builtek: 'Versiones, flujo de aprobación, R2', competitor: 'Básico' },
      { feature: 'Módulo de Oficios', builtek: 'Disponible en Pro', competitor: 'No disponible' },
      { feature: 'Idioma', builtek: 'Español nativo', competitor: 'Inglés' },
    ],
  },
  {
    slug: 'constructora360',
    name: 'Constructora360',
    tagline: '¿Buscas una alternativa a Constructora360 con AI?',
    pricingNote: '$4,500 MXN/mes aprox.',
    targetMarket: 'Constructoras medianas en México.',
    builtekPitch: 'Builtek tiene AI para planos (Kota) y WhatsApp integrado que Constructora360 no ofrece, a un precio similar.',
    table: [
      { feature: 'Agente AI para planos', builtek: 'Kota — extrae cuantificación automáticamente', competitor: 'No disponible' },
      { feature: 'WhatsApp integrado', builtek: 'Desde plan Obra', competitor: 'No disponible' },
      { feature: 'Precio de entrada', builtek: '$1,890 MXN/mes', competitor: '~$4,500 MXN/mes' },
      { feature: 'Drive compartido', builtek: 'Incluido con links públicos y QR', competitor: 'Limitado' },
      { feature: 'Control documental', builtek: 'Versiones, flujo de aprobación', competitor: 'Básico' },
      { feature: 'Trial', builtek: '14 días gratis, sin tarjeta', competitor: 'Demo con ventas' },
    ],
  },
]

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find(c => c.slug === slug)
}
