export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost'

export interface Lead {
  id: number
  name: string
  email: string
  phone: string
  status: LeadStatus
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: number
  content: string
  createdAt: string
  updatedAt: string
}

export interface LeadsResponse {
  data: Lead[]
  total: number
}

export interface NotesResponse {
  data: Note[]
  total: number
}

export interface LoginResponse {
  access_token: string
}

export interface LeadInput {
  name: string
  email: string
  phone: string
  status: LeadStatus
}
