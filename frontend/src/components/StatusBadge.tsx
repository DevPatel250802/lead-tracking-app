import type { LeadStatus } from '../types'

const labels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  lost: 'Lost',
}

export default function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`status status-${status}`}>{labels[status]}</span>
}
