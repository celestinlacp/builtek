import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Gestión de obras y control documental | Builtek',
  description: 'Artículos sobre gestión de proyectos de construcción, control documental y tecnología para la industria AEC en México.',
}

const POSTS = [
  {
    slug: '/blog/alternativa-procore-mexico',
    category: 'Comparativa',
    title: 'Por qué Procore es demasiado caro para constructoras mexicanas (y qué usar en su lugar)',
    excerpt: 'Procore cobra hasta $80,000 USD/año. Una comparativa honesta de costos, funciones y contexto mexicano.',
    readTime: '7 min',
    date: 'Oct 2026',
  },
  {
    slug: '/blog/agente-rag',
    category: 'Educación',
    title: 'Tu proyecto tiene 300 planos. ChatGPT no puede leerlos todos.',
    excerpt: 'Por qué el constructor del futuro no busca en PDFs — le pregunta al proyecto. Una comparación honesta entre subir archivos a ChatGPT y usar un Agente RAG.',
    readTime: '8 min',
    date: 'Oct 2026',
  },
]

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* Nav */}
      <div className="bg-[#0D1729] text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0D1729] text-xs font-bold">B</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Builtek</span>
          </Link>
          <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">
            ← Inicio
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-12 pt-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Blog</h1>
          <p className="text-white/50 font-light">Gestión de obras, control documental y tecnología para la industria AEC en México.</p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid gap-6">
          {POSTS.map(post => (
            <Link
              key={post.slug}
              href={post.slug}
              className="group block bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#00C2FF]/50 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide bg-[#00C2FF]/10 px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-slate-400 text-xs">{post.date} · {post.readTime} de lectura</span>
              </div>
              <h2 className="text-xl font-bold text-[#1A2744] mb-2 group-hover:text-[#00C2FF] transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">{post.excerpt}</p>
              <span className="inline-block mt-4 text-[#00C2FF] text-sm font-semibold group-hover:underline">
                Leer artículo →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
          <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-600 transition-colors">Inicio</Link>
            <Link href="/#precios" className="hover:text-slate-600 transition-colors">Precios</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
