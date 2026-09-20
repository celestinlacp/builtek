import Link from 'next/link'
import {
  LayoutDashboard, CheckSquare, FileText, HardDrive,
  Bot, Calendar, ArrowRight, ChevronRight, Zap,
  Shield, Users, TrendingUp, QrCode, Upload,
  Layers, Menu
} from 'lucide-react'
import PricingSection from '@/components/PricingSection'

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
          <a href="#drive"    className="text-white/50 hover:text-white text-sm font-normal transition-colors">Drive</a>
          <a href="#precios"  className="text-white/50 hover:text-white text-sm font-normal transition-colors">Precios</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/50 hover:text-white text-sm font-normal transition-colors hidden sm:block">
            Iniciar sesión
          </Link>
          <a href="#contacto" className="bg-[#00C2FF] text-[#0D1729] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00C2FF]/90 transition-colors">
            Solicitar demo
          </a>
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
    <section className="min-h-screen bg-[#0D1729] flex flex-col items-center justify-center pt-16 px-6 relative overflow-hidden">
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#00C2FF]/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Animated construction blueprint elements */}
      <ConstructionBg />

      <div className="relative max-w-7xl w-full mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-full px-4 py-1.5 mb-8">
          <Zap className="w-3.5 h-3.5 text-[#00C2FF]" />
          <span className="text-[#00C2FF] text-xs font-medium tracking-wide">Diseñado para equipos AEC en LATAM</span>
        </div>

        {/* Headline — weight contrast: light + bold */}
        <h1 className="text-5xl md:text-7xl text-white leading-[1.08] tracking-tight mb-6">
          <span className="font-extralight">El sistema operativo</span><br />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">
            de la construcción
          </span>
        </h1>

        <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          Tareas, documentos, planos y IA en una sola plataforma.<br className="hidden md:block" />
          Tu obra digitalizada, tu equipo alineado.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a href="#precios"
            className="flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-white transition-colors shadow-lg shadow-[#00C2FF]/20">
            Solicitar demo gratis
            <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#modulos"
            className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-white hover:border-white/30 px-7 py-3.5 rounded-xl font-normal text-base transition-colors">
            Ver módulos
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mock app window */}
        <div className="max-w-4xl mx-auto bg-[#1A2744]/80 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
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
                <p className="text-[11px] font-medium text-white/60">Dashboard — Frente 12 Ferroviario</p>
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
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-white/25 font-light">
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
    <section className="bg-[#0a1220] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-5">El problema</p>
          <h2 className="text-3xl md:text-5xl text-white leading-tight">
            <span className="font-light">En construcción, la información</span><br />
            <span className="font-semibold text-white/35">está fragmentada.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pains.map(p => (
            <div key={p.title} className="bg-white/3 border border-white/8 rounded-2xl p-8 hover:border-[#00C2FF]/20 transition-colors group">
              <span className="text-4xl block mb-5">{p.emoji}</span>
              <h3 className="text-lg font-semibold text-white mb-3">{p.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed font-light">{p.desc}</p>
            </div>
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
      title: 'Gestión de Tareas',
      desc: 'TaskBoard por especialidad (EST, ARQ, HID...). Asigna responsables, prioridades y fechas límite. Sin Excel.',
    },
    {
      icon: FileText,
      color: 'text-amber-400 bg-amber-400/10',
      title: 'Control Documental',
      desc: 'Sube planos, oficios y especificaciones. Control de versiones, estados (borrador → aprobado) y flujo de aprobación con Two-Person Rule.',
    },
    {
      icon: HardDrive,
      color: 'text-purple-400 bg-purple-400/10',
      title: 'Drive',
      desc: 'Almacenamiento centralizado con carpetas. Comparte archivos con terceros mediante link público o código QR — sin que necesiten cuenta.',
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
    <section id="modulos" className="bg-[#0D1729] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-5">La plataforma</p>
          <h2 className="text-3xl md:text-5xl text-white leading-tight">
            <span className="font-light">Todo lo que tu obra necesita.</span><br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">En un solo lugar.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(m => (
            <div key={m.title} className="bg-white/3 border border-white/8 rounded-2xl p-7 hover:border-[#00C2FF]/25 hover:bg-white/5 transition-all group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${m.color}`}>
                <m.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{m.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed font-light">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── AI Feature ────────────────────────────────────────────────────────────────
function AIFeature() {
  return (
    <section id="ia" className="bg-[#060e1c] py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-full px-4 py-1.5 mb-8">
            <Bot className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-medium">Agente AI — Diferenciador clave</span>
          </div>

          <h2 className="text-3xl md:text-5xl text-white leading-tight mb-6">
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
    </section>
  )
}

// ── Drive Feature ─────────────────────────────────────────────────────────────
function DriveFeature() {
  return (
    <section id="drive" className="bg-[#0D1729] py-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
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

          <h2 className="text-3xl md:text-5xl text-white leading-tight mb-6">
            <span className="font-light">Comparte planos</span><br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#00C2FF]">
              sin dar acceso a todo.
            </span>
          </h2>

          <p className="text-white/40 text-lg leading-relaxed mb-8 font-light">
            Genera un link público o un código QR para compartir cualquier archivo con subcontratistas, supervisores o clientes — sin que necesiten una cuenta en Builtek.
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
    </section>
  )
}

// ── CTA / Contact ─────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section id="contacto" className="bg-[#060e1c] py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#00C2FF]/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00C2FF]/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative">
        <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-5">¿Listo para digitalizar tu obra?</p>
        <h2 className="text-4xl md:text-6xl text-white leading-tight mb-6">
          <span className="font-light">Conoce nuestros</span><br />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#0077FF]">Builtek en acción</span>
        </h2>
        <p className="text-white/40 text-lg mb-10 leading-relaxed font-light">
          Desde equipos pequeños hasta grandes proyectos de infraestructura.<br />
          Agenda una demo y te mostramos Builtek funcionando con tus propios datos.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white/3 border border-white/8 hover:border-[#00C2FF]/30 rounded-2xl p-6 text-left transition-all group cursor-pointer">
            <div className="w-10 h-10 bg-[#00C2FF]/10 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <h3 className="text-white font-semibold mb-1">Para equipos</h3>
            <p className="text-white/35 text-sm font-light">Hasta 20 usuarios, proyectos ilimitados, todas las funciones.</p>
            <p className="text-[#00C2FF] text-xs font-medium mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
              Ver paquetes <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
          <div className="bg-white/3 border border-white/8 hover:border-[#00C2FF]/30 rounded-2xl p-6 text-left transition-all group cursor-pointer">
            <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">Para empresas</h3>
            <p className="text-white/35 text-sm font-light">Multi-proyecto, multi-frente. Con onboarding dedicado y soporte prioritario.</p>
            <p className="text-emerald-400 text-xs font-medium mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
              Solicitar cotización <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>

        <a href="mailto:hola@builtek.app"
          className="inline-flex items-center gap-3 bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white transition-colors shadow-2xl shadow-[#00C2FF]/25">
          Solicitar demo gratis
          <ArrowRight className="w-5 h-5" />
        </a>
        <p className="text-white/25 text-sm mt-4 font-light">Respuesta en menos de 24 horas · hola@builtek.app</p>
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

        <div className="flex items-center gap-6 text-sm text-white/25 font-light">
          <a href="#modulos"  className="hover:text-white/50 transition-colors">Módulos</a>
          <a href="#ia"       className="hover:text-white/50 transition-colors">Agente AI</a>
          <a href="#precios" className="hover:text-white/50 transition-colors">Precios</a>
          <Link href="/login" className="hover:text-white/50 transition-colors">Iniciar sesión</Link>
        </div>

        <p className="text-white/20 text-sm font-light">© 2026 Builtek · builtek.app</p>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-[#0D1729]">
      <Navbar />
      <Hero />
      <Problem />
      <Modules />
      <AIFeature />
      <DriveFeature />
      <PricingSection />
      <CTA />
      <Footer />
    </main>
  )
}
