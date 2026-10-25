'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface WorkspacePlan {
  plan: string
  status: string
  trialEndsAt: Date | null
  daysLeft: number | null
  isTrialExpired: boolean
  isTrial: boolean
  intendedPlan: string | null
  workspaceName: string | null
}

const DEFAULT: WorkspacePlan = {
  plan: 'obra',
  status: 'active',
  trialEndsAt: null,
  daysLeft: null,
  isTrialExpired: false,
  isTrial: false,
  intendedPlan: null,
  workspaceName: null,
}

export function useWorkspacePlan(): WorkspacePlan & { loading: boolean } {
  const [data, setData] = useState<WorkspacePlan>(DEFAULT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: membership } = await supabase
          .from('workspace_members')
          .select('workspace_id, workspaces(id, name, plan, status, trial_ends_at, trial_plan, intended_plan)')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!membership) {
          setLoading(false)
          return
        }

        const ws = membership.workspaces as unknown as {
          id: string
          name: string
          plan: string
          status: string
          trial_ends_at: string | null
          trial_plan: string | null
          intended_plan: string | null
        }

        if (!ws) {
          setLoading(false)
          return
        }

        const trialEndsAt = ws.trial_ends_at ? new Date(ws.trial_ends_at) : null
        const now = new Date()
        const daysLeft = trialEndsAt
          ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null
        const isTrial = !!ws.trial_plan && ws.status === 'active' && !!trialEndsAt
        const isTrialExpired = ws.status === 'trial_expired'

        setData({
          plan: ws.plan || 'obra',
          status: ws.status || 'active',
          trialEndsAt,
          daysLeft,
          isTrialExpired,
          isTrial,
          intendedPlan: ws.intended_plan || null,
          workspaceName: ws.name || null,
        })
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { ...data, loading }
}
