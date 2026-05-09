import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

export default function AdminSidebar({
  isOpen,
  onClose,
  showStats = true,
  primaryLink = { to: '/admin/reports', label: 'Manage Reports' },
}) {
  const navigate = useNavigate()
  const { admin, logoutAdmin } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [stats, setStats] = useState(null)

  const firstName = admin?.first_name || 'Admin'
  const lastName = admin?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Admin'
  const initial = (firstName.charAt(0) || 'A').toUpperCase()
  const position = admin?.position || 'Admin'

  useEffect(() => {
    if (!showStats) return
    let cancelled = false
    api
      .get('/admin/stats')
      .then(({ data }) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        /* silent */
      })
    return () => {
      cancelled = true
    }
  }, [showStats])

  function handleLogout() {
    setConfirmOpen(true)
  }

  function confirmLogout() {
    setConfirmOpen(false)
    logoutAdmin()
    navigate('/admin/login', { replace: true })
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
            <p className="sidebar-user-role">{position}</p>
          </div>
        </div>

        <Link to={primaryLink.to} className="sidebar-my-reports-link">
          {primaryLink.to === '/admin' || primaryLink.to === '/admin/home' ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ) : (
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
          )}
          {primaryLink.label}
        </Link>

        {showStats && (
          <div className="sidebar-section">
            <p className="sidebar-eyebrow">Platform overview</p>
            <div className="sidebar-stats">
              <div className="stat-row">
                <span className="stat-row-label">Total reports</span>
                <span className="stat-row-value">
                  {stats?.total_reports ?? 0}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-row-label">Pending</span>
                <span className="stat-row-value warning">
                  {stats?.pending_reports ?? 0}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-row-label">In progress</span>
                <span className="stat-row-value danger">
                  {stats?.in_progress_reports ?? 0}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-row-label">Resolved</span>
                <span className="stat-row-value success">
                  {stats?.resolved_reports ?? 0}
                </span>
              </div>
            </div>
          </div>
        )}

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
        title="Log out of admin?"
        message="You'll need to sign in again to access the admin dashboard."
        confirmLabel="Log out"
        cancelLabel="Cancel"
      />
    </>
  )
}
