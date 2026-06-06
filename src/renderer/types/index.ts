export type RegistrationTime = 'Early' | 'Medium' | 'Late'

export interface Session {
  id: number
  tournament_name: string | null
  date: string
  buy_in: number
  cashout: number
  type: string | null
  registration_time: RegistrationTime | null
}

export type NewSession = Omit<Session, 'id'>

export interface SessionAPI {
  createSession: (data: NewSession) => Promise<Session>
  getAllSessions: () => Promise<Session[]>
  updateSession: (id: number, data: Partial<NewSession>) => Promise<Session>
  deleteSession: (id: number) => Promise<void>
}

declare global {
  interface Window {
    api: SessionAPI
  }
}
