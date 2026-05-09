import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

export default function CitizenSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { citizen, logoutCitizen } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  })

  const firstName = citizen?.first_name || ''
  const lastName = citizen?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Citizen'
  const initial = (firstName.charAt(0) || '?').toUpperCase()

  useEffect(() => {
    let cancelled = false
    api
      .get('/reports/my/stats')
      .then(({ data }) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        /* sidebar gracefully stays at 0 */
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleLogout() {
    setConfirmOpen(true)
  }

  function confirmLogout() {
    setConfirmOpen(false)
    logoutCitizen()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div
        className={`sidebar-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
      ></div>

      <aside className={`home-sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{fullName}</p>
            <p className="sidebar-user-role">Citizen</p>
          </div>
        </div>

        <Link to="/my-reports" className="sidebar-my-reports-link">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          My Reports
        </Link>

        <div className="sidebar-section">
          <p className="sidebar-eyebrow">My activity</p>
          <div className="sidebar-stats">
            <div className="stat-row">
              <span className="stat-row-label">Total reports</span>
              <span className="stat-row-value">{stats.total ?? 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">Pending</span>
              <span className="stat-row-value warning">
                {stats.pending ?? 0}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">In progress</span>
              <span className="stat-row-value danger">
                {stats.in_progress ?? 0}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">Resolved</span>
              <span className="stat-row-value success">
                {stats.resolved ?? 0}
              </span>
            </div>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </aside>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={confirmLogout}
        onCancel={() => setConfirmOpen(false)}
        title="Log out?"
        message="You'll need to sign in again to access your account."
        confirmLabel="Log out"
        cancelLabel="Cancel"
      />
    </>
  )
}
