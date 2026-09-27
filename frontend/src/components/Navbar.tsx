import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../features/authSlice'
import { getInitials } from '../utils/format'

export default function Navbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const email = useAppSelector((state) => state.auth.email)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => navigate('/leads')}>
          <span className="brand-mark">◆</span>
          LeadFlow
        </div>
        <div className="nav-user">
          <span className="avatar avatar-sm">{email ? getInitials(email) : 'LF'}</span>
          <span className="nav-email">{email}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
