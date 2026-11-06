import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Photo, PhotoTag, Project } from '@/types'
import BitacoraClient from './BitacoraClient'

interface Props {
  searchParams: Promise<{ project?: string }>
}

export default async function BitacoraPage({ searchParams }: Props) {
  const { project: projectFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const wsId = (membership.workspaces as unknown as { id: string }).id

  // Query photos with tags
  let photosQuery = supabase
    .from('photos')
    .select(`*, tags:photo_tag_assignments(tag:photo_tags(*))`)
    .eq('workspace_id', wsId)
    .order('captured_at', { ascending: false })
    .limit(200)

  if (projectFilter) {
    photosQuery = photosQuery.eq('project_id', projectFilter)
  }

  const { data: rawPhotos } = await photosQuery

  // Normalize tags: photo_tag_assignments join gives {tag: PhotoTag} — flatten to PhotoTag[]
  const photos: Photo[] = (rawPhotos ?? []).map((p: any) => ({
    ...p,
    tags: p.tags?.map((t: any) => t.tag).filter(Boolean) ?? [],
  }))

  // Load workspace tags for tag selector
  const { data: workspaceTags } = await supabase
    .from('photo_tags')
    .select('*')
    .eq('workspace_id', wsId)
    .order('name')

  // Load projects for filter dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('workspace_id', wsId)
    .eq('status', 'active')
    .order('name')

  // Hero image: most recent favorite, or most recent photo
  const heroPhoto = photos.find(p => p.is_favorite) ?? photos[0] ?? null

  return (
    <BitacoraClient
      photos={photos}
      heroPhoto={heroPhoto}
      workspaceId={wsId}
      workspaceTags={(workspaceTags ?? []) as PhotoTag[]}
      workspaceProjects={(projects ?? []) as Project[]}
      activeProjectFilter={projectFilter ?? null}
    />
  )
}
