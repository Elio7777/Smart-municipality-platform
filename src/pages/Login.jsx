import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import AuthHero from '../components/AuthHero.jsx'

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Accept phone in any of these forms:
//   "70123456"            (local digits only, 6-15 digits)
//   "+961 70 123 456"     (international with country code)
//   "+96170123456"        (international, no spaces)
// Login is permissive — backend matches by trailing digits.
function looksLikePhone(value) {
  if (!/^[+\d\s\-()]+$/.test(value)) return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 6 && digits.length <= 15
}

function validate({ identifier, password }) {
  const errors = {}
  const id = identifier.trim()

  if (!id) {
    errors.identifier = 'Required'
  } else if (!EMAIL_RE.test(id) && !looksLikePhone(id)) {
    errors.identifier = 'Enter a valid email or phone number'
  }

  if (!password) {
    errors.password = 'Required'
  }

  return errors
}

const errorStyle = {
  color: '#FCA5A5',
  fontSize: 12,
  marginTop: 6,
  fontWeight: 500,
}

export default function Login() {
  const navigate = useNavigate()
  const { loginCitizen, isCitizenAuthed } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [alert, setAlert] = useState({ type: '', message: '' })

  useEffect(() => {
    document.body.classList.add('auth-page')
    return () => document.body.classList.remove('auth-page')
  }, [])

  useEffect(() => {
    if (isCitizenAuthed) navigate('/home', { replace: true })
  }, [isCitizenAuthed, navigate])

  const errors = validate({ identifier, password })
  const showErr = (field) =>
    (touched[field] || submitted) && errors[field] ? errors[field] : null

  function blur(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setAlert({ type: '', message: '' })

    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const { data } = await api.post('/citizens/login', {
        identifier: identifier.trim(),
        password,
      })
      loginCitizen(data.token, data.citizen)
      setAlert({ type: 'success', message: 'Login successful! Redirecting...' })
      setTimeout(() => {
        const redirectTo =
          sessionStorage.getItem('redirectAfterLogin') || '/home'
        sessionStorage.removeItem('redirectAfterLogin')
        navigate(redirectTo, { replace: true })
      }, 1000)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response ? 'Login failed' : 'Connection error. Please try again.')
      setAlert({ type: 'error', message: msg })
      console.error('Login error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <AuthHero
        tagline="Your city,"
        accent="in your hands."
        subtitle="Smart services for smart citizens."
        stats={[
          { value: '342', label: 'Issues resolved' },
          { value: '1.2k', label: 'Active citizens' },
          { value: '24h', label: 'Avg response' },
        ]}
      />

      <div className="auth-form-side">
        <h2>Welcome back</h2>
        <p className="auth-subtitle">Login to your account</p>

        <div
          className={`alert alert-${alert.type || 'error'} ${
            alert.message ? 'show' : ''
          }`}
        >
          {alert.message}
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="identifier" className="form-label">
              Email or phone
            </label>
            <div className="form-input-wrap">
              <input
                type="text"
                id="identifier"
                name="identifier"
                className="form-input"
                placeholder="elio@example.com or 70123456"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onBlur={() => blur('identifier')}
                aria-invalid={!!showErr('identifier')}
              />
            </div>
            {showErr('identifier') && (
              <p style={errorStyle}>{showErr('identifier')}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="form-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-input has-icon"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => blur('password')}
                aria-invalid={!!showErr('password')}
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
            {showErr('password') && (
              <p style={errorStyle}>{showErr('password')}</p>
            )}
          </div>

          <div className="form-row">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <Link to="/admin/login" className="auth-admin-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin? Login here
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
