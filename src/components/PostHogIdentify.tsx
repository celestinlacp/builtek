'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

type Props = {
  userId: string
  email: string
  fullName: string
  workspaceId: string
  workspaceName: string
  role: string
}

export function PostHogIdentify({ userId, email, fullName, workspaceId, workspaceName, role }: Props) {
  useEffect(() => {
    if (!userId) return
    posthog.identify(userId, {
      email,
      name: fullName,
      workspaceId,
      workspaceName,
      role,
    })
  }, [userId])

  return null
}
