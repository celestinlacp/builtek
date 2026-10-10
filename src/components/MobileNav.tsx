'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Layers, Sparkles, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { href: '#modulos',  label: 'Módulos',   isAnchor: true },
  { href: '#ia',       label: 'Agente AI', isAnchor: true },
  { href: '#rag',      label: 'RAG',       isAnchor: true, badge: 'Nuevo' },
  { href: '#drive',    label: 'Drive',     isAnchor: true },
  { href: '#whatsapp', label: 'WhatsApp',  isAnchor: true },
  { href: '#partner',  label: 'Partner',   isAnchor: true },
  { href: '#precios',  label: 'Precios',   isAnchor: true },
  { href: '/blog',     label: 'Blog',      isAnchor: false },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-white/70" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-[#0a1525] border-l border-white/8 md:hidden flex flex-col
          transform transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-[#0D1729]" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">Builtek</span>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 active:bg-white/15 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">Navegar</p>
          <div className="space-y-0.5">
            {NAV_LINKS.map(link =>
              link.isAnchor ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/5 active:bg-white/8 transition-colors text-sm font-normal"
                >
                  {link.badge && (
                    <span className="inline-flex items-center gap-1 text-[#00C2FF]/80">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  )}
                  {link.label}
                  {link.badge && (
                    <span className="ml-auto text-[10px] bg-[#00C2FF]/15 text-[#00C2FF] px-2 py-0.5 rounded-full font-semibold">
                      {link.badge}
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/5 active:bg-white/8 transition-colors text-sm font-normal"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </nav>

        {/* Footer CTAs */}
        <div className="flex-shrink-0 px-4 pb-8 pt-4 border-t border-white/8 space-y-2.5">
          <Link
            href="/login"
            onClick={close}
            className="flex items-center justify-center w-full py-3 rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 text-sm font-normal transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/demo"
            onClick={close}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#00C2FF] text-[#0D1729] text-sm font-bold hover:bg-white transition-colors"
          >
            Solicitar demo gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  )
}
