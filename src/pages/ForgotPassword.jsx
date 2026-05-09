import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import AuthHero from '../components/AuthHero.jsx'
import CountryPicker from '../components/CountryPicker.jsx'
import { findCountry, DEFAULT_COUNTRY_CODE } from '../data/countries.js'

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

function isValidLocalPhone(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 6 && digits.length <= 14
}

function validate(form) {
  const errors = {}

  const email = form.email.trim()
  if (!email) errors.email = 'Required'
  else if (!EMAIL_RE.test(email))
    errors.email = 'Enter a valid email (e.g. name@example.com)'

  const phone = form.phone.trim()
  if (!phone) errors.phone = 'Required'
  else if (!isValidLocalPhone(phone))
    errors.phone = 'Enter a valid phone number (digits only)'

  if (!form.password) errors.password = 'Required'
  else if (form.password.length < 8)
    errors.password = 'At least 8 characters'

  if (!form.confirm_password) errors.confirm_password = 'Required'
  else if (form.password !== form.confirm_password)
    errors.confirm_password = 'Passwords do not match'

  return errors
}

const errorStyle = {
  color: '#FCA5A5',
  fontSize: 12,
  marginTop: 6,
  fontWeight: 500,
}

const phoneInputStyles = {
  row: { display: 'flex', alignItems: 'stretch', width: '100%' },
  number: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [alert, setAlert] = useState({ type: 'error', message: '' })

  useEffect(() => {
    document.body.classList.add('auth-page')
    return () => document.body.classList.remove('auth-page')
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }
  function blur(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }
  function onPhoneChange(e) {
    update('phone', e.target.value.replace(/\D/g, ''))
  }

  const errors = validate(form)
  const showErr = (field) =>
    (touched[field] || submitted) && errors[field] ? errors[field] : null

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setAlert({ type: 'error', message: '' })

    if (Object.keys(errors).length > 0) return

    const country = findCountry(countryCode)
    const fullPhone = `${country.dial} ${form.phone.trim()}`

    setSubmitting(true)
    try {
      await api.post('/citizens/forgot-password', {
        email: form.email.trim(),
        phone: fullPhone,
        password: form.password,
      })
      setAlert({
        type: 'success',
        message: 'Password reset! Redirecting to login...',
      })
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response
          ? 'Reset failed'
          : 'Connection error. Please try again.')
      setAlert({ type: 'error', message: msg })
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <AuthHero
        tagline="Forgot your"
        accent="password?"
        subtitle="Verify your identity and pick a new one."
        stats={[
          { value: '🔒', label: 'Secure reset' },
          { value: '2', label: 'Identity checks' },
          { value: '1min', label: 'To reset' },
        ]}
      />

      <div className="auth-form-side">
        <h2>Reset password</h2>
        <p className="auth-subtitle">
          Enter the email and phone you registered with, then your new
          password.
        </p>

        <div
          className={`alert alert-${alert.type} ${alert.message ? 'show' : ''}`}
        >
          {alert.message}
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="elio@example.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              onBlur={() => blur('email')}
              aria-invalid={!!showErr('email')}
            />
            {showErr('email') && <p style={errorStyle}>{showErr('email')}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <div style={phoneInputStyles.row}>
              <CountryPicker value={countryCode} onChange={setCountryCode} />
              <input
                type="tel"
                id="phone"
                className="form-input"
                style={phoneInputStyles.number}
                placeholder="70123456"
                required
                autoComplete="tel-national"
                inputMode="numeric"
                value={form.phone}
                onChange={onPhoneChange}
                onBlur={() => blur('phone')}
                aria-invalid={!!showErr('phone')}
              />
            </div>
            {showErr('phone') && <p style={errorStyle}>{showErr('phone')}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              New password
            </label>
            <div className="form-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input has-icon"
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
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

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">
              Confirm new password
            </label>
            <input
              type="password"
              id="confirm_password"
              className="form-input"
              placeholder="Re-enter password"
              required
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => update('confirm_password', e.target.value)}
              onBlur={() => blur('confirm_password')}
              aria-invalid={!!showErr('confirm_password')}
            />
            {showErr('confirm_password') && (
              <p style={errorStyle}>{showErr('confirm_password')}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <p className="auth-footer-text">
          Remembered it?{' '}
          <Link to="/login" className="auth-link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
