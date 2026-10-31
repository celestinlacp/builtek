import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { POSTS } from '../posts'

export async function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = POSTS.find(p => p.slug === slug)
  if (!post) return {}
  return {
    title: post.metadata.title,
    description: post.metadata.description,
    keywords: post.metadata.keywords,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.description,
      locale: 'es_MX',
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = POSTS.find(p => p.slug === slug)
  if (!post) notFound()

  const faqSchema = post.faqs
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div dangerouslySetInnerHTML={{ __html: post.htmlContent }} />
    </>
  )
}
