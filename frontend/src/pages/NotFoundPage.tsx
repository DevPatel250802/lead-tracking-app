import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="notfound-page">
      <div className="notfound-code">404</div>
      <p className="notfound-text">Page not found</p>
      <button className="btn btn-primary" onClick={() => navigate('/leads')}>
        Back to leads
      </button>
    </div>
  )
}
