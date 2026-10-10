import Link from 'next/link'
import { AnimateIn } from '@/components/AnimateIn'
import {
  LayoutDashboard, CheckSquare, FileText, HardDrive,
  Bot, Calendar, ArrowRight, ChevronRight, Zap,
  Shield, Users, TrendingUp, QrCode, Upload,
  Layers, Menu, MessageSquare, Sparkles, BookOpen, Wrench
} from 'lucide-react'
import PricingSection from '@/components/PricingSection'
import MobileNav from '@/components/MobileNav'

// ── Blueprint Animation Background ────────────────────────────────────────────
function ConstructionBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <style>{`
        @keyframes bp-slide {
          0%   { opacity:0; transform:translateY(10px); }
          15%  { opacity:1; transform:translateY(0); }
          80%  { opacity:0.8; transform:translateY(0); }
          100% { opacity:0; transform:translateY(-10px); }
        }
        @keyframes bp-pulse {
          0%,100% { opacity:0; transform:scale(0.92); }
          35%,65% { opacity:1; transform:scale(1); }
        }
        @keyframes bp-fade {
          0%,100% { opacity:0; }
          30%,70% { opacity:1; }
        }
      `}</style>

      {/* Column markers — square with X (blueprint symbol for structural columns) */}
      {([
        { x:'7%',  y:'22%', d:'0s',   dur:'14s' },
        { x:'24%', y:'68%', d:'4.5s', dur:'16s' },
        { x:'78%', y:'28%', d:'8s',   dur:'13s' },
        { x:'91%', y:'72%', d:'2s',   dur:'15s' },
        { x:'48%', y:'88%', d:'11s',  dur:'12s' },
        { x:'62%', y:'12%', d:'6s',   dur:'17s' },
        { x:'33%', y:'35%', d:'14s',  dur:'14s' },
      ] as {x:string;y:string;d:string;dur:string}[]).map((p, i) => (
        <div key={`col-${i}`} style={{ position:'absolute', left:p.x, top:p.y, color:'rgba(0,194,255,0.13)', animation:`bp-slide linear ${p.dur} ${p.d} infinite` }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="20" height="20" stroke="currentColor" strokeWidth="1"/>
            <line x1="1" y1="1" x2="21" y2="21" stroke="currentColor" strokeWidth="0.7"/>
            <line x1="21" y1="1" x2="1"  y2="21" stroke="currentColor" strokeWidth="0.7"/>
          </svg>
        </div>
      ))}

      {/* Survey control crosses (+) */}
      {([
        { x:'16%', y:'42%', d:'3s',   dur:'11s' },
        { x:'38%', y:'16%', d:'7s',   dur:'13s' },
        { x:'64%', y:'58%', d:'1s',   dur:'15s' },
        { x:'86%', y:'9%',  d:'9.5s', dur:'12s' },
        { x:'52%', y:'76%', d:'5s',   dur:'14s' },
        { x:'4%',  y:'82%', d:'13s',  dur:'16s' },
      ] as {x:string;y:string;d:string;dur:string}[]).map((p, i) => (
        <div key={`cross-${i}`} style={{ position:'absolute', left:p.x, top:p.y, color:'rgba(0,194,255,0.10)', animation:`bp-pulse ease-in-out ${p.dur} ${p.d} infinite` }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="9" y1="0" x2="9"  y2="18" stroke="currentColor" strokeWidth="0.9"/>
            <line x1="0" y1="9" x2="18" y2="9"  stroke="currentColor" strokeWidth="0.9"/>
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>
      ))}

      {/* Dimension lines */}
      {([
        { x:'3%',  y:'54%', d:'5s',  dur:'18s', rot:'0deg'  },
        { x:'42%', y:'82%', d:'12s', dur:'20s', rot:'0deg'  },
        { x:'70%', y:'44%', d:'2s',  dur:'16s', rot:'90deg' },
        { x:'88%', y:'35%', d:'16s', dur:'19s', rot:'0deg'  },
      ] as {x:string;y:string;d:string;dur:string;rot:string}[]).map((p, i) => (
        <div key={`dim-${i}`} style={{ position:'absolute', left:p.x, top:p.y, color:'rgba(0,194,255,0.08)', transform:`rotate(${p.rot})`, animation:`bp-slide linear ${p.dur} ${p.d} infinite` }}>
          <svg width="52" height="16" viewBox="0 0 52 16" fill="none">
            <line x1="0"  y1="8" x2="52" y2="8" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 2"/>
            <line x1="0"  y1="3" x2="0"  y2="13" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="52" y1="3" x2="52" y2="13" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </div>
      ))}

      {/* I-beam cross-sections */}
      {([
        { x:'29%', y:'52%', d:'8s',  dur:'15s' },
        { x:'74%', y:'78%', d:'15s', dur:'17s' },
        { x:'55%', y:'32%', d:'3s',  dur:'18s' },
      ] as {x:string;y:string;d:string;dur:string}[]).map((p, i) => (
        <div key={`beam-${i}`} style={{ position:'absolute', left:p.x, top:p.y, color:'rgba(0,194,255,0.09)', animation:`bp-pulse ease-in-out ${p.dur} ${p.d} infinite` }}>
          <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
            <rect x="1" y="1"  width="20" height="5"  stroke="currentColor" strokeWidth="1"/>
            <rect x="1" y="22" width="20" height="5"  stroke="currentColor" strokeWidth="1"/>
            <rect x="8" y="6"  width="6"  height="16" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </div>
      ))}

      {/* Grid coordinate labels */}
      {([
        { x:'6%',  y:'18%', txt:'A-1', d:'1s',   dur:'14s' },
        { x:'93%', y:'68%', txt:'B-4', d:'10s',  dur:'13s' },
        { x:'47%', y:'93%', txt:'C-2', d:'6s',   dur:'16s' },
        { x:'19%', y:'73%', txt:'A-3', d:'3.5s', dur:'15s' },
        { x:'82%', y:'22%', txt:'D-1', d:'7.5s', dur:'12s' },
      ] as {x:string;y:string;txt:string;d:string;dur:string}[]).map((p, i) => (
        <div key={`lbl-${i}`} style={{ position:'absolute', left:p.x, top:p.y, color:'rgba(0,194,255,0.15)', fontFamily:'monospace', fontSize:'9px', letterSpacing:'0.06em', fontWeight:400, animation:`bp-fade ease-in-out ${p.dur} ${p.d} infinite` }}>
          {p.txt}
        </div>
      ))}
    </div>
  )
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    'Proyectos ilimitados',
    'Sin cobros por usuario',
    'Viewers gratis en todos los planes',
    'WhatsApp integrado',
    'CFDI en planes pagados',
    'Control de versiones',
    'Aprobaciones firmadas',
    'Empresa mexicana · CDMX',
    'Trazabilidad total',
    'Drive compartido',
  ]
  return (
    <div className="bg-[#0a1220] border-y border-white/5 py-3 overflow-hidden">
      <div className="ticker-track">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-5 px-5">
            <span className="text-white/22 text-xs font-light tracking-wide whitespace-nowrap">{item}</span>
            <span className="text-[#00C2FF]/20 text-xs flex-shrink-0">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1729]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00C2FF] rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-[#0D1729]" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Builtek</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#modulos"  className="text-white/50 hover:text-white text-sm font-normal transition-colors">Módulos</a>
          <a href="#ia"       className="text-white/50 hover:text-white text-sm font-normal transition-colors">Agente AI</a>
          <a href="#rag"      className="text-[#00C2FF]/70 hover:text-[#00C2FF] text-sm font-normal transition-colors flex items-center gap-1">
            <Sparkles className="w-3 h-3" />RAG
          </a>
          <a href="#drive"    className="text-white/50 hover:text-white text-sm font-normal transition-colors">Drive</a>
          <a href="#whatsapp" className="text-white/50 hover:text-white text-sm font-normal transition-colors">WhatsApp</a>
          <a href="#partner"  className="text-white/50 hover:text-white text-sm font-normal transition-colors">Partner</a>
          <a href="#precios"  className="text-white/50 hover:text-white text-sm font-normal transition-colors">Precios</a>
          <Link href="/blog"  className="text-white/50 hover:text-white text-sm font-normal transition-colors">Blog</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/50 hover:text-white text-sm font-normal transition-colors hidden md:block">
            Iniciar sesión
          </Link>
          <Link href="/demo" className="bg-[#00C2FF] text-[#0D1729] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors hidden sm:flex">
            Solicitar demo
          </Link>
          <MobileNav />
        </div>
      </div>
    </nav>
  )
}

// ── Mock UI Card ──────────────────────────────────────────────────────────────
function MockTaskBoard() {
  const cols = [
    { label: 'Pendiente', color: 'bg-slate-400', tasks: ['Trazo de ejes', 'Excavación Z-3'], count: 2 },
    { label: 'En proceso', color: 'bg-[#00C2FF]', tasks: ['Colado losa N2', 'Armado muros'], count: 2 },
    { label: 'Revisión',   color: 'bg-amber-400', tasks: ['Planos arq. Rev.B'], count: 1 },
    { label: 'Listo',      color: 'bg-emerald-400', tasks: ['Topografía gral.', 'Permisos municipales'], count: 2 },
  ]
  return (
    <div className="grid grid-cols-4 gap-2 p-3">
      {cols.map(col => (
        <div key={col.label} className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <div className={`w-2 h-2 rounded-full ${col.color}`} />
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">{col.label}</span>
            <span className="ml-auto text-[10px] text-white/30">{col.count}</span>
          </div>
          {col.tasks.map(t => (
            <div key={t} className="bg-white/5 rounded-lg p-2">
              <p className="text-[10px] text-white/80 font-normal leading-tight">{t}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function MockDashboard() {
  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Avance gral.', val: '68%', color: 'text-[#00C2FF]' },
          { label: 'Tareas activas', val: '24', color: 'text-emerald-400' },
          { label: 'Docs pendientes', val: '7', color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-lg p-2 text-center">
            <p className={`text-base font-bold ${k.color}`}>{k.val}</p>
            <p className="text-[9px] text-white/40 mt-0.5 font-normal">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/5 rounded-lg p-2">
        <p className="text-[10px] text-white/40 mb-1.5 font-normal">Avance por especialidad</p>
        {['Estructuras', 'Arquitectura', 'Hidráulica', 'Eléctrico'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-white/50 w-16 truncate font-normal">{s}</span>
            <div className="flex-1 bg-white/10 rounded-full h-1">
              <div className="h-1 rounded-full bg-[#00C2FF]" style={{ width: `${[68, 45, 82, 30][i]}%` }} />
            </div>
            <span className="text-[9px] text-white/40">{[68, 45, 82, 30][i]}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="min-h-[100svh] bg-[#0D1729] flex flex-col items-center justify-center pt-16 px-4 md:px-6 relative overflow-hidden">
      {/* Hero background image */}
      <img
        src="/hero-bg.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover opacity-[0.18] pointer-events-none select-none"
        style={{ objectPosition: 'center 30%' }}
      />
      {/* Dark gradient overlay over image */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1729]/60 via-[#0D1729]/40 to-[#0D1729] pointer-events-none" />
      {/* Blueprint grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,194,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,194,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />
      {/* Radial glow */}
      <div className="glow-pulse absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#00C2FF]/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Animated construction blueprint elements */}
      <ConstructionBg />

      <div className="relative max-w-7xl w-full mx-auto text-center">
        {/* Badge */}
        <div className="hero-enter inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-full px-3 py-1.5 mb-6" style={{ animationDelay: '0ms' }}>
          <Zap className="w-3 h-3 text-[#00C2FF] flex-shrink-0" />
          <span className="text-[#00C2FF] text-xs font-medium tracking-wide"><span className="hidden sm:inline">Para constructoras, ingenieros y arquitectos en </span><span className="sm:hidden">Software AEC · </span>México y LATAM</span>
        </div>

        {/* Headline */}
        <h1 className="hero-enter text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-3 max-w-3xl mx-auto" style={{ animationDelay: '150ms' }}>
          <span className="font-light">El software de construcción que</span><br />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">
            entiende tus planos,
          </span>{' '}
          <span className="font-bold text-white">habla por WhatsApp</span>{' '}
          <span className="font-bold text-white">y crece contigo.</span>
        </h1>

        <p className="hero-enter text-white/25 text-xs tracking-widest uppercase font-light mb-8" style={{ animationDelay: '300ms' }}>
          El sistema operativo de la construcción
        </p>

        <div className="hero-enter flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 md:mb-16" style={{ animationDelay: '430ms' }}>
          <Link href="/demo"
            className="flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-white transition-colors shadow-lg shadow-[#00C2FF]/20">
            Solicitar demo gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#modulos"
            className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-white hover:border-white/30 px-7 py-3.5 rounded-xl font-normal text-base transition-colors">
            Ver módulos
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mock app window — hidden on mobile */}
        <div className="hero-enter hidden md:block max-w-4xl mx-auto bg-[#1A2744]/80 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden" style={{ animationDelay: '580ms' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/3">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white/5 rounded-md px-4 py-0.5 text-[11px] text-white/30 font-mono">builtek.app/dashboard</div>
            </div>
          </div>

          <div className="flex">
            <div className="w-12 bg-[#0D1729]/60 border-r border-white/5 py-4 flex flex-col items-center gap-3">
              {[LayoutDashboard, CheckSquare, FileText, HardDrive, Bot, Calendar].map((Icon, i) => (
                <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-[#00C2FF]/20 text-[#00C2FF]' : 'text-white/20'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              ))}
            </div>

            <div className="flex-1 bg-[#111d35]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <p className="text-[11px] font-medium text-white/60">Dashboard — Constructora Arco Norte</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#00C2FF]/20 flex items-center justify-center">
                    <span className="text-[8px] text-[#00C2FF] font-semibold">LC</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-0 divide-x divide-white/5">
                <MockDashboard />
                <MockTaskBoard />
              </div>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-8 text-sm text-white/25 font-light">
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#00C2FF]/40" /> Datos seguros en tu propio workspace</span>
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#00C2FF]/40" /> Multi-usuario con roles y permisos</span>
          <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#00C2FF]/40" /> Disponible en todo LATAM</span>
        </div>
      </div>
    </section>
  )
}

// ── Problem ───────────────────────────────────────────────────────────────────
function Problem() {
  const pains = [
    {
      emoji: '📱',
      title: 'Tus planos viven en WhatsApp',
      desc: 'Versiones mezcladas, sin control de revisiones, sin saber quién tiene el plano vigente.',
    },
    {
      emoji: '📊',
      title: 'Tus tareas están en Excel',
      desc: 'Sin responsables claros, sin estados actualizados, sin visibilidad del avance real.',
    },
    {
      emoji: '📧',
      title: 'Tus aprobaciones son por email',
      desc: 'Sin trazabilidad, sin firma, sin historial. Imposible auditar qué aprobó quién.',
    },
  ]

  return (
    <section className="bg-[#0a1220] py-14 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-5">El problema</p>
          <h2 className="text-2xl md:text-4xl text-white leading-tight">
            <span className="font-light">En construcción, la información</span><br />
            <span className="font-semibold text-white/35">está fragmentada.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <AnimateIn key={p.title} delay={i * 100}>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 md:p-8 hover:border-[#00C2FF]/20 hover:scale-[1.02] transition-all duration-200 group">
              <span className="text-3xl md:text-4xl block mb-4 md:mb-5">{p.emoji}</span>
              <h3 className="text-lg font-semibold text-white mb-3">{p.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed font-light">{p.desc}</p>
            </div>
            </AnimateIn>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/50 text-lg font-light">
            Builtek cierra ese ciclo.{' '}
            <span className="text-white font-normal">Una sola plataforma para toda la obra.</span>
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Modules ───────────────────────────────────────────────────────────────────
function Modules() {
  const modules = [
    {
      icon: LayoutDashboard,
      color: 'text-[#00C2FF] bg-[#00C2FF]/10',
      title: 'Dashboard',
      desc: 'KPIs de tu proyecto en tiempo real. Avance por especialidad, tareas activas y documentos pendientes de aprobación.',
    },
    {
      icon: CheckSquare,
      color: 'text-emerald-400 bg-emerald-400/10',
      title: 'Gestión de Proyectos',
      desc: 'TaskBoard por especialidad (EST, ARQ, HID...). Asigna responsables, fechas límite y prioridades. Visualiza el avance real de la obra sin Excel.',
    },
    {
      icon: FileText,
      color: 'text-amber-400 bg-amber-400/10',
      title: 'Control Documental',
      desc: 'Planos, especificaciones y revisiones con control de versiones, flujo de aprobación Two-Person Rule y trazabilidad total: quién aprobó qué y cuándo.',
    },
    {
      icon: HardDrive,
      color: 'text-purple-400 bg-purple-400/10',
      title: 'Drive',
      desc: 'Un disco compartido para todo el equipo: sube, organiza y accede a los archivos del proyecto desde un solo lugar. Comparte con terceros vía link o QR — sin que necesiten cuenta.',
    },
    {
      icon: Calendar,
      color: 'text-rose-400 bg-rose-400/10',
      title: 'Calendario',
      desc: 'Vista semanal y mensual de tu programa de obra. Cruza tareas con fechas y detecta conflictos antes de que pasen.',
    },
    {
      icon: Users,
      color: 'text-indigo-400 bg-indigo-400/10',
      title: 'Equipo y Roles',
      desc: 'Invita a tu equipo por email. Roles granulares: Owner, Admin, Manager, Engineer, Viewer. Cada quien ve lo que necesita.',
    },
  ]

  return (
    <section id="modulos" className="bg-[#0D1729] py-14 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-5">La plataforma</p>
          <h2 className="text-2xl md:text-4xl text-white leading-tight">
            <span className="font-light">Todo lo que tu obra necesita.</span><br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">En un solo lugar.</span>
          </h2>
        </div>

        {/* Pain strip — gestión de proyectos */}
        <div className="flex overflow-x-auto gap-3 mb-10 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center scrollbar-hide">
          {[
            '¿Delegas tareas y no sabes cuándo terminan?',
            '¿No llevas un registro del avance real de tu equipo?',
            '¿Tus planos viven en correos y grupos de WhatsApp?',
          ].map(q => (
            <span key={q} className="bg-white/3 border border-white/8 rounded-full px-4 py-2 text-white/35 text-xs font-light italic whitespace-nowrap flex-shrink-0">{q}</span>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {modules.map((m, i) => (
            <AnimateIn key={m.title} delay={i * 75}>
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 md:p-7 hover:border-[#00C2FF]/25 hover:bg-white/5 hover:scale-[1.02] transition-all duration-200 group">
                <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-5 ${m.color}`}>
                  <m.icon className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-white mb-1 md:mb-2 leading-tight">{m.title}</h3>
                <p className="text-white/35 text-xs md:text-sm leading-relaxed font-light hidden sm:block">{m.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── AI Feature ────────────────────────────────────────────────────────────────
function AIFeature() {
  return (
    <section id="ia" className="bg-[#060e1c] py-14 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/5 via-transparent to-transparent pointer-events-none" />

      <AnimateIn>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-full px-4 py-1.5 mb-8">
            <Bot className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-medium">Agente AI — Diferenciador clave</span>
          </div>

          <h2 className="text-2xl md:text-4xl text-white leading-tight mb-5">
            <span className="font-light">Sube un plano.</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">
              La IA hace el resto.
            </span>
          </h2>

          <p className="text-white/40 text-lg leading-relaxed mb-8 font-light">
            Nuestro agente AI lee tus planos estructurales en PDF y extrae automáticamente cantidades de obra, elementos y especificaciones técnicas — en segundos, sin errores de captura.
          </p>

          <div className="space-y-4">
            {[
              'Extracción de cuantificación estructural automática',
              'Compatible con planos PDF de cualquier formato',
              'Resultados auditables y exportables',
              'Nadie más en LATAM tiene esto integrado en una PM tool',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00C2FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#00C2FF]" />
                </div>
                <p className="text-white/50 text-sm font-light">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Mock */}
        <div className="bg-[#1A2744]/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/3">
            <Bot className="w-4 h-4 text-[#00C2FF]" />
            <span className="text-white/50 text-xs font-medium">Agente AI — Extracción de plano</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="border-2 border-dashed border-[#00C2FF]/30 rounded-xl p-5 text-center bg-[#00C2FF]/5">
              <Upload className="w-7 h-7 text-[#00C2FF]/60 mx-auto mb-2" />
              <p className="text-xs text-white/50 font-medium">plano_estructuras_frente3_rev2.pdf</p>
              <p className="text-xs text-white/30 mt-1 font-light">4.2 MB · Procesando...</p>
            </div>

            <div className="bg-white/3 rounded-xl p-4 space-y-2">
              <p className="text-[10px] text-[#00C2FF] font-semibold uppercase tracking-wide mb-3">Extracción completada ✓</p>
              {[
                { label: 'Columnas de concreto', val: '48 pzas', type: 'EST' },
                { label: 'Trabes principales',   val: '96 ml',  type: 'EST' },
                { label: 'Losa reticular N+3.50', val: '1,240 m²', type: 'EST' },
                { label: 'Acero de refuerzo (est.)', val: '18.4 ton', type: 'EST' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-[11px] text-white/50 font-light">{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-[#00C2FF]/10 text-[#00C2FF] px-1.5 py-0.5 rounded font-semibold">{r.type}</span>
                    <span className="text-[11px] text-white font-semibold">{r.val}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-[#00C2FF]/10 text-[#00C2FF] text-xs font-semibold">Exportar Excel</button>
              <button className="flex-1 py-2 rounded-lg bg-white/5 text-white/40 text-xs font-normal">Ver plano</button>
            </div>
          </div>
        </div>
      </div>
      </AnimateIn>

      {/* Inline CTA */}
      <div className="max-w-7xl mx-auto mt-14 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#00C2FF]/5 border border-[#00C2FF]/15 rounded-2xl px-7 py-5">
          <p className="text-white/55 text-sm font-light text-center sm:text-left">
            ¿Quieres ver la extracción AI funcionando con un plano tuyo?
          </p>
          <Link href="/demo" className="flex-shrink-0 flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white transition-colors whitespace-nowrap">
            Ver demo en vivo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── RAG Feature ───────────────────────────────────────────────────────────────
function RAGFeature() {
  return (
    <section id="rag" className="bg-[#060e1c] px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#00C2FF]/4 border border-[#00C2FF]/12 rounded-2xl px-7 py-5">
          <div className="flex items-start gap-4">
            <Sparkles className="w-5 h-5 text-[#00C2FF] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/65 text-sm font-semibold mb-1">Agente RAG — En desarrollo</p>
              <p className="text-white/30 text-xs font-light leading-relaxed max-w-xl">
                Un consultor técnico que conoce todos tus documentos: planos, memorias, oficios, revisiones.
                Pregunta y te dice la respuesta con la fuente exacta. Acceso anticipado gratis para clientes Pro y Contractor al lanzarse.
              </p>
            </div>
          </div>
          <span className="flex-shrink-0 text-[10px] bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
            Próximamente
          </span>
        </div>
      </div>
    </section>
  )
}

// ── Drive Feature ─────────────────────────────────────────────────────────────
function DriveFeature() {
  return (
    <section id="drive" className="bg-[#0D1729] py-14 md:py-24 px-4 md:px-6">
      <AnimateIn>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Drive Mock */}
        <div className="bg-[#1A2744]/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/3">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span className="text-white/50 text-xs font-medium">Builtek Drive — Compartir archivo</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              {[
                { icon: '📄', name: 'Planos_Arq_Rev3.pdf', size: '8.4 MB', type: 'PDF' },
                { icon: '📐', name: 'Estructuras_Frente12.dwg', size: '22 MB', type: 'DWG' },
                { icon: '📊', name: 'Presupuesto_v4.xlsx', size: '1.1 MB', type: 'XLSX' },
              ].map(f => (
                <div key={f.name} className="flex items-center gap-3 bg-white/3 rounded-lg px-3 py-2.5">
                  <span className="text-base">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/65 font-normal truncate">{f.name}</p>
                    <p className="text-[10px] text-white/25 font-light">{f.type} · {f.size}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="px-2 py-1 rounded-md bg-purple-400/10 text-purple-400 text-[10px] font-semibold">Compartir</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/3 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <QrCode className="w-10 h-10 text-[#1A2744]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/55 font-medium mb-1">Link público generado</p>
                <p className="text-[10px] text-white/25 font-mono truncate">builtek.app/share/a8f2-...</p>
                <div className="flex gap-2 mt-2">
                  <div className="px-2 py-1 rounded-md bg-[#00C2FF]/10 text-[#00C2FF] text-[10px] font-semibold">Copiar link</div>
                  <div className="px-2 py-1 rounded-md bg-white/5 text-white/35 text-[10px] font-normal">Descargar QR</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 bg-purple-400/10 border border-purple-400/20 rounded-full px-4 py-1.5 mb-8">
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-purple-400 text-xs font-medium">Builtek Drive</span>
          </div>

          <h2 className="text-2xl md:text-4xl text-white leading-tight mb-5">
            <span className="font-light">Comparte planos</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#00C2FF]">
              sin dar acceso a todo.
            </span>
          </h2>

          <p className="text-white/40 text-lg leading-relaxed mb-8 font-light">
            Un espacio compartido donde todo el equipo sube, organiza y accede a los archivos del proyecto. Genera links públicos o QR para compartir con subcontratistas, supervisores o clientes — sin que necesiten cuenta en Builtek.
          </p>

          <div className="space-y-4">
            {[
              'Carpetas organizadas por frente o disciplina',
              'Links con fecha de expiración opcional',
              'Contador de accesos por link',
              'Revoca el acceso en cualquier momento',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                </div>
                <p className="text-white/50 text-sm font-light">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </AnimateIn>
    </section>
  )
}

// ── WhatsApp Feature ──────────────────────────────────────────────────────────
function WhatsAppFeature() {
  const messages = [
    {
      time: '09:14',
      msg: '📋 *Builtek* — Nueva tarea asignada\n*Colado losa N+3.50 — Frente 3*\nProyecto: Viaducto Norte · EST\nVence: 12 oct\n→ Ver tarea: builtek.app/t/...',
    },
    {
      time: '11:32',
      msg: '📄 *Builtek* — Plano actualizado\n*Planos_Estructuras_Rev4.pdf* fue subido\nProyecto: Viaducto Norte\nPor: L. Celestin\n→ Ver archivo: builtek.app/drive/...',
    },
    {
      time: '15:05',
      msg: '⏰ *Builtek* — Aprobación pendiente\n*ET-003 Especificaciones Hid.* lleva 48h esperando tu firma.\n→ Aprobar ahora: builtek.app/doc/...',
    },
  ]

  return (
    <section id="whatsapp" className="bg-[#0a1220] py-14 md:py-24 px-4 md:px-6">
      <AnimateIn>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 mb-8">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Notificaciones WhatsApp</span>
          </div>

          <h2 className="text-2xl md:text-4xl text-white leading-tight mb-5">
            <span className="font-light">Tu equipo ya está</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#00C2FF]">
              en WhatsApp.
            </span>
          </h2>

          <div className="bg-white/3 border border-white/8 rounded-xl p-5 mb-6 space-y-2">
            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-3">¿Te suena esto?</p>
            {[
              '¿Tu buzón está lleno de correos con "Rev del plano actualizada"?',
              '¿Tienes que recordarle a tu equipo las tareas que ya ordenaste?',
              '¿Nunca sabes si ya vieron el documento que subiste?',
            ].map(q => (
              <p key={q} className="text-white/40 text-sm italic font-light leading-relaxed">— {q}</p>
            ))}
          </div>

          <p className="text-white/40 text-base leading-relaxed mb-8 font-light">
            Builtek envía las notificaciones por WhatsApp automáticamente — donde ya trabaja tu equipo, en el momento exacto que necesitan saber.
          </p>

          <div className="space-y-4">
            {[
              'Alerta al responsable cuando le asignan una tarea',
              'Aviso al equipo cuando se sube un plano nuevo o una revisión',
              'Recordatorio cuando una tarea está próxima a vencer',
              'Notificación al aprobador cuando un documento espera su firma',
              'Ningún software de construcción en LATAM tiene esto integrado',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-white/50 text-sm font-light">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Mock */}
        <div className="bg-[#0b1a0b]/90 border border-emerald-400/15 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#111f11]">
            <div className="w-9 h-9 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold">Builtek Notificaciones</p>
              <p className="text-emerald-400/60 text-[10px]">En línea</p>
            </div>
          </div>
          <div className="p-4 space-y-3 min-h-[280px] bg-[url('data:image/svg+xml;base64,')]">
            {messages.map((m, i) => (
              <div key={i} className="flex justify-start">
                <div className="max-w-[88%] bg-[#1a3a1a] border border-emerald-400/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line font-light">{m.msg}</p>
                  <p className="text-[10px] text-white/20 mt-1.5 text-right">{m.time} ✓✓</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-2 bg-[#111f11] border-t border-white/5">
            <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
              <span className="text-xs text-white/15 font-light flex-1">Escribe un mensaje...</span>
              <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-emerald-400/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
      </AnimateIn>

      {/* Inline CTA */}
      <div className="max-w-7xl mx-auto mt-10 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-400/5 border border-emerald-400/15 rounded-2xl px-7 py-5">
          <p className="text-white/55 text-sm font-light text-center sm:text-left">
            ¿Quieres ver cómo llegan las notificaciones a tu equipo en campo?
          </p>
          <Link href="/demo" className="flex-shrink-0 flex items-center gap-2 bg-emerald-400 text-[#0a1220] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white transition-colors whitespace-nowrap">
            Solicitar demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-right mt-2 pr-1">
          <a href="https://www.menvio.app/whatsapp" target="_blank" rel="noopener noreferrer" className="text-white/15 hover:text-white/35 text-[10px] font-light transition-colors">
            Powered by Menvio
          </a>
        </p>
      </div>
    </section>
  )
}

// ── Partner Section ────────────────────────────────────────────────────────────
function PartnerSection() {
  return (
    <section id="partner" className="bg-[#0D1729] py-14 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/3 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Wrench className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/40 text-xs font-medium">Plan Partner</span>
          </div>
          <h2 className="text-2xl md:text-4xl text-white leading-tight mb-5">
            <span className="font-light">Builtek se adapta</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">
              a tu empresa.
            </span>
          </h2>
          <p className="text-white/40 text-lg leading-relaxed font-light">
            Otros softwares esperan que tú te adaptes a ellos. Con el Plan Partner, analizamos cómo trabaja tu empresa y programamos las funciones que necesitas — directamente en tu workspace, mes a mes con el fundador.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            {
              num: '01',
              title: 'Analizamos tus procesos',
              desc: '1 sesión mensual con el fundador para entender qué necesita tu empresa que el software estándar no tiene.',
            },
            {
              num: '02',
              title: 'Programamos a tu medida',
              desc: '4 horas de desarrollo dedicado al mes: automatización de RFI y submittals, administración de precios unitarios, reportes ejecutivos, integraciones — lo que tu empresa necesite.',
            },
            {
              num: '03',
              title: 'Es tuyo, siempre',
              desc: 'Todo lo desarrollado queda en tu cuenta. Si cambias de plan, lo conservas. Tus datos son tuyos y siempre exportables.',
            },
          ].map((s, i) => (
            <AnimateIn key={s.num} delay={i * 100}>
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5 md:p-7 hover:border-[#00C2FF]/20 hover:scale-[1.02] transition-all duration-200">
                <p className="text-[#00C2FF]/20 text-4xl md:text-5xl font-black mb-4 md:mb-5 tracking-tight leading-none">{s.num}</p>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed font-light">{s.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <div className="bg-gradient-to-r from-[#00C2FF]/6 to-transparent border border-[#00C2FF]/15 rounded-2xl px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-white font-semibold text-lg mb-1">Plan Partner — desde $8,000 MXN/mes</p>
            <p className="text-white/35 text-sm font-light">
              Sobre el plan base (Pro o Contractor) · Máximo 5 empresas simultáneas por la naturaleza del servicio.
            </p>
          </div>
          <a
            href="mailto:hola@menvio.app?subject=Plan Partner"
            className="flex-shrink-0 flex items-center gap-2 border border-[#00C2FF]/30 text-[#00C2FF] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#00C2FF]/10 transition-colors whitespace-nowrap"
          >
            Solicitar información
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Cost Callout ───────────────────────────────────────────────────────────────
function CostCallout() {
  return (
    <section className="bg-[#060e1c] py-12 md:py-20 px-4 md:px-6 border-y border-white/5">
      <div className="max-w-7xl mx-auto">

        {/* Pain hook */}
        <div className="bg-amber-400/4 border border-amber-400/12 rounded-2xl p-5 md:p-7 mb-10 md:mb-14">
          <p className="text-amber-400/60 text-[10px] font-semibold uppercase tracking-widest mb-5">¿Te ha pasado esto?</p>
          <div className="grid md:grid-cols-3 gap-5 mb-5">
            {[
              '¿Recibiste un plano y no sabes si es la versión más actualizada?',
              '¿No sabes quién lo emitió ni cuándo fue la última edición?',
              '¿Tienes que llamar para saber qué especificaciones tiene ese documento?',
            ].map(q => (
              <p key={q} className="text-white/45 text-sm italic leading-relaxed font-light border-l-2 border-amber-400/25 pl-4">{q}</p>
            ))}
          </div>
          <p className="text-white/30 text-sm font-light">
            Sin control documental con trazabilidad de versiones, cada error en campo empieza exactamente aquí.{' '}
            <span className="text-white/50 font-normal not-italic">Builtek es tu solución.</span>
          </p>
        </div>

        {/* Trazabilidad */}
        <div className="text-center mb-12">
          <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-4">Trazabilidad total</p>
          <h2 className="text-2xl md:text-4xl text-white font-light leading-tight mb-4">
            Sabe exactamente qué pasó, quién lo hizo<br className="hidden md:block" /> y cuándo — en cualquier momento.
          </h2>
          <p className="text-white/35 text-base font-light max-w-2xl mx-auto">
            Cada acción en Builtek queda registrada. En caso de disputa, auditoría o entrega de proyecto,
            tienes el historial completo con un clic.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {[
            {
              icon: '📄',
              title: 'Control de versiones',
              desc: 'Cada plano o documento guarda todas sus revisiones anteriores. Nunca pierdas una versión ni trabajes con el archivo equivocado.',
            },
            {
              icon: '✅',
              title: 'Aprobaciones firmadas',
              desc: 'Flujo Two-Person Rule: quién aprobó, quién rechazó, con fecha y hora exacta. Evidencia sólida en cualquier auditoría.',
            },
            {
              icon: '🔍',
              title: 'Log de accesos',
              desc: 'Registro de quién descargó o consultó cada archivo. Sabe si el subcontratista ya tiene la última revisión del plano.',
            },
          ].map((c, i) => (
            <AnimateIn key={c.title} delay={i * 100}>
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5 md:p-7 hover:border-[#00C2FF]/20 hover:scale-[1.02] transition-all duration-200">
                <span className="text-3xl mb-4 block">{c.icon}</span>
                <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed font-light">{c.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>


      </div>
    </section>
  )
}

// ── CTA / Contact ─────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section id="contacto" className="bg-[#060e1c] py-14 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#00C2FF]/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00C2FF]/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative">
        <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-5">¿Listo para digitalizar tu obra?</p>
        <h2 className="text-3xl md:text-5xl text-white leading-tight mb-5">
          <span className="font-light">Ve Builtek</span><br />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">funcionando en vivo.</span>
        </h2>
        <p className="text-white/40 text-lg mb-10 leading-relaxed font-light">
          Te mostramos la plataforma completa en 30 minutos.<br />
          Sin compromiso. Sin tarjeta de crédito.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link href="/demo" className="bg-white/3 border border-white/8 hover:border-[#00C2FF]/30 rounded-2xl p-6 text-left transition-all group">
            <div className="w-10 h-10 bg-[#00C2FF]/10 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <h3 className="text-white font-semibold mb-1">Constructora o despacho</h3>
            <p className="text-white/35 text-sm font-light">Residentes, ingenieros y directores. Un proyecto o varios. Queremos ver cómo trabajas hoy.</p>
            <p className="text-[#00C2FF] text-xs font-medium mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
              Agendar demo <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </Link>
          <Link href="/demo" className="bg-white/3 border border-white/8 hover:border-[#00C2FF]/30 rounded-2xl p-6 text-left transition-all group">
            <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">Proyecto de infraestructura</h3>
            <p className="text-white/35 text-sm font-light">Obra grande, múltiples frentes, equipo distribuido. Hablemos del Plan Partner y personalizamos Builtek para ti.</p>
            <p className="text-emerald-400 text-xs font-medium mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
              Hablar con el fundador <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </Link>
        </div>

        <Link href="/demo"
          className="inline-flex items-center gap-3 bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white transition-colors shadow-2xl shadow-[#00C2FF]/25">
          Solicitar demo gratis
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-white/25 text-sm mt-4 font-light">Respuesta en menos de 24 horas · hola@menvio.app</p>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0a1220] border-t border-white/5 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-[#0D1729]" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Builtek</span>
          <span className="text-white/20 text-sm ml-2 font-light">El OS de la construcción</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-white/25 font-light">
          <a href="#modulos"  className="hover:text-white/50 transition-colors">Módulos</a>
          <a href="#ia"       className="hover:text-white/50 transition-colors">Agente AI</a>
          <a href="#precios"  className="hover:text-white/50 transition-colors">Precios</a>
          <Link href="/demo"  className="hover:text-white/50 transition-colors">Demo</Link>
          <Link href="/login" className="hover:text-white/50 transition-colors">Iniciar sesión</Link>
        </div>

        <div className="text-right">
          <p className="text-white/20 text-sm font-light">© 2026 Builtek · builtek.app</p>
          <p className="text-white/12 text-xs font-light mt-0.5">Powered by Ingenium Analytics · Empresa 100% mexicana · CDMX</p>
        </div>
      </div>
    </footer>
  )
}

// ── Privacy Trust ─────────────────────────────────────────────────────────────
function PrivacyTrust() {
  const items = [
    {
      icon: Shield,
      title: 'Tus archivos son tuyos',
      desc: 'Builtek actúa como Procesador de Datos sobre tus proyectos y documentos — nunca como propietario. No leemos, analizamos ni reclamamos derechos sobre tu contenido.',
    },
    {
      icon: Bot,
      title: 'Sin entrenamiento AI con tus datos',
      desc: 'Los modelos de IA (Gemini, Claude) operan bajo condiciones API empresariales: no retienen ni usan el contenido de tus planos o documentos para entrenar modelos.',
    },
    {
      icon: Layers,
      title: 'Cifrado AES-256 + TLS 1.3',
      desc: 'Toda la información en reposo se cifra con AES-256. El tráfico en tránsito usa TLS 1.3. Tu infraestructura de documentos cumple los mismos estándares que Dropbox y Monday.com.',
    },
    {
      icon: BookOpen,
      title: 'LFPDPPP + GDPR Art. 13',
      desc: 'Aviso de Privacidad conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México) y al Reglamento General de Protección de Datos europeo.',
    },
    {
      icon: Wrench,
      title: 'Eliminación garantizada',
      desc: 'Al cancelar tu cuenta, tus datos pasan por una papelera de 30 días y se purgan completamente en un máximo de 90 días, incluyendo copias de respaldo y subprocesadores.',
    },
  ]

  return (
    <section className="bg-[#060e1c] py-12 md:py-16 px-4 md:px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-1">Privacidad y seguridad</p>
            <h2 className="text-lg md:text-2xl text-white font-light">
              Construido para industrias donde la <span className="font-semibold">confidencialidad no es opcional.</span>
            </h2>
          </div>
          <Link
            href="/privacy"
            className="flex-shrink-0 text-xs text-white/30 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20 rounded-lg px-4 py-2 whitespace-nowrap"
          >
            Aviso de Privacidad completo →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {items.map(item => (
            <div key={item.title} className="bg-white/2 border border-white/6 rounded-xl p-4 hover:border-white/12 transition-colors">
              <item.icon className="w-4 h-4 text-white/25 mb-3" />
              <p className="text-xs font-semibold text-white/50 mb-1.5">{item.title}</p>
              <p className="text-[11px] text-white/25 font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-white/15 mt-6 text-center font-light">
          Responsable: INGENIUM ANALYTICS, S. de R.L. de C.V. · RFC IAN210415CX5 · Querétaro, México · privacidad@builtek.app
        </p>
      </div>
    </section>
  )
}

// ── Tasks Feature ─────────────────────────────────────────────────────────────
function TasksFeature() {
  return (
    <section id="tareas" className="bg-[#0a1220] py-14 md:py-24 px-4 md:px-6">
      <AnimateIn>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 mb-8">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Gestión de Tareas</span>
          </div>

          <h2 className="text-2xl md:text-4xl text-white leading-tight mb-5">
            <span className="font-light">Cada tarea tiene</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#00C2FF]">
              responsable, fecha y plano.
            </span>
          </h2>

          <p className="text-white/40 text-lg leading-relaxed mb-8 font-light">
            TaskBoard organizado por especialidad: EST, ARQ, HID, SAN y más. Cada tarea lleva sus documentos vinculados — nada queda suelto en correos ni grupos de WhatsApp.
          </p>

          <div className="space-y-4">
            {[
              'TaskBoard por especialidad: filtra EST, ARQ, HID en un clic',
              'Dashboard de equipo: score por responsable, tareas vencidas y carga actual',
              'Vincula planos y documentos directamente a cada tarea',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-white/50 text-sm font-light">{f}</p>
              </div>
            ))}
            {/* WhatsApp item con ícono y teléfono */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-white/50 text-sm font-light flex items-center gap-2 flex-wrap">
                El responsable recibe notificación por WhatsApp al ser asignado
                <span className="inline-flex items-center gap-1.5 bg-[#25D366]/15 border border-[#25D366]/30 rounded-full px-2.5 py-0.5 text-[#25D366] text-xs font-semibold whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Mock TaskBoard */}
        <div className="bg-[#1A2744]/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/3">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span className="text-white/50 text-xs font-medium">TaskBoard — Frente 3 · Todas las especialidades</span>
          </div>
          <div className="p-4 space-y-3">
            {/* Specialty filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              {['Todas', 'EST', 'ARQ', 'HID', 'SAN'].map((s, i) => (
                <span key={s} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${i === 0 ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-white/30'}`}>{s}</span>
              ))}
            </div>

            {/* Kanban 2×2 */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Pendiente',  dot: 'bg-slate-500',   tasks: [{ name: 'Trazo ejes N+0.00', spec: 'TOP', who: 'CG' }, { name: 'Excavación Z-3', spec: 'CIV', who: 'LA' }] },
                { label: 'En proceso', dot: 'bg-[#00C2FF]',   tasks: [{ name: 'Colado losa N+3.50', spec: 'EST', who: 'SR' }, { name: 'Armado muros', spec: 'EST', who: 'MR' }] },
                { label: 'Revisión',   dot: 'bg-amber-400',   tasks: [{ name: 'Planos Arq. Rev.B', spec: 'ARQ', who: 'PM' }] },
                { label: 'Listo',      dot: 'bg-emerald-400', tasks: [{ name: 'Topografía gral.', spec: 'TOP', who: 'CG' }, { name: 'Permisos IMSS', spec: 'ADM', who: 'LA' }] },
              ].map(col => (
                <div key={col.label} className="bg-white/3 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                    <span className="text-[10px] text-white/40 font-semibold">{col.label}</span>
                    <span className="ml-auto text-[9px] text-white/20">{col.tasks.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {col.tasks.map(t => (
                      <div key={t.name} className="bg-white/4 rounded-lg px-2 py-1.5">
                        <p className="text-[10px] text-white/60 font-normal leading-tight mb-1">{t.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-[#00C2FF]/10 text-[#00C2FF] px-1.5 py-0.5 rounded font-semibold">{t.spec}</span>
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[9px] text-white/40 font-semibold">{t.who}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Team dashboard mini */}
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wide">Rendimiento del equipo</p>
                <span className="text-[9px] text-emerald-400/60 font-semibold">Score promedio: 74%</span>
              </div>
              {[
                { name: 'Carlos G.', role: 'Manager', score: 88, overdue: 0, color: 'bg-emerald-500' },
                { name: 'Luis A.',   role: 'Engineer', score: 61, overdue: 2, color: 'bg-amber-400' },
                { name: 'Sofía R.', role: 'Engineer', score: 74, overdue: 0, color: 'bg-emerald-500' },
                { name: 'Pedro M.', role: 'Viewer',   score: 30, overdue: 3, color: 'bg-red-500' },
              ].map(p => (
                <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-400/15 text-[9px] text-emerald-400 font-semibold flex-shrink-0">{p.name[0]}</span>
                  <span className="text-[11px] text-white/45 font-light w-16 truncate">{p.name}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.score}%` }} />
                  </div>
                  <span className="text-[10px] text-white/35 w-7 text-right font-semibold">{p.score}%</span>
                  {p.overdue > 0
                    ? <span className="text-[9px] text-red-400 font-bold w-12 text-right">{p.overdue} venc.</span>
                    : <span className="text-[9px] text-emerald-400/50 w-12 text-right">al día</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </AnimateIn>

      {/* Inline CTA */}
      <div className="max-w-7xl mx-auto mt-14 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-400/5 border border-emerald-400/15 rounded-2xl px-7 py-5">
          <p className="text-white/55 text-sm font-light text-center sm:text-left">
            ¿Quieres ver el TaskBoard con datos reales de tu proyecto?
          </p>
          <Link href="/demo" className="flex-shrink-0 flex items-center gap-2 bg-emerald-400 text-[#0a1220] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white transition-colors whitespace-nowrap">
            Ver demo en vivo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-[#0D1729]">
      <Navbar />
      <Hero />
      <Ticker />
      <Problem />
      <Modules />
      <TasksFeature />
      <AIFeature />
      <RAGFeature />
      <DriveFeature />
      <WhatsAppFeature />
      <PartnerSection />
      <CostCallout />
      <PricingSection />
      <PrivacyTrust />
      <CTA />
      <Footer />
    </main>
  )
}
