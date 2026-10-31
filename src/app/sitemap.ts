import { MetadataRoute } from 'next'
import { POSTS } from './(marketing)/blog/posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://builtek.app'
  const now = new Date()

  const blogEntries = POSTS.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/sobre-builtek`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...blogEntries,
    { url: `${base}/vs/procore`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/vs/autodesk-build`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/vs/fieldwire`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/vs/constructora360`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
