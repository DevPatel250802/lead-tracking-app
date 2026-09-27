interface PaginationProps {
  page: number
  total: number
  limit: number
  label?: string
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
}

export default function Pagination({
  page,
  total,
  limit,
  label = 'leads',
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const pages = Array.from({ length: totalPages }, (_, index) => index)
  const from = total === 0 ? 0 : page * limit + 1
  const to = Math.min(total, (page + 1) * limit)

  return (
    <div className="pager">
      <span className="pager-info">
        Showing {from}–{to} of {total} {label}
      </span>
      <div className="pager-controls">
        {onLimitChange && (
          <select
            className="page-size"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        )}
        <div className="pager-btns">
          <button className="pg" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            ←
          </button>
          {pages.map((item) => (
            <button
              key={item}
              className={`pg${item === page ? ' active' : ''}`}
              onClick={() => onPageChange(item)}
            >
              {item + 1}
            </button>
          ))}
          <button
            className="pg"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
