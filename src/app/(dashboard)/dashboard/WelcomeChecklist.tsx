'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WelcomeChecklistProps {
  workspaceId: string
  hasProject: boolean
  hasDocument: boolean
  hasTeamMember: boolean
  hasAssignedTask: boolean
}

interface ChecklistRow {
  ai_agent_tried: boolean
  completed_at: string | null
}

export default function WelcomeChecklist({
  workspaceId,
  hasProject,
  hasDocument,
  hasTeamMember,
  hasAssignedTask,
}: WelcomeChecklistProps) {
  const router = useRouter()
  const supabase = createClient()

  const [aiAgentTried, setAiAgentTried] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [visible, setVisible] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)

  useEffect(() => {
    async function fetchChecklist() {
      const { data } = await supabase
        .from('onboarding_checklist')
        .select('ai_agent_tried, completed_at')
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      if (data) {
        setAiAgentTried((data as ChecklistRow).ai_agent_tried ?? false)
        setCompletedAt((data as ChecklistRow).completed_at ?? null)
      }
      setLoaded(true)
    }
    fetchChecklist()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const items = [
    { id: 'workspace', label: 'Crea tu workspace', done: true },
    { id: 'project', label: 'Crea tu primer proyecto', done: hasProject },
    { id: 'document', label: 'Sube tu primer documento', done: hasDocument },
    { id: 'team', label: 'Invita a un compañero', done: hasTeamMember },
    { id: 'task', label: 'Asigna tu primera tarea', done: hasAssignedTask },
    { id: 'ai', label: 'Prueba el Agente AI', done: aiAgentTried },
  ]

  const completedCount = items.filter(i => i.done).length
  const totalCount = items.length
  const allDone = completedCount === totalCount
  const progressPct = Math.round((completedCount / totalCount) * 100)

  // When all items become done, persist completed_at and trigger collapse
  useEffect(() => {
    if (!loaded) return
    if (!allDone) return
    if (completedAt) return // already completed

    async function markComplete() {
      const now = new Date().toISOString()
      await supabase
        .from('onboarding_checklist')
        .upsert(
          { workspace_id: workspaceId, ai_agent_tried: aiAgentTried, completed_at: now },
          { onConflict: 'workspace_id' }
        )
      setCompletedAt(now)
      setShowCongrats(true)
      setTimeout(() => {
        setVisible(false)
      }, 2000)
    }
    markComplete()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, loaded])

  async function handleAiAgentClick() {
    if (!aiAgentTried) {
      setAiAgentTried(true)
      await supabase
        .from('onboarding_checklist')
        .upsert(
          { workspace_id: workspaceId, ai_agent_tried: true },
          { onConflict: 'workspace_id' }
        )
    }
    router.push('/ai-agent')
  }

  // Don't render if already completed in a previous session, or not loaded, or hidden after congrats
  if (!loaded) return null
  if (completedAt && !showCongrats) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-checklist"
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="bg-[#0D1729] border border-white/10 rounded-2xl p-6 mb-2">
            {showCongrats ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-white font-bold text-lg">¡Primeros pasos completados!</p>
                <p className="text-white/50 text-sm mt-1">Ya tienes Builtek configurado</p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-sm">Primeros pasos</h2>
                  <span className="text-white/40 text-xs">{completedCount}/{totalCount}</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-5">
                  <motion.div
                    className="h-full bg-[#00C2FF] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 ${
                        item.id === 'ai' ? 'cursor-pointer group' : ''
                      }`}
                      onClick={item.id === 'ai' ? handleAiAgentClick : undefined}
                    >
                      <motion.div
                        initial={false}
                        animate={item.done ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
                      >
                        <AnimatePresence mode="wait">
                          {item.done ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                              <CheckCircle className="w-4 h-4 text-[#00C2FF] flex-shrink-0" />
                            </motion.div>
                          ) : (
                            <motion.div key="circle" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                              <Circle className="w-4 h-4 text-white/25 flex-shrink-0" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <span className={`text-sm transition-colors ${
                        item.done ? 'text-white/50 line-through' : 'text-white/80'
                      } ${item.id === 'ai' && !item.done ? 'group-hover:text-[#00C2FF]' : ''}`}>
                        {item.label}
                      </span>

                      {item.id === 'ai' && !item.done && (
                        <span className="ml-auto text-[10px] text-[#00C2FF] font-semibold opacity-70 group-hover:opacity-100 transition-opacity">
                          Ir →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
