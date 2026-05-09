import { useEffect, useRef, useState } from 'react'
import api from '../../api/client.js'
import { formatDate, formatRelativeDate } from '../../utils/format.js'
import Skyline from '../../components/Skyline.jsx'
import BackLink from '../../components/BackLink.jsx'
import Modal from '../../components/Modal.jsx'

export default function AdminServiceRequests() {
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [requests, setRequests] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [modalKey, setModalKey] = useState(0)

  async function loadRequests() {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    setRequests(null)
    try {
      const { data } = await api.get(
        `/admin/service-requests?${params.toString()}`,
      )
      setRequests(data.requests)
    } catch {
      setRequests('error')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequests()
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  return (
    <>
      <Skyline />
      <BackLink to="/admin" label="Back to dashboard" />

      <div className="page-header">
        <span className="page-header-eyebrow">● Manage</span>
        <h1 className="page-title">Service Requests</h1>
        <p className="page-subtitle">
          Review citizen requests and upload requested documents.
        </p>
      </div>

      <div className="reports-filters">
        <input
          type="text"
          className="filter-input"
          placeholder="🔍 Search by citizen name or description…"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
        />
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="ready">Ready</option>
        </select>
      </div>

      <div className="reports-list">
        {requests === null && (
          <div className="loading-state">Loading requests…</div>
        )}
        {requests === 'error' && (
          <div className="empty-state">Couldn't load requests.</div>
        )}
        {Array.isArray(requests) && requests.length === 0 && (
          <div className="empty-state">No service requests found.</div>
        )}
        {Array.isArray(requests) &&
          requests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              onClick={() => setActiveId(r.id)}
            />
          ))}
      </div>

      <RequestModal
        key={`${activeId}-${modalKey}`}
        requestId={activeId}
        onClose={() => setActiveId(null)}
        onResponded={async () => {
          setActiveId(null)
          setModalKey((k) => k + 1)
          await loadRequests()
        }}
      />
    </>
  )
}

function RequestRow({ request, onClick }) {
  const dateStr = formatRelativeDate(request.created_at)
  const sClass = request.status === 'ready' ? 'resolved' : 'submitted'
  const sLabel = request.status === 'ready' ? 'Ready ✓' : 'Pending'
  const citizenName = `${request.citizen_first_name || ''} ${
    request.citizen_last_name || ''
  }`.trim()
  const preview =
    request.description.slice(0, 80) +
    (request.description.length > 80 ? '…' : '')

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
          <span>👤 {citizenName}</span>
          <span>•</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </div>
  )
}

function RequestModal({ requestId, onClose, onResponded }) {
  const isOpen = requestId !== null
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [file, setFile] = useState(null)
  const [adminMessage, setAdminMessage] = useState('')
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [sending, setSending] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setData(null)
    setError(false)
    setFile(null)
    setAdminMessage('')
    setAlert({ type: '', message: '' })
    if (fileRef.current) fileRef.current.value = ''

    let cancelled = false
    api
      .get(`/admin/service-requests/${requestId}`)
      .then(({ data: res }) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, requestId])

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setAlert({ type: '', message: '' })

    if (!file) {
      return setAlert({ type: 'error', message: 'Please attach a document' })
    }
    if (file.size > 10 * 1024 * 1024) {
      return setAlert({ type: 'error', message: 'File too large (max 10 MB)' })
    }

    setSending(true)
    const formData = new FormData()
    formData.append('document', file)
    formData.append('admin_message', adminMessage.trim())

    try {
      await api.post(
        `/admin/service-requests/${requestId}/respond`,
        formData,
      )
      setAlert({
        type: 'success',
        message: 'Response sent! Citizen has been notified.',
      })
      setTimeout(() => onResponded(), 1000)
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Failed',
      })
      setSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {!data && !error && (
        <div className="loading-state" style={{ padding: '80px 20px' }}>
          Loading…
        </div>
      )}
      {error && (
        <div className="empty-state">Couldn't load request.</div>
      )}
      {data && data.request && (
        <RequestModalBody
          request={data.request}
          file={file}
          fileRef={fileRef}
          onFileChange={onFileChange}
          adminMessage={adminMessage}
          setAdminMessage={setAdminMessage}
          alert={alert}
          sending={sending}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  )
}

function RequestModalBody({
  request,
  file,
  fileRef,
  onFileChange,
  adminMessage,
  setAdminMessage,
  alert,
  sending,
  onSubmit,
}) {
  const dateStr = formatDate(request.created_at)
  const sClass = request.status === 'ready' ? 'resolved' : 'submitted'
  const sLabel = request.status === 'ready' ? 'Ready ✓' : 'Pending'
  const citizenName = `${request.citizen_first_name || ''} ${
    request.citizen_last_name || ''
  }`.trim()

  return (
    <div className="news-modal-body">
      <div className="news-modal-meta">
        <span className={`status-badge ${sClass}`}>{sLabel}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          {dateStr}
        </span>
      </div>
      <h1 className="news-modal-title">Service request</h1>

      <div className="admin-citizen-card">
        <div className="admin-citizen-avatar">
          {(citizenName || '?').charAt(0).toUpperCase()}
        </div>
        <div className="admin-citizen-info">
          <p className="admin-citizen-name">{citizenName}</p>
          <p className="admin-citizen-contact">📧 {request.citizen_email}</p>
          {request.citizen_phone && (
            <p className="admin-citizen-contact">
              📞 {request.citizen_phone}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          margin: '16px 0',
          padding: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
        }}
      >
        <p className="report-label">Citizen's request</p>
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

      {request.document_file && (
        <div className="admin-action-block">
          <p className="report-label">Current document</p>
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
            {request.document_filename || 'document'}
          </a>
          {request.admin_message && (
            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <em>Note: {request.admin_message}</em>
            </p>
          )}
        </div>
      )}

      <div className="admin-action-block">
        <p className="report-label">
          {request.document_file
            ? 'Replace document'
            : 'Upload document response'}
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
              Document file <span className="required-mark">*</span>
            </label>
            <div
              className={`photo-upload-zone${file ? ' has-photo' : ''}`}
            >
              <input
                ref={fileRef}
                type="file"
                className="photo-upload-input"
                required
                onChange={onFileChange}
              />
              <div className="photo-upload-content">
                {file ? (
                  <div style={{ padding: 18, textAlign: 'center' }}>
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{
                        color: 'var(--color-success)',
                        marginBottom: 8,
                      }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <polyline points="9 14 11 16 15 12" />
                    </svg>
                    <p
                      style={{
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        margin: '0 0 4px',
                      }}
                    >
                      {file.name}
                    </p>
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                        margin: 0,
                      }}
                    >
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p>
                      <strong>Tap to upload</strong> a file
                    </p>
                    <p className="report-help-text">
                      Any file type — max 10 MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="report-form-section">
            <label className="report-label">Optional message</label>
            <textarea
              className="report-textarea"
              placeholder="Add a note for the citizen…"
              rows={2}
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="report-submit-btn"
            disabled={sending}
          >
            {sending ? 'Sending…' : 'Send response'}
          </button>
        </form>
      </div>
    </div>
  )
}
