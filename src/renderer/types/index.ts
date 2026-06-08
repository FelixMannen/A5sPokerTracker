export type RegistrationTime = 'Early' | 'Medium' | 'Late'

export interface Session {
  id: number
  tournament_name: string | null
  date: string
  buy_in: number
  cashout: number
  type: string | null
  registration_time: RegistrationTime | null
  // Set when this tournament was committed from a live session; null for standalone logs
  play_session_id?: number | null
}

export type NewSession = Omit<Session, 'id' | 'play_session_id'>

// ----- Live play sessions: a "sitting" that groups several tournaments -----

export type PlaySessionStatus = 'active' | 'finished'

export interface PlaySession {
  id: number
  title: string | null
  notes: string | null
  started_at: string
  ended_at: string | null
  status: PlaySessionStatus
}

// A finished session with aggregates of its committed tournaments
export interface PlaySessionSummary extends PlaySession {
  tournament_count: number
  net_profit: number
  total_buy_in: number
}

// A tournament currently being played — pending a cashout, not yet in the dataset
export interface PendingTournament {
  id: number
  play_session_id: number
  tournament_name: string | null
  date: string
  buy_in: number
  type: string | null
  registration_time: RegistrationTime | null
  created_at: string
}

export type NewPendingTournament = Omit<PendingTournament, 'id' | 'created_at'>

export interface SessionAPI {
  createSession: (data: NewSession) => Promise<Session>
  getAllSessions: () => Promise<Session[]>
  updateSession: (id: number, data: Partial<NewSession>) => Promise<Session>
  deleteSession: (id: number) => Promise<void>

  startPlaySession: () => Promise<PlaySession>
  getActivePlaySession: () => Promise<PlaySession | null>
  finishPlaySession: (id: number, title: string | null, notes: string | null) => Promise<PlaySession>
  cancelPlaySession: (id: number) => Promise<void>
  getFinishedPlaySessions: () => Promise<PlaySessionSummary[]>

  addPendingTournament: (data: NewPendingTournament) => Promise<PendingTournament>
  getPendingTournaments: (playSessionId: number) => Promise<PendingTournament[]>
  finishPendingTournament: (id: number, cashout: number) => Promise<Session>
  deletePendingTournament: (id: number) => Promise<void>
}

declare global {
  interface Window {
    api: SessionAPI
  }
}
