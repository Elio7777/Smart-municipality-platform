import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import api from '../../api/client.js'
import {
  formatDate,
  formatRelativeDate,
  capitalize,
  statusLabel,
} from '../../utils/format.js'
import { useToast } from '../../context/ToastContext.jsx'
import Skyline from '../../components/Skyline.jsx'
import BackLink from '../../components/BackLink.jsx'
import Modal from '../../components/Modal.jsx'

export default function AdminReports() {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category_id: '',
  })
  const [reports, setReports] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [modalKey, setModalKey] = useState(0) // bump to force re-fetch

  useEffect(() => {
    let cancelled = false
    api
      .get('/admin/categories')
      .then(({ data }) => {
        if (!cancelled) setCategories(data.categories || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.category_id)
        params.append('category_id', filters.category_id)

      setReports(null)
      api
        .get(`/admin/reports?${params.toString()}`)
        .then(({ data }) => setReports(data.reports))
        .catch(() => setReports('error'))
    }, 350)
    return () => clearTimeout(timer)
  }, [filters])

  function refreshList() {
    setFilters((f) => ({ ...f }))
  }

  return (
    <>
      <Skyline />
      <BackLink to="/admin" label="Back to dashboard" />

      <div className="page-header">
        <span className="page-header-eyebrow">● Manage</span>
        <h1 className="page-title">All Reports</h1>
        <p className="page-subtitle">
          Review citizen reports, update status, and respond.
        </p>
      </div>

      <div className="reports-filters">
        <input
          type="text"
          className="filter-input"
          placeholder="🔍 Search by title, description, or citizen name…"
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
          <option value="submitted">Submitted</option>
          <option value="review">Under review</option>
          <option value="progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          className="filter-select"
          value={filters.category_id}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category_id: e.target.value }))
          }
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon || ''} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="reports-list">
        {reports === null && (
          <div className="loading-state">Loading reports…</div>
        )}
        {reports === 'error' && (
          <div className="empty-state">Couldn't load reports.</div>
        )}
        {Array.isArray(reports) && reports.length === 0 && (
          <div className="empty-state">
            {filters.search || filters.status || filters.category_id
              ? 'No reports match your filters.'
              : 'No reports submitted yet.'}
          </div>
        )}
        {Array.isArray(reports) &&
          reports.map((r) => (
            <AdminReportRow
              key={r.id}
              report={r}
              onClick={() => setActiveId(r.id)}
            />
          ))}
      </div>

      <AdminReportModal
        key={`${activeId}-${modalKey}`}
        reportId={activeId}
        onClose={() => setActiveId(null)}
        onChanged={() => {
          setModalKey((k) => k + 1)
          refreshList()
        }}
      />
    </>
  )
}

function AdminReportRow({ report, onClick }) {
  const dateStr = formatRelativeDate(report.created_at)
  const sClass = report.status || 'submitted'
  const sLabel = statusLabel(report.status)
  const severity = (report.severity || 'medium').toLowerCase()
  const citizenName = `${report.citizen_first_name || ''} ${
    report.citizen_last_name || ''
  }`.trim()

  return (
    <div className="report-row" onClick={onClick} style={{ cursor: 'pointer' }}>
      {report.photo ? (
        <img
          src={report.photo}
          alt={report.title}
          className="report-row-thumb"
        />
      ) : (
        <div className="report-row-thumb"></div>
      )}
      <div className="report-row-content">
        <div className="report-row-top">
          <h3 className="report-row-title">{report.title}</h3>
          <span className={`status-badge ${sClass}`}>{sLabel}</span>
        </div>
        <div className="report-row-meta">
          <span className="report-row-meta-item">
            {report.category_icon || ''} {report.category_name}
          </span>
          <span>•</span>
          <span className={`severity-dot ${severity}`}>
            {capitalize(severity)}
          </span>
          <span>•</span>
          <span>👤 {citizenName}</span>
          <span>•</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </div>
  )
}

function AdminReportModal({ reportId, onClose, onChanged }) {
  const isOpen = reportId !== null
  const showToast = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [responseMsg, setResponseMsg] = useState('')
  const [sending, setSending] = useState(false)

  async function load() {
    setData(null)
    setError(false)
    try {
      const { data: res } = await api.get(`/admin/reports/${reportId}`)
      setData(res)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    load()
    setResponseMsg('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reportId])

  async function updateStatus(newStatus) {
    try {
      await api.patch(`/admin/reports/${reportId}/status`, {
        status: newStatus,
      })
      await load()
      onChanged()
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Couldn't update status",
        true,
      )
    }
  }

  async function sendResponse() {
    const message = responseMsg.trim()
    if (!message) {
      showToast('Please write a response message', true)
      return
    }
    setSending(true)
    try {
      await api.post(`/admin/reports/${reportId}/responses`, { message })
      setResponseMsg('')
      await load()
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Couldn't send response",
        true,
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {!data && !error && (
        <div className="loading-state" style={{ padding: '80px 20px' }}>
          Loading report…
        </div>
      )}
      {error && (
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          Couldn't load report.
        </div>
      )}
      {data && data.report && (
        <AdminModalBody
          report={data.report}
          responses={data.responses || []}
          onUpdateStatus={updateStatus}
          responseMsg={responseMsg}
          setResponseMsg={setResponseMsg}
          onSendResponse={sendResponse}
          sending={sending}
        />
      )}
    </Modal>
  )
}

function AdminModalBody({
  report,
  responses,
  onUpdateStatus,
  responseMsg,
  setResponseMsg,
  onSendResponse,
  sending,
}) {
  const dateStr = formatDate(report.created_at)
  const sClass = report.status || 'submitted'
  const sLabel = statusLabel(report.status)
  const severity = (report.severity || 'medium').toLowerCase()
  const citizenName = `${report.citizen_first_name || ''} ${
    report.citizen_last_name || ''
  }`.trim()
  const lat = parseFloat(report.latitude)
  const lng = parseFloat(report.longitude)

  return (
    <>
      {report.photo ? (
        <img
          src={report.photo}
          alt={report.title}
          className="news-modal-image"
        />
      ) : (
        <div className="news-modal-image-placeholder">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
          </svg>
        </div>
      )}

      <div className="news-modal-body">
        <div className="news-modal-meta">
          <span className={`status-badge ${sClass}`}>{sLabel}</span>
          <span className={`severity-dot ${severity}`}>
            {capitalize(severity)} severity
          </span>
        </div>
        <h1 className="news-modal-title">{report.title}</h1>
        <p className="news-modal-info" style={{ marginBottom: 16 }}>
          {report.category_icon || ''} {report.category_name} • {dateStr}
        </p>

        <div className="admin-citizen-card">
          <div className="admin-citizen-avatar">
            {(citizenName || '?').charAt(0).toUpperCase()}
          </div>
          <div className="admin-citizen-info">
            <p className="admin-citizen-name">{citizenName}</p>
            <p className="admin-citizen-contact">
              📧 {report.citizen_email}
            </p>
            {report.citizen_phone && (
              <p className="admin-citizen-contact">
                📞 {report.citizen_phone}
              </p>
            )}
          </div>
        </div>

        <div className="news-modal-content">{report.description}</div>

        <div style={{ margin: '18px 0' }}>
          <p className="report-label">Location</p>
          <div
            style={{
              height: 200,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <MapContainer
              center={[lat, lng]}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
                maxZoom={19}
              />
              <Marker position={[lat, lng]}>
                <Popup>{report.title}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        <div className="admin-action-block">
          <p className="report-label">Update status</p>
          <div className="admin-status-buttons">
            {[
              { key: 'submitted', label: '📨 Submitted' },
              { key: 'review', label: '👀 Review' },
              { key: 'progress', label: '🛠️ In progress' },
              { key: 'resolved', label: '✅ Resolved' },
            ].map((s) => (
              <button
                key={s.key}
                className={`admin-status-btn${
                  report.status === s.key ? ' active' : ''
                }`}
                onClick={() => onUpdateStatus(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-action-block">
          <p className="report-label">Responses ({responses.length})</p>
          <div>
            {responses.length === 0 ? (
              <div className="empty-state" style={{ padding: '18px 12px' }}>
                No responses yet — be the first to reply.
              </div>
            ) : (
              responses.map((r) => (
                <ResponseRow key={r.id} response={r} />
              ))
            )}
          </div>

          <div className="admin-response-form">
            <textarea
              className="report-textarea"
              placeholder="Write a response to the citizen…"
              rows={3}
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
            />
            <button
              className="admin-response-submit"
              onClick={onSendResponse}
              disabled={sending}
            >
              {sending ? 'Sending…' : 'Send response'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ResponseRow({ response }) {
  const initial = (response.first_name || 'A').charAt(0).toUpperCase()
  const fullName = `${response.first_name || ''} ${
    response.last_name || ''
  }`.trim()
  const dateStr = formatRelativeDate(response.created_at)
  const position = response.position ? ` • ${response.position}` : ''

  return (
    <div className="comment" style={{ marginTop: 10 }}>
      <div className="comment-avatar" style={{ background: 'var(--color-red)' }}>
        {initial}
      </div>
      <div className="comment-bubble">
        <div className="comment-meta">
          <span className="comment-author">
            {fullName}
            {position}
          </span>
          <span className="comment-date">{dateStr}</span>
        </div>
        <p className="comment-content">{response.message}</p>
      </div>
    </div>
  )
}
