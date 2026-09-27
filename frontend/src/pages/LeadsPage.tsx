import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchLeads, setLimit, setPage, setSearch } from '../features/leadsSlice'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { formatDate, getInitials } from '../utils/format'

export default function LeadsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const leads = useAppSelector((state) => state.leads)

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearch(searchInput))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, dispatch])

  useEffect(() => {
    dispatch(fetchLeads())
  }, [dispatch, leads.search, leads.page, leads.limit])

  return (
    <div className="page">
      <Navbar />
      <main className="content">
        <div className="page-head">
          <h1>
            Leads
            {leads.searching && <span className="count-pill">{leads.items.length} results</span>}
            {!leads.searching && !leads.listLoading && (
              <span className="count-pill">{leads.total} total</span>
            )}
          </h1>
          <button className="btn btn-primary" onClick={() => navigate('/leads/new')}>
            + New Lead
          </button>
        </div>
        <div className="toolbar">
          <input
            className="search-box"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        {leads.listError && (
          <div className="alert alert-error">
            {leads.listError}
            <button className="btn-link" onClick={() => dispatch(fetchLeads())}>
              Retry
            </button>
          </div>
        )}
        {leads.listLoading && leads.items.length === 0 ? (
          <div className="skeleton">
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : leads.items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">{leads.search ? 'No leads match your search' : 'No leads yet'}</p>
            <p className="empty-sub">
              {leads.search ? 'Try a different name or email.' : 'Create your first lead to get started.'}
            </p>
            {!leads.search && (
              <button className="btn btn-primary" onClick={() => navigate('/leads/new')}>
                Create your first lead
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`table-wrap${leads.listLoading ? ' refreshing' : ''}`}>
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.items.map((lead) => (
                    <tr key={lead.id} className="row-click" onClick={() => navigate(`/leads/${lead.id}`)}>
                      <td>
                        <div className="lead-cell">
                          <span className="avatar avatar-sm">{getInitials(lead.name)}</span>
                          <div>
                            <div className="lead-name">{lead.name}</div>
                            <div className="lead-sub">{lead.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{lead.phone}</td>
                      <td>
                        <StatusBadge status={lead.status} />
                      </td>
                      <td>{formatDate(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!leads.searching && (
              <Pagination
                page={leads.page}
                total={leads.total}
                limit={leads.limit}
                onPageChange={(page) => dispatch(setPage(page))}
                onLimitChange={(limit) => dispatch(setLimit(limit))}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
