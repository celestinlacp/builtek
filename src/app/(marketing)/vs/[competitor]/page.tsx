import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { COMPETITORS, getCompetitor } from '../data'

export async function generateStaticParams() {
  return COMPETITORS.map(c => ({ competitor: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>
}): Promise<Metadata> {
  const { competitor: slug } = await params
  const c = getCompetitor(slug)
  if (!c) return {}
  return {
    title: `Builtek vs ${c.name}`,
    description: `${c.tagline} Compara Builtek vs ${c.name}: precios, funciones y por qué Builtek es la mejor opción para constructoras en México.`,
    openGraph: {
      title: `Builtek vs ${c.name}`,
      description: `${c.tagline} Compara Builtek vs ${c.name}.`,
      locale: 'es_MX',
    },
  }
}

export default async function CompetitorPage({
  params,
}: {
  params: Promise<{ competitor: string }>
}) {
  const { competitor: slug } = await params
  const c = getCompetitor(slug)
  if (!c) notFound()

  return (
    <main className="min-h-screen bg-[#0D1729] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="text-[#00C2FF] text-sm font-medium uppercase tracking-widest mb-4">
            Builtek vs {c.name}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{c.tagline}</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {c.name}: {c.pricingNote} Diseñado para: {c.targetMarket}
          </p>
        </div>

        {/* Tabla comparativa */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Comparación directa</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-gray-400 font-medium">Característica</th>
                  <th className="text-left p-4 text-[#00C2FF] font-semibold">Builtek</th>
                  <th className="text-left p-4 text-gray-400 font-medium">{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {c.table.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 text-gray-300">{row.feature}</td>
                    <td className="p-4 text-white">{row.builtek}</td>
                    <td className="p-4 text-gray-500">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Por qué Builtek */}
        <div className="mb-16 bg-white/5 rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-semibold mb-4">Por qué elegir Builtek</h2>
          <p className="text-gray-300 text-lg leading-relaxed">{c.builtekPitch}</p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">14 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.</p>
          <Link
            href={`/register?ref=vs-${c.slug}`}
            className="inline-block bg-[#00C2FF] text-[#0D1729] font-semibold px-8 py-4 rounded-xl text-lg hover:bg-[#1FB0EC] transition-colors"
          >
            Prueba Builtek gratis 14 días
          </Link>
        </div>
      </div>
    </main>
  )
}
