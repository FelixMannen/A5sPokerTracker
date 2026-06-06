import { useState, useEffect, useCallback } from 'react'
import type { Session, NewSession } from '../types'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const data = await window.api.getAllSessions()
    setSessions(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const addSession = useCallback(
    async (data: NewSession) => {
      await window.api.createSession(data)
      await fetch()
    },
    [fetch]
  )

  const removeSession = useCallback(
    async (id: number) => {
      await window.api.deleteSession(id)
      await fetch()
    },
    [fetch]
  )

  return { sessions, loading, addSession, removeSession }
}
