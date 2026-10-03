'use client'

import { useState } from 'react'
import { Check, Minus, Eye, HardDrive, ChevronDown, ArrowRight, Zap, Bot, MessageSquare, Sparkles } from 'lucide-react'
import Link from 'next/link'

// ─── Data ────────────────────────────────────────────────────────────────────

const plans = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    billingNote: 'Para siempre',
    seats: '3 usuarios activos',
    storage: '1 GB',
    aiExtractions: null as string | null,
    whatsapp: null as string | null,
    desc: 'Para explorar Builtek sin compromiso.',
    cta: 'Solicitar demo',
    ctaHref: '/demo',
    ctaVariant: 'ghost' as const,
    featured: false,
    features: [
      { text: '1 proyecto activo', ok: true },
      { text: 'TaskBoard básico', ok: true },
      { text: 'Drive (1 GB, carpetas básicas)', ok: true },
      { text: 'Links públicos y QR', ok: false },
      { text: 'Agente AI', ok: false },
      { text: 'Notificaciones WhatsApp', ok: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: 1890,
    annual: 1490,
    billingNote: 'por empresa / mes + IVA',
    seats: '5 usuarios activos',
    storage: '100 GB',
    aiExtractions: '10 extracciones AI/mes',
    whatsapp: null,
    desc: 'Para equipos pequeños que quieren dejar el Excel.',
    cta: 'Solicitar demo',
    ctaHref: '/demo',
    ctaVariant: 'outline' as const,
    featured: false,
    features: [
      { text: 'Proyectos ilimitados', ok: true },
      { text: 'TaskBoard por especialidad', ok: true },
      { text: 'Drive + links públicos y QR (100 GB)', ok: true },
      { text: '10 extracciones AI/mes', ok: true, highlight: true },
      { text: 'Roles completos (5 niveles)', ok: true },
      { text: 'Notificaciones WhatsApp', ok: false },
      { text: 'Versiones y flujo de aprobación', ok: false },
    ],
  },
  {
    id: 'obra',
    name: 'Obra',
    monthly: 3790,
    annual: 2990,
    billingNote: 'por empresa / mes + IVA',
    seats: '8 usuarios activos',
    storage: '500 GB',
    aiExtractions: '25 extracciones AI/mes',
    whatsapp: '100 mensajes WhatsApp/mes',
    badge: 'Más popular',
    desc: 'Para equipos activos en campo que necesitan IA y comunicación automática.',
    cta: 'Solicitar demo',
    ctaHref: '/demo',
    ctaVariant: 'primary' as const,
    featured: true,
    features: [
      { text: 'Proyectos ilimitados', ok: true },
      { text: 'Todo Starter +', ok: true },
      { text: '100 mensajes WhatsApp/mes', ok: true, highlight: true },
      { text: '25 extracciones AI/mes', ok: true, highlight: true },
      { text: 'Versiones de documentos', ok: true },
      { text: 'Flujo de aprobación (Two-Person Rule)', ok: true },
      { text: 'Calendario de obra', ok: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 8490,
    annual: 6790,
    billingNote: 'por empresa / mes + IVA',
    seats: '15 usuarios activos',
    storage: '3 TB',
    aiExtractions: '100 extracciones AI/mes',
    whatsapp: '500 mensajes WhatsApp/mes',
    desc: 'Para constructoras con control documental completo y análisis avanzado.',
    cta: 'Solicitar demo',
    ctaHref: '/demo',
    ctaVariant: 'outline' as const,
    featured: false,
    features: [
      { text: 'Proyectos ilimitados', ok: true },
      { text: 'Todo Obra +', ok: true },
      { text: '500 mensajes WhatsApp/mes', ok: true, highlight: true },
      { text: '100 extracciones AI/mes', ok: true, highlight: true },
      { text: 'Módulo Oficios (correspondencia técnica)', ok: true },
      { text: 'Panel BI: base de datos documental', ok: true },
      { text: 'Visor PDF en browser', ok: true },
      { text: 'Agente RAG: acceso anticipado gratis al lanzarse', ok: true, highlight: true },
    ],
  },
  {
    id: 'contractor',
    name: 'Contractor',
    monthly: 12990,
    annual: 10390,
    billingNote: 'por empresa / mes + IVA',
    seats: '30 usuarios activos',
    storage: '5 TB',
    aiExtractions: '300 extracciones AI/mes',
    whatsapp: '1,000 mensajes WhatsApp/mes',
    desc: 'Para constructoras con múltiples frentes y equipos grandes.',
    cta: 'Solicitar demo',
    ctaHref: '/demo',
    ctaVariant: 'outline' as const,
    featured: false,
    features: [
      { text: 'Proyectos ilimitados', ok: true },
      { text: 'Todo Pro +', ok: true },
      { text: '1,000 mensajes WhatsApp/mes', ok: true, highlight: true },
      { text: '300 extracciones AI/mes', ok: true, highlight: true },
      { text: 'Subproyectos y frentes de obra', ok: true },
      { text: 'API básica', ok: true },
      { text: 'RAG multiproyecto: acceso anticipado gratis', ok: true, highlight: true },
      { text: 'Soporte dedicado (respuesta 4h)', ok: true },
    ],
  },
]

const addonTiers = [
  { gb: '+100 GB',  price: 149 },
  { gb: '+250 GB',  price: 349 },
  { gb: '+500 GB',  price: 649 },
  { gb: '+1 TB',    price: 1290 },
  { gb: '+2 TB',    price: 2490 },
  { gb: '+3 TB',    price: 3690 },
]

const faqs = [
  {
    q: '¿Qué es un usuario activo?',
    a: 'Es cualquier persona que crea, edita, aprueba o gestiona contenido en Builtek: un ingeniero actualizando tareas, un residente subiendo planos, un director aprobando documentos. Los Viewers (solo lectura) no cuentan como activos y son ilimitados en todos los planes.',
  },
  {
    q: '¿Cómo funciona la prueba de 14 días?',
    a: 'Todo nuevo registro entra automáticamente al plan Obra completo durante 14 días, sin tarjeta de crédito. Al terminar, si no contratas un plan pagado, tu cuenta baja a Free conservando todos tus datos. Podrás subir de plan en cualquier momento.',
  },
  {
    q: '¿Los precios incluyen IVA?',
    a: 'No. Los precios mostrados son más IVA (16%). Todos los planes pagados incluyen factura CFDI 4.0. Si tu empresa puede deducir el IVA, el costo efectivo es el precio antes de impuestos.',
  },
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí, sin penalización. Los cambios aplican al siguiente ciclo. Si subes de plan a mitad del mes, cobramos solo la diferencia proporcional. Si bajas, el cambio aplica al inicio del siguiente período.',
  },
  {
    q: '¿Qué pasa si necesito más almacenamiento?',
    a: 'Puedes agregar bloques adicionales desde $149 MXN/mes sin cambiar de plan. El almacenamiento se suma al incluido. Puedes agregar o quitar bloques cuando quieras desde tu configuración.',
  },
  {
    q: '¿Qué es el Plan Partner?',
    a: 'Es un servicio de desarrollo y consultoría a la medida: analizamos cómo trabaja tu empresa y programamos las funciones que necesitas en tu workspace, mes a mes con el fundador. Todo lo desarrollado se queda en tu cuenta aunque cambies de plan. Incluye 1 sesión mensual y 4 horas de desarrollo. Requiere un plan base (Pro o Contractor). Escríbenos a hola@menvio.app para cotizar.',
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
      {price !== null && price > 0 ? (
        <div className="mb-1">
          <div className="flex items-baseline gap-1">
            <span className="text-white/40 text-lg font-light">$</span>
            <span className="text-4xl font-bold text-white tracking-tight">
              {price.toLocaleString('es-MX')}
            </span>
            <span className="text-white/30 text-sm ml-1">MXN/mes</span>
          </div>
          {savings && annual ? (
            <p className="text-emerald-400 text-xs font-medium mt-1">
              Ahorras ${savings.toLocaleString('es-MX')}/año
            </p>
          ) : (
            <p className="text-white/25 text-xs mt-1">{plan.billingNote}</p>
          )}
        </div>
      ) : price === 0 ? (
        <div className="mb-1">
          <span className="text-4xl font-bold text-white tracking-tight">$0</span>
          <p className="text-white/25 text-xs mt-1">{plan.billingNote}</p>
        </div>
      ) : null}

      {/* Metadata */}
      <div className="flex flex-col gap-1.5 mt-4 mb-5 pb-5 border-b border-white/8">
        {/* Usuarios */}
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-[#00C2FF]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#00C2FF] text-[10px] font-bold">U</span>
          </span>
          <span className="text-white/55 text-xs">{plan.seats}</span>
        </div>
        {/* Viewers */}
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-2.5 h-2.5 text-emerald-400" />
          </span>
          <span className="text-emerald-400 text-xs font-medium">Viewers ilimitados gratis</span>
        </div>
        {/* Storage */}
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-2.5 h-2.5 text-white/30" />
          </span>
          <span className="text-white/35 text-xs">{plan.storage} incluido</span>
        </div>
        {/* AI extractions */}
        {plan.aiExtractions && (
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-[#00C2FF]/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-2.5 h-2.5 text-[#00C2FF]" />
            </span>
            <span className="text-[#00C2FF]/70 text-xs">{plan.aiExtractions}</span>
          </div>
        )}
        {/* WhatsApp */}
        {plan.whatsapp && (
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
            </span>
            <span className="text-emerald-400/70 text-xs">{plan.whatsapp}</span>
          </div>
        )}
      </div>

      {/* Features */}
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
                ? (f as any).highlight ? 'text-[#00C2FF] font-medium' : 'text-white/60'
                : 'text-white/20'
            }`}>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link href={plan.ctaHref}
        className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${ctaClass}`}>
        {plan.cta}
      </Link>
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
    <section id="precios" className="bg-[#060e1c] py-14 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00C2FF]/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-medium tracking-wide">Precios en pesos mexicanos</span>
          </div>
          <h2 className="text-2xl md:text-4xl text-white leading-tight mb-4">
            <span className="font-light">Digitaliza toda tu obra.</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">
              Una cuota fija mensual.
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto font-light leading-relaxed">
            Sin cobros por usuario. Sin sorpresas. Proyectos ilimitados y Viewers gratis en todos los planes pagados.
          </p>
        </div>

        {/* Prueba invertida banner */}
        <div className="bg-[#00C2FF]/5 border border-[#00C2FF]/20 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
          <Sparkles className="w-5 h-5 text-[#00C2FF] flex-shrink-0" />
          <div>
            <span className="text-[#00C2FF] font-semibold text-sm">14 días con el plan Obra completo — gratis. </span>
            <span className="text-white/40 text-sm font-light">
              Todo registro nuevo entra al plan Obra (IA + WhatsApp incluidos). Sin tarjeta de crédito. Al terminar, eliges tu plan o bajas a Free conservando tus datos.
            </span>
          </div>
        </div>

        {/* Annual toggle */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch mb-6">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        {/* Partner + Enterprise callouts */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {/* Partner */}
          <div className="bg-gradient-to-r from-[#00C2FF]/5 to-transparent border border-[#00C2FF]/15 rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#00C2FF]/60 mb-2">Partner</p>
              <p className="text-white font-semibold text-xl mb-2">Desde $8,000 MXN/mes</p>
              <p className="text-white/35 text-sm font-light leading-relaxed">
                Sobre plan base Pro o Contractor. Incluye 1 sesión mensual con el fundador + 4 hrs de desarrollo a la medida. Todo lo desarrollado es tuyo, siempre.
              </p>
            </div>
            <a href="mailto:hola@menvio.app?subject=Plan Partner"
              className="inline-flex items-center gap-2 text-[#00C2FF] text-sm font-semibold hover:gap-3 transition-all">
              Solicitar información <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Enterprise */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-white/30 mb-2">Enterprise</p>
              <p className="text-white font-semibold text-xl mb-2">Cotización</p>
              <p className="text-white/35 text-sm font-light leading-relaxed">
                31+ usuarios · Almacenamiento ilimitado · SLA garantizado · API completa · CFDI (facturación electrónica MX) · Onboarding dedicado · Roles personalizados.
              </p>
            </div>
            <a href="mailto:hola@menvio.app?subject=Enterprise"
              className="inline-flex items-center gap-2 text-white/40 text-sm font-semibold hover:text-white hover:gap-3 transition-all">
              Hablar con ventas <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Viewer callout */}
        <div className="bg-emerald-400/5 border border-emerald-400/15 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-12">
          <Eye className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-emerald-400 font-semibold text-sm">Viewers ilimitados, siempre gratis. </span>
            <span className="text-white/40 text-sm font-light">
              Subcontratistas, clientes, auditores — todos pueden ver el avance, descargar planos y revisar tareas sin contar como usuario activo.
            </span>
          </div>
        </div>

        {/* Storage add-on */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-7 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">¿Necesitas más almacenamiento?</h3>
              <p className="text-white/35 text-sm font-light">
                Agrega bloques adicionales a cualquier plan. Solo pagas lo que agregas.
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
                <p className="text-[#00C2FF] text-sm font-bold mt-1">
                  ${t.price.toLocaleString('es-MX')}
                  <span className="text-white/30 text-[10px] font-normal"> MXN/mes</span>
                </p>
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

        {/* Final CTA */}
        <div className="text-center">
          <Link href="/register"
            className="inline-flex items-center gap-3 bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-bold text-base hover:bg-white transition-colors shadow-2xl shadow-[#00C2FF]/20 mb-6">
            Comenzar 14 días gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/25 font-light">
            <span>✓ Sin tarjeta de crédito</span>
            <span>✓ 14 días plan Obra completo</span>
            <span>✓ Factura CFDI en todos los planes pagados</span>
            <span>✓ Cancela cuando quieras</span>
          </div>
        </div>

      </div>
    </section>
  )
}
