import { apiClient } from './http'

export interface AgendaSession {
  id: string
  title: string
  track?: string | null
  type?: string | null
  timeslot?: string | null
  speaker_id?: string | null
}

export interface CreateAgendaSessionInput {
  title: string
  track?: string
  type?: string
  timeslot?: string
  speaker_id?: string | null
}

export async function listAgendaSessions(): Promise<AgendaSession[]> {
  const { data } = await apiClient.get<{ items: AgendaSession[] }>('/api/agenda/sessions')
  return data.items
}

export async function uploadAgenda(payload: { sessions: CreateAgendaSessionInput[] }): Promise<AgendaSession[]> {
  const { data } = await apiClient.post<{ items: AgendaSession[] }>('/api/agenda/upload', payload)
  return data.items
}

export async function createAgendaSession(input: CreateAgendaSessionInput): Promise<AgendaSession> {
  const { data } = await apiClient.post<{ session: AgendaSession }>('/api/agenda/sessions', input)
  return data.session
}

export async function updateAgendaSession(id: string, patch: Partial<CreateAgendaSessionInput>): Promise<AgendaSession> {
  const { data } = await apiClient.put<{ session: AgendaSession }>(`/api/agenda/sessions/${id}`, patch)
  return data.session
}

export async function deleteAgendaSession(id: string): Promise<void> {
  await apiClient.delete(`/api/agenda/sessions/${id}`)
}
