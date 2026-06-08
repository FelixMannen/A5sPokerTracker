import { useState, useEffect, useCallback } from 'react'
import type { PlaySession, PlaySessionSummary, PendingTournament, NewPendingTournament } from '../types'

/**
 * Manages the live "sitting" workflow: one active session at a time, the in-progress
 * tournaments inside it, and the list of finished sessions.
 *
 * @param onCommitted called after a pending tournament is committed to the main dataset,
 *                    so the caller can refresh the graph/statistics.
 */
export function usePlaySession(onCommitted: () => void | Promise<void>) {
  const [active, setActive] = useState<PlaySession | null>(null)
  const [pending, setPending] = useState<PendingTournament[]>([])
  const [finished, setFinished] = useState<PlaySessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refreshActive = useCallback(async () => {
    const session = await window.api.getActivePlaySession()
    setActive(session)
    setPending(session ? await window.api.getPendingTournaments(session.id) : [])
  }, [])

  const refreshFinished = useCallback(async () => {
    setFinished(await window.api.getFinishedPlaySessions())
  }, [])

  useEffect(() => {
    ;(async () => {
      await Promise.all([refreshActive(), refreshFinished()])
      setLoading(false)
    })()
  }, [refreshActive, refreshFinished])

  const start = useCallback(async () => {
    const session = await window.api.startPlaySession()
    setActive(session)
    setPending([])
  }, [])

  const addTournament = useCallback(
    async (data: Omit<NewPendingTournament, 'play_session_id'>) => {
      if (!active) return
      await window.api.addPendingTournament({ ...data, play_session_id: active.id })
      await refreshActive()
    },
    [active, refreshActive]
  )

  const finishTournament = useCallback(
    async (id: number, cashout: number) => {
      await window.api.finishPendingTournament(id, cashout)
      await refreshActive()
      await onCommitted()
    },
    [refreshActive, onCommitted]
  )

  const cancelTournament = useCallback(
    async (id: number) => {
      await window.api.deletePendingTournament(id)
      await refreshActive()
    },
    [refreshActive]
  )

  const finishSession = useCallback(
    async (title: string | null, notes: string | null) => {
      if (!active) return
      await window.api.finishPlaySession(active.id, title, notes)
      setActive(null)
      setPending([])
      await refreshFinished()
    },
    [active, refreshFinished]
  )

  // Discard a mistakenly-started session; committed tournaments are kept (unlinked)
  const cancelSession = useCallback(async () => {
    if (!active) return
    await window.api.cancelPlaySession(active.id)
    setActive(null)
    setPending([])
    await onCommitted()
  }, [active, onCommitted])

  return {
    active,
    pending,
    finished,
    loading,
    start,
    addTournament,
    finishTournament,
    cancelTournament,
    finishSession,
    cancelSession
  }
}

export type PlaySessionController = ReturnType<typeof usePlaySession>
