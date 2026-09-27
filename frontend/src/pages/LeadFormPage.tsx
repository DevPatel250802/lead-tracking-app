import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchLead, saveLead } from '../features/leadsSlice'
import { getLeads } from '../api/leads'
import type { LeadStatus } from '../types'
import Navbar from '../components/Navbar'

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'lost', label: 'Lost' },
]

interface FormErrors {
  name?: string
  email?: string
  phone?: string
}

function validateForm(form: { name: string; email: string; phone: string }): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }
  const email = form.email.trim()
  if (!email) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address'
  }
  const phone = form.phone.trim()
  if (!phone) {
    errors.phone = 'Phone is required'
  } else if (!/^\+?[0-9\s\-()]{7,18}$/.test(phone)) {
    errors.phone = 'Enter a valid phone number'
  }
  return errors
}

async function emailExists(email: string, currentId?: number): Promise<boolean> {
  try {
    const response = await getLeads({ search: email.trim(), page: 0, limit: 100 })
    return response.data.some(
      (lead) => lead.email.toLowerCase() === email.trim().toLowerCase() && lead.id !== currentId,
    )
  } catch {
    return false
  }
}

export default function LeadFormPage() {
  const { id } = useParams()
  const leadId = id ? Number(id) : undefined
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const detailLoading = useAppSelector((state) => state.leads.detailLoading)
  const detailError = useAppSelector((state) => state.leads.detailError)
  const currentLead = useAppSelector((state) => state.leads.currentLead)
  const saving = useAppSelector((state) => state.leads.saving)
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: 'new' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (leadId) {
      dispatch(fetchLead(leadId))
    }
  }, [dispatch, leadId])

  useEffect(() => {
    if (leadId && currentLead && currentLead.id === leadId) {
      setForm({
        name: currentLead.name,
        email: currentLead.email,
        phone: currentLead.phone,
        status: currentLead.status,
      })
    }
  }, [currentLead, leadId])

  const handleChange = (field: 'name' | 'email' | 'phone' | 'status', value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    if (field !== 'status' && errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }))
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const nextErrors = validateForm(form)
    if (nextErrors.name || nextErrors.email || nextErrors.phone) {
      setErrors(nextErrors)
      return
    }
    if (await emailExists(form.email, leadId)) {
      setErrors({ email: 'This email is already used by another lead' })
      return
    }
    const input = { ...form, status: form.status as LeadStatus }
    const result = await dispatch(saveLead({ id: leadId, input }))
    if (saveLead.fulfilled.match(result)) {
      navigate(`/leads/${result.payload.id}`)
    } else if (saveLead.rejected.match(result)) {
      setFormError(result.payload ?? 'Could not save the lead')
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="content">
        {leadId && detailLoading ? (
          <div className="loading-block">Loading lead…</div>
        ) : (
          <form className="form-card" onSubmit={handleSubmit} noValidate>
            <h2 className="form-title">{leadId ? 'Edit lead' : 'New lead'}</h2>
            {leadId && detailError && <div className="alert alert-error">{detailError}</div>}
            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Full name"
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="name@company.com"
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : leadId ? 'Save changes' : 'Create lead'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
