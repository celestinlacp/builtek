'use client'

import TrialBanner from './TrialBanner'
import ImpersonationBanner from './ImpersonationBanner'
import { useWorkspacePlan } from '@/hooks/useWorkspacePlan'

interface Props {
  isImpersonating?: boolean
  impersonatedWorkspaceName?: string
}

// FORGE-NOTE: isImpersonating is passed as a prop from the Server Component layout
// because __builtek_impersonation is HttpOnly and cannot be read from client-side JS.
export default function DashboardBanners({ isImpersonating, impersonatedWorkspaceName }: Props) {
  const { isTrialExpired, daysLeft, loading } = useWorkspacePlan()

  if (loading) return null

  return (
    <>
      {isImpersonating && impersonatedWorkspaceName && (
        <ImpersonationBanner workspaceName={impersonatedWorkspaceName} />
      )}
      {isTrialExpired && (
        <TrialBanner daysLeft={daysLeft} />
      )}
    </>
  )
}
