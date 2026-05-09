import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import AuthHero from '../components/AuthHero.jsx'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { loginAdmin, isAdminAuthed } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState('')

  useEffect(() => {
    document.body.classList.add('auth-page')
    return () => document.body.classList.remove('auth-page')
  }, [])

  useEffect(() => {
    if (isAdminAuthed) navigate('/admin', { replace: true })
  }, [isAdminAuthed, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setAlert('')

    const id = identifier.trim()
    if (!id || !password) {
      return setAlert('Please enter both fields')
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/admins/login', {
        identifier: id,
        password,
      })
      loginAdmin(data.token, data.admin)
      setTimeout(() => navigate('/admin', { replace: true }), 400)
    } catch (err) {
      console.error('Admin login error:', err)
      const msg =
        err?.response?.data?.message ||
        (err?.response ? 'Login failed' : 'Login failed. Please try again.')
      setAlert(msg)
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <AuthHero
        tagline="Admin Portal,"
        accent="manage your city."
        subtitle="Review reports. Respond to citizens. Publish updates."
        stats={[
          { value: '🛡️', label: 'Secure access' },
          { value: '⚡', label: 'Real-time' },
          { value: '📊', label: 'Full control' },
        ]}
      />

      <div className="auth-form-side">
        <div className="admin-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin Portal
        </div>

        <h2>Welcome back, Admin</h2>
        <p className="auth-subtitle">Sign in to manage the platform</p>

        <div className={`alert alert-error ${alert ? 'show' : ''}`}>{alert}</div>

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="identifier" className="form-label">
              Email or Employee ID
            </label>
            <div className="form-input-wrap">
              <input
                type="text"
                id="identifier"
                className="form-input"
                placeholder="admin@municipality.gov or ADM001"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="form-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input has-icon"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="form-icon-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in to dashboard'}
          </button>
        </form>

        <p className="auth-footer-text">
          Not an admin?{' '}
          <Link to="/login" className="auth-link">
            Citizen login
          </Link>
        </p>
      </div>
    </div>
  )
}
