import api from './axios'
import type { Lead, LeadInput, LeadsResponse, Note, NotesResponse } from '../types'

export interface LeadsQuery {
  search: string
  page: number
  limit: number
}

export async function getLeads(query: LeadsQuery): Promise<LeadsResponse> {
  const { data } = await api.get<Lead[] | LeadsResponse>('/api/leads', {
    params: {
      search: query.search || undefined,
      offset: query.page,
      limit: query.limit,
    },
  })
  if (Array.isArray(data)) {
    return { data, total: data.length }
  }
  return data
}

export async function getLead(id: number): Promise<Lead> {
  const { data } = await api.get<Lead>(`/api/leads/${id}`)
  return data
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const { data } = await api.post<Lead>('/api/leads', input)
  return data
}

export async function updateLead(id: number, input: Partial<LeadInput>): Promise<void> {
  await api.patch(`/api/leads/${id}`, input)
}

export async function deleteLead(id: number): Promise<void> {
  await api.delete(`/api/leads/${id}`)
}

export async function getNotes(leadId: number, page: number, limit: number): Promise<NotesResponse> {
  const { data } = await api.get<NotesResponse>(`/api/leads/${leadId}/notes`, {
    params: { offset: page, limit },
  })
  return data
}

export async function addNote(leadId: number, content: string): Promise<Note> {
  const { data } = await api.post<Note>(`/api/leads/${leadId}/notes`, { content })
  return data
}
