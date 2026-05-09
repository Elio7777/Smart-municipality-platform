import { useEffect, useState } from 'react'
import api from '../api/client.js'
import { formatDate, formatRelativeDate } from '../utils/format.js'
import Skyline from '../components/Skyline.jsx'
import BackLink from '../components/BackLink.jsx'
import Modal from '../components/Modal.jsx'
import Chatbot from '../components/Chatbot.jsx'

export default function Services() {
  const [requests, setRequests] = useState(null)
  const [openForm, setOpenForm] = useState(false)
  const [activeRequest, setActiveRequest] = useState(null)

  async function loadRequests() {
    setRequests(null)
    try {
      const { data } = await api.get('/service-requests/my')
      setRequests(data.requests || [])
    } catch {
      setRequests('error')
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  return (
    <>
      <Skyline />
      <BackLink to="/home" label="Back to home" />

      <div className="page-header">
        <span className="page-header-eyebrow">● Municipal services</span>
        <h1 className="page-title">Request a Service</h1>
        <p className="page-subtitle">
          Need a document or assistance? Tell us and we'll get back to you.
        </p>
      </div>

      <button
        type="button"
        className="service-hero-card"
        onClick={() => setOpenForm(true)}
        style={{
          textAlign: 'left',
          color: 'inherit',
          font: 'inherit',
          width: '100%',
          cursor: 'pointer',
        }}
      >
        <div className="service-hero-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>
        <div className="service-hero-text">
          <h2 className="service-hero-title">Make a new request</h2>
          <p className="service-hero-desc">
            Click here to describe what you need from the municipality. An
            admin will review your request and respond with the requested
            document.
          </p>
        </div>
        <div className="service-hero-arrow">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </button>

      <div className="my-requests-section">
        <h3 className="my-requests-title">Your requests</h3>
        <div className="reports-list">
          {requests === null && (
            <div className="loading-state">Loading your requests…</div>
          )}
          {requests === 'error' && (
            <div className="empty-state">Couldn't load requests.</div>
          )}
          {Array.isArray(requests) && requests.length === 0 && (
            <div className="empty-state">
              You haven't made any requests yet.
            </div>
          )}
          {Array.isArray(requests) &&
            requests.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                onClick={() => setActiveRequest(r)}
              />
            ))}
        </div>
      </div>

      <NewRequestModal
        isOpen={openForm}
        onClose={() => setOpenForm(false)}
        onSubmitted={async () => {
          setOpenForm(false)
          await loadRequests()
        }}
      />

      <RequestDetailModal
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onCanceled={async () => {
          setActiveRequest(null)
          await loadRequests()
        }}
      />

      <Chatbot />
    </>
  )
}

function RequestRow({ request, onClick }) {
  const dateStr = formatRelativeDate(request.created_at)
  const sClass = request.status === 'ready' ? 'resolved' : 'submitted'
  const sLabel = request.status === 'ready' ? 'Ready ✓' : 'Pending'
  const preview =
    request.description.slice(0, 100) +
    (request.description.length > 100 ? '…' : '')

  return (
    <div
      className="report-row request-row"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="request-row-icon">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div className="report-row-content">
        <div className="report-row-top">
          <h3 className="report-row-title">{preview}</h3>
          <span className={`status-badge ${sClass}`}>{sLabel}</span>
        </div>
        <div className="report-row-meta">
          <span>{dateStr}</span>
          {request.status === 'ready' && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--color-success)' }}>
                Document ready to download
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function NewRequestModal({ isOpen, onClose, onSubmitted }) {
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState({ type: '', message: '' })

  useEffect(() => {
    if (!isOpen) {
      setDescription('')
      setAlert({ type: '', message: '' })
      setSubmitting(false)
    }
  }, [isOpen])

  async function onSubmit(e) {
    e.preventDefault()
    setAlert({ type: '', message: '' })

    const trimmed = description.trim()
    if (trimmed.length < 5) {
      return setAlert({
        type: 'error',
        message: 'Please describe what you need (at least 5 characters)',
      })
    }
    setSubmitting(true)
    try {
      await api.post('/service-requests', { description: trimmed })
      setAlert({ type: 'success', message: 'Request submitted!' })
      setTimeout(() => onSubmitted(), 800)
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err?.response?.data?.message || 'Submission failed',
      })
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div className="news-modal-body">
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'white',
            marginBottom: 8,
          }}
        >
          New request
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 18,
          }}
        >
          Describe what you need. Be as detailed as possible.
        </p>

        <div
          className={`form-alert ${alert.type}${
            alert.message ? ' show' : ''
          }`}
        >
          {alert.message}
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="report-form-section">
            <label className="report-label">
              What do you need?{' '}
              <span className="required-mark">*</span>
            </label>
            <textarea
              className="report-textarea"
              placeholder="Example: I need a copy of my birth certificate. My ID number is…"
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
            <p className="report-help-text">
              Include any details that would help us prepare the document.
            </p>
          </div>

          <button
            type="submit"
            className="report-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </div>
    </Modal>
  )
}

function RequestDetailModal({ request, onClose, onCanceled }) {
  const isOpen = request !== null
  if (!isOpen) return <Modal isOpen={false} onClose={onClose} maxWidth="600px" />

  const dateStr = formatDate(request.created_at)
  const sClass = request.status === 'ready' ? 'resolved' : 'submitted'
  const sLabel = request.status === 'ready' ? 'Ready ✓' : 'Pending'

  async function handleCancel() {
    if (!window.confirm('Cancel this request? This cannot be undone.')) return
    try {
      await api.delete(`/service-requests/${request.id}`)
      onCanceled()
    } catch (err) {
      window.alert(
        "Couldn't cancel: " +
          (err?.response?.data?.message || err.message),
      )
    }
  }

  const adminName = `${request.admin_first_name || ''} ${
    request.admin_last_name || ''
  }`.trim()

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div className="news-modal-body">
        <div className="news-modal-meta">
          <span className={`status-badge ${sClass}`}>{sLabel}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {dateStr}
          </span>
        </div>
        <h1 className="news-modal-title">Service request</h1>

        <div
          style={{
            margin: '16px 0',
            padding: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
          }}
        >
          <p className="report-label">Your request</p>
          <p
            style={{
              color: 'white',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              marginTop: 6,
            }}
          >
            {request.description}
          </p>
        </div>

        {request.status === 'ready' && request.document_file ? (
          <div className="admin-action-block">
            <p className="report-label">Response from municipality</p>
            {request.admin_message && (
              <div className="comment" style={{ marginTop: 10 }}>
                <div
                  className="comment-avatar"
                  style={{ background: 'var(--color-red)' }}
                >
                  {(adminName || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="comment-bubble">
                  <div className="comment-meta">
                    <span className="comment-author">
                      {adminName}
                      {request.admin_position
                        ? ' • ' + request.admin_position
                        : ''}
                    </span>
                    <span className="comment-date">
                      {formatRelativeDate(request.updated_at)}
                    </span>
                  </div>
                  <p className="comment-content">{request.admin_message}</p>
                </div>
              </div>
            )}

            <a
              href={request.document_file}
              download={request.document_filename || 'document'}
              className="download-doc-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download {request.document_filename || 'document'}
            </a>
          </div>
        ) : (
          <div className="admin-action-block">
            <p className="report-label">Status</p>
            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                marginTop: 6,
              }}
            >
              Your request is being reviewed. You'll be notified when the
              document is ready.
            </p>
            <button
              className="btn-comment"
              onClick={handleCancel}
              style={{
                background: 'rgba(220,38,38,0.15)',
                color: '#FCA5A5',
                border: '1px solid rgba(220,38,38,0.3)',
                marginTop: 14,
              }}
            >
              Cancel request
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
