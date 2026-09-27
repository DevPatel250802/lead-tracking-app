import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchLead, removeLead } from '../features/leadsSlice'
import { NOTES_PAGE_SIZE, addNoteForLead, fetchNotes } from '../features/notesSlice'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { formatDate, formatDateTime, getInitials } from '../utils/format'

export default function LeadDetailPage() {
  const { id } = useParams()
  const leadId = Number(id)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [noteText, setNoteText] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const leads = useAppSelector((state) => state.leads)
  const notes = useAppSelector((state) => state.notes)

  useEffect(() => {
    dispatch(fetchLead(leadId))
    dispatch(fetchNotes({ leadId }))
  }, [dispatch, leadId])

  const handleAddNote = async (event: FormEvent) => {
    event.preventDefault()
    const content = noteText.trim()
    if (!content) {
      return
    }
    const result = await dispatch(addNoteForLead({ leadId, content }))
    if (addNoteForLead.fulfilled.match(result)) {
      setNoteText('')
      const lastPage = Math.max(0, Math.ceil((notes.total + 1) / NOTES_PAGE_SIZE) - 1)
      dispatch(fetchNotes({ leadId, page: lastPage }))
    }
  }

  const handleDelete = async () => {
    const result = await dispatch(removeLead(leadId))
    if (removeLead.fulfilled.match(result)) {
      navigate('/leads')
    }
  }

  if (leads.detailLoading) {
    return (
      <div className="page">
        <Navbar />
        <main className="content">
          <div className="loading-block">Loading lead…</div>
        </main>
      </div>
    )
  }

  if (!leads.currentLead || leads.currentLead.id !== leadId) {
    return (
      <div className="page">
        <Navbar />
        <main className="content">
          <div className="empty-state">
            <p className="empty-title">Lead not found</p>
            <p className="empty-sub">It may have been deleted or the link is wrong.</p>
            <button className="btn btn-secondary" onClick={() => navigate('/leads')}>
              ← Back to leads
            </button>
          </div>
        </main>
      </div>
    )
  }

  const lead = leads.currentLead
  const initials = getInitials(lead.name)

  return (
    <div className="page">
      <Navbar />
      <main className="content">
        <button className="back-link" onClick={() => navigate('/leads')}>
          ← Back to leads
        </button>
        <div className="detail-head">
          <span className="avatar avatar-lg">{initials}</span>
          <div>
            <h1>
              {lead.name}
              <StatusBadge status={lead.status} />
            </h1>
            <div className="detail-meta">
              Lead since {formatDate(lead.createdAt)} · {notes.total} note{notes.total === 1 ? '' : 's'}
            </div>
          </div>
          <div className="detail-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </button>
          </div>
        </div>
        <div className="detail-grid">
          <div className="panel">
            <div className="panel-head">Contact information</div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-val">{lead.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone</span>
              <span className="info-val">{lead.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-val">
                <StatusBadge status={lead.status} />
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Created</span>
              <span className="info-val">{formatDate(lead.createdAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Updated</span>
              <span className="info-val">{formatDate(lead.updatedAt)}</span>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">Notes</div>
            <form className="composer" onSubmit={handleAddNote}>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Write a note…"
              />
              <button className="btn btn-primary" type="submit" disabled={notes.adding || !noteText.trim()}>
                {notes.adding ? 'Adding…' : 'Add note'}
              </button>
            </form>
            {notes.error && <div className="alert alert-error notes-error">{notes.error}</div>}
            {notes.loading && notes.items.length === 0 ? (
              <div className="notes-empty">Loading notes…</div>
            ) : notes.items.length === 0 ? (
              <div className="notes-empty">
                {notes.error ? 'Notes could not be loaded.' : 'No notes yet. Add the first one above.'}
              </div>
            ) : (
              <>
                {notes.items.map((note) => (
                  <div className="note" key={note.id}>
                    <span className="avatar avatar-sm">{initials}</span>
                    <div>
                      <div className="note-body">{note.content}</div>
                      <div className="note-time">{formatDateTime(note.createdAt)}</div>
                    </div>
                  </div>
                ))}
                <div className="notes-pager">
                  <Pagination
                    page={notes.page}
                    total={notes.total}
                    limit={NOTES_PAGE_SIZE}
                    label="notes"
                    onPageChange={(page) => dispatch(fetchNotes({ leadId, page }))}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <ConfirmDialog
          open={confirmOpen}
          title="Delete lead"
          message={`Delete ${lead.name}? The lead's notes are removed too. This cannot be undone.`}
          loading={leads.deleting}
          error={leads.deleteError}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </main>
    </div>
  )
}
