'use client'

import { useState } from 'react'
import { Check, Minus, Eye, HardDrive, ChevronDown, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

// ─── Data ────────────────────────────────────────────────────────────────────

const plans = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    billingNote: 'Para siempre',
    seats: '3 seats activos',
    storage: '1 GB',
    desc: 'Para explorar Builtek sin compromiso.',
    cta: 'Empezar gratis',
    ctaHref: '/register',
    ctaVariant: 'ghost' as const,
    featured: false,
    features: [
      { text: '1 proyecto activo', ok: true },
      { text: 'TaskBoard básico', ok: true },
      { text: 'Drive (1 GB)', ok: true },
      { text: 'Agente AI', ok: false },
      { text: 'Módulo Oficios', ok: false },
      { text: 'Control documental completo', ok: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: 49,
    annual: 39,
    billingNote: 'por empresa / mes',
    seats: 'Hasta 3 seats activos',
    storage: '50 GB',
    desc: 'Para equipos pequeños que quieren dejar el Excel.',
    cta: 'Prueba 14 días gratis',
    ctaHref: '/register',
    ctaVariant: 'outline' as const,
    featured: false,
    features: [
      { text: 'Proyectos ilimitados', ok: true },
      { text: 'TaskBoard por especialidad', ok: true },
      { text: 'Control documental básico', ok: true },
      { text: 'Drive + links públicos y QR', ok: true },
      { text: 'Roles completos (5 niveles)', ok: true },
      { text: 'Agente AI', ok: false },
      { text: 'Módulo Oficios', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 149,
    annual: 119,
    billingNote: 'por empresa / mes',
    seats: 'Hasta 8 seats activos',
    storage: '1 TB',
    badge: 'Más popular',
    desc: 'Para equipos activos en obra con control documental completo y AI.',
    cta: 'Prueba 14 días gratis',
    ctaHref: '/register',
    ctaVariant: 'primary' as const,
    featured: true,
    features: [
      { text: 'Todo lo de Starter', ok: true },
      { text: 'Agente AI: cuantificación de planos PDF', ok: true, highlight: true },
      { text: 'Módulo Oficios (Entrada/Salida + PDF)', ok: true },
      { text: 'Versiones de documentos', ok: true },
      { text: 'Flujo de aprobaciones', ok: true },
      { text: 'Visor PDF en browser', ok: true },
      { text: 'Comentarios en tareas', ok: true },
    ],
  },
  {
    id: 'contractor',
    name: 'Contractor',
    monthly: 299,
    annual: 239,
    billingNote: 'por empresa / mes',
    seats: 'Hasta 20 seats activos',
    storage: '2 TB',
    desc: 'Para constructoras con múltiples frentes y equipos grandes.',
    cta: 'Hablar con ventas',
    ctaHref: 'mailto:hola@builtek.app',
    ctaVariant: 'outline' as const,
    featured: false,
    features: [
      { text: 'Todo lo de Pro', ok: true },
      { text: 'Migración asistida desde Dropbox', ok: true },
      { text: 'AI sin límite de extracciones', ok: true },
      { text: 'Soporte prioritario', ok: true },
      { text: 'Visor DWG en browser', ok: true },
      { text: 'Dashboard de frentes avanzado', ok: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: null,
    annual: null,
    billingNote: '21+ seats · precio a medida',
    seats: 'Seats ilimitados',
    storage: 'Ilimitado',
    desc: 'Para constructoras con grandes volúmenes de obra y requerimientos específicos.',
    cta: 'Hablar con ventas',
    ctaHref: 'mailto:hola@builtek.app',
    ctaVariant: 'dark' as const,
    featured: false,
    features: [
      { text: 'Todo lo de Contractor', ok: true },
      { text: 'Onboarding dedicado', ok: true },
      { text: 'SLA garantizado', ok: true },
      { text: 'API pública', ok: true },
      { text: 'CFDI (factura electrónica MX)', ok: true },
      { text: 'Roles personalizados', ok: true },
    ],
  },
]

const addonTiers = [
  { gb: '+100 GB', price: 5 },
  { gb: '+250 GB', price: 12.50 },
  { gb: '+500 GB', price: 25 },
  { gb: '+1 TB',   price: 51 },
  { gb: '+2 TB',   price: 102 },
  { gb: '+3 TB',   price: 154 },
]

const faqs = [
  {
    q: '¿Qué es un seat activo?',
    a: 'Es cualquier usuario que crea, edita, aprueba o gestiona contenido en Builtek — un ingeniero actualizando tareas, un residente subiendo planos, un director aprobando documentos. Quien trabaja activamente en la plataforma.',
  },
  {
    q: '¿Los Viewers son realmente gratis?',
    a: 'Sí, ilimitados en todos los planes. Un Viewer puede ver tareas, consultar el dashboard y descargar documentos, pero no puede crear ni editar. Perfecto para subcontratistas, clientes, auditores o directivos que solo necesitan consultar el avance.',
  },
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Puedes subir o bajar de plan desde tu panel de configuración sin penalización. Los cambios aplican al siguiente ciclo. Si subes de plan a mitad del mes, cobramos solo la diferencia proporcional.',
  },
  {
    q: '¿Qué pasa si necesito más storage?',
    a: 'Puedes agregar bloques de almacenamiento adicional desde $5/mes directamente desde tu configuración. Solo pagas lo que agregas, sobre el storage ya incluido en tu plan. Sin contratos ni compromisos.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanCard({ plan, annual }: { plan: typeof plans[0]; annual: boolean }) {
  const price = annual ? plan.annual : plan.monthly
  const savings = plan.monthly && plan.annual
    ? (plan.monthly - plan.annual) * 12
    : null

  const ctaClass = {
    ghost:   'border border-white/10 text-white/40 hover:text-white hover:border-white/30',
    outline: 'border border-white/20 text-white hover:border-[#00C2FF]/50 hover:text-[#00C2FF]',
    primary: 'bg-[#00C2FF] text-[#0D1729] hover:bg-white shadow-lg shadow-[#00C2FF]/20',
    dark:    'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8',
  }[plan.ctaVariant]

  return (
    <div className={`
      relative flex flex-col rounded-2xl p-6 transition-all duration-200
      ${plan.featured
        ? 'bg-gradient-to-b from-[#00C2FF]/8 to-[#0D1729]/60 border border-[#00C2FF]/35 shadow-xl shadow-[#00C2FF]/8'
        : 'bg-white/3 border border-white/8 hover:border-white/15'
      }
    `}>
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00C2FF] text-[#0D1729] text-[11px] font-bold tracking-wide uppercase px-4 py-1 rounded-full whitespace-nowrap">
          {plan.badge}
        </div>
      )}

      {/* Plan name */}
      <p className={`text-xs font-bold tracking-widest uppercase mb-3 ${plan.featured ? 'text-[#00C2FF]' : 'text-white/35'}`}>
        {plan.name}
      </p>

      {/* Price */}
      {price !== null ? (
        <div className="mb-1">
          <div className="flex items-baseline gap-1">
            {price > 0 && <span className="text-white/40 text-lg font-light">$</span>}
            <span className="text-4xl font-bold text-white tracking-tight">
              {price === 0 ? '$0' : price}
            </span>
            {price > 0 && <span className="text-white/30 text-sm ml-1">/mes</span>}
          </div>
          {savings && annual ? (
            <p className="text-emerald-400 text-xs font-medium mt-1">Ahorras ${savings}/año</p>
          ) : (
            <p className="text-white/25 text-xs mt-1">{plan.billingNote}</p>
          )}
        </div>
      ) : (
        <div className="mb-1">
          <p className="text-2xl font-bold text-white mb-1">Cotización</p>
          <p className="text-white/25 text-xs">{plan.billingNote}</p>
        </div>
      )}

      {/* Seats + Viewers + Storage */}
      <div className="flex flex-col gap-1.5 mt-4 mb-5 pb-5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-[#00C2FF]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#00C2FF] text-[10px] font-bold">S</span>
          </span>
          <span className="text-white/55 text-xs">{plan.seats}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-2.5 h-2.5 text-emerald-400" />
          </span>
          <span className="text-emerald-400 text-xs font-medium">Viewers ilimitados gratis</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-2.5 h-2.5 text-white/30" />
          </span>
          <span className="text-white/35 text-xs">{plan.storage} incluido</span>
        </div>
      </div>

      {/* Features — flex-1 pushes CTA to bottom */}
      <ul className="flex-1 space-y-2.5 mb-6">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {f.ok ? (
              <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${(f as any).highlight ? 'text-[#00C2FF]' : 'text-emerald-400'}`} />
            ) : (
              <Minus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white/15" />
            )}
            <span className={`text-xs leading-relaxed ${
              f.ok
                ? (f as any).highlight
                  ? 'text-[#00C2FF] font-medium'
                  : 'text-white/60'
                : 'text-white/20'
            }`}>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {plan.ctaHref.startsWith('/') ? (
        <Link href={plan.ctaHref}
          className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${ctaClass}`}>
          {plan.cta}
        </Link>
      ) : (
        <a href={plan.ctaHref}
          className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${ctaClass}`}>
          {plan.cta}
        </a>
      )}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border border-white/8 rounded-xl overflow-hidden cursor-pointer hover:border-white/15 transition-colors"
      onClick={() => setOpen(v => !v)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm font-medium text-white/70">{q}</p>
        <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 ml-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-white/40 leading-relaxed font-light">{a}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="precios" className="bg-[#060e1c] py-24 px-6 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00C2FF]/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-medium tracking-wide">Precios transparentes</span>
          </div>
          <h2 className="text-3xl md:text-5xl text-white leading-tight mb-4">
            <span className="font-light">Digitaliza toda tu obra.</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">
              Una cuota fija mensual.
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto font-light leading-relaxed">
            Sin cobros por usuario. Sin sorpresas. Viewers ilimitados gratis en todos los planes.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium transition-colors ${!annual ? 'text-white' : 'text-white/30'}`}>
            Mensual
          </span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-[#00C2FF]' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${annual ? 'left-6' : 'left-0.5'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium transition-colors ${annual ? 'text-white' : 'text-white/30'}`}>
              Anual
            </span>
            <span className="bg-emerald-400/15 text-emerald-400 border border-emerald-400/25 text-xs font-bold px-2.5 py-0.5 rounded-full">
              20% off
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch mb-10">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        {/* Viewer callout */}
        <div className="bg-emerald-400/5 border border-emerald-400/15 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-12">
          <Eye className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-emerald-400 font-semibold text-sm">Viewers ilimitados, siempre gratis. </span>
            <span className="text-white/40 text-sm font-light">
              Subcontratistas, clientes, auditores — todos pueden ver el avance, descargar planos y revisar tareas sin ocupar un seat. Inspirado en el modelo de Procore y Figma.
            </span>
          </div>
        </div>

        {/* Storage add-on */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-7 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">¿Necesitas más almacenamiento?</h3>
              <p className="text-white/35 text-sm font-light">
                Agrega storage adicional a cualquier plan. Solo pagas lo que agregas, sobre el incluido.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 flex-shrink-0">
              <HardDrive className="w-4 h-4 text-white/30" />
              <span className="text-white/40 text-xs font-light">Cloudflare R2 · Egress $0</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {addonTiers.map(t => (
              <div key={t.gb}
                className="bg-white/3 border border-white/8 hover:border-[#00C2FF]/30 hover:bg-[#00C2FF]/5 rounded-xl p-3 text-center cursor-pointer transition-all group">
                <p className="text-white/70 text-xs font-semibold group-hover:text-[#00C2FF] transition-colors">{t.gb}</p>
                <p className="text-[#00C2FF] text-sm font-bold mt-1">${t.price}<span className="text-white/30 text-[10px] font-normal">/mes</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h3 className="text-center text-white font-semibold text-xl mb-6">Preguntas frecuentes</h3>
          <div className="space-y-3">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* Trust bar + final CTA */}
        <div className="text-center">
          <a href="mailto:hola@builtek.app"
            className="inline-flex items-center gap-3 bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-bold text-base hover:bg-white transition-colors shadow-2xl shadow-[#00C2FF]/20 mb-6">
            Solicitar demo gratis
            <ArrowRight className="w-5 h-5" />
          </a>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/25 font-light">
            <span>✓ Sin tarjeta de crédito</span>
            <span>✓ Sin contrato de permanencia</span>
            <span>✓ 14 días gratis en planes pagados</span>
            <span>✓ Cancela cuando quieras</span>
          </div>
        </div>

      </div>
    </section>
  )
}
