import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import api from '../api/client.js'
import {
  formatDate,
  formatRelativeDate,
  capitalize,
  statusLabel,
} from '../utils/format.js'
import Skyline from '../components/Skyline.jsx'
import BackLink from '../components/BackLink.jsx'
import Modal from '../components/Modal.jsx'

const DEFAULT_CENTER = [33.9817, 35.6178]

export default function MyReports() {
  const [tab, setTab] = useState('list')
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category_id: '',
  })
  const [reports, setReports] = useState(null)
  const [mapFilters, setMapFilters] = useState({
    status: '',
    category_id: '',
  })
  const [publicReports, setPublicReports] = useState([])
  const [activeReport, setActiveReport] = useState(null) // { id, isPublic }

  useEffect(() => {
    let cancelled = false
    api
      .get('/reports/categories')
      .then(({ data }) => {
        if (!cancelled) setCategories(data.categories || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Load list with debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.category_id)
        params.append('category_id', filters.category_id)

      setReports(null)
      api
        .get(`/reports/my?${params.toString()}`)
        .then(({ data }) => setReports(data.reports))
        .catch(() => setReports('error'))
    }, 350)
    return () => clearTimeout(timer)
  }, [filters])

  // Load public map markers when tab=map or filters change
  useEffect(() => {
    if (tab !== 'map') return
    const params = new URLSearchParams()
    if (mapFilters.status) params.append('status', mapFilters.status)
    if (mapFilters.category_id)
      params.append('category_id', mapFilters.category_id)
    api
      .get(`/reports/public?${params.toString()}`)
      .then(({ data }) => setPublicReports(data.reports || []))
      .catch(() => setPublicReports([]))
  }, [tab, mapFilters])

  function handleReportDeleted() {
    // Refresh list + sidebar stats (sidebar refetches on mount, but this
    // page just refetches list; user can navigate to home to see fresh stats)
    setActiveReport(null)
    setFilters((f) => ({ ...f })) // re-trigger
    if (tab === 'map') setMapFilters((f) => ({ ...f }))
  }

  const hasFilters =
    filters.search || filters.status || filters.category_id

  return (
    <>
      <Skyline />
      <BackLink to="/home" label="Back to home" />

      <div className="page-header">
        <span className="page-header-eyebrow">● Reports &amp; Map</span>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">
          Track your reports or explore what's happening in the city.
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn${tab === 'list' ? ' active' : ''}`}
          onClick={() => setTab('list')}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          My Reports
        </button>
        <button
          className={`tab-btn${tab === 'map' ? ' active' : ''}`}
          onClick={() => setTab('map')}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          Public Map
        </button>
      </div>

      {tab === 'list' && (
        <div className="tab-panel active">
          <div className="reports-filters">
            <input
              type="text"
              className="filter-input"
              placeholder="🔍 Search by title or description…"
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
              <div className="loading-state">Loading your reports…</div>
            )}
            {reports === 'error' && (
              <div className="empty-state">
                Couldn't load reports. Please try again.
              </div>
            )}
            {Array.isArray(reports) && reports.length === 0 && (
              hasFilters ? (
                <div className="empty-state">
                  No reports match your filters.
                </div>
              ) : (
                <div className="reports-empty">
                  <svg
                    className="reports-empty-icon"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <h3 className="reports-empty-title">No reports yet</h3>
                  <p className="reports-empty-text">
                    Submit your first report to help your community.
                  </p>
                  <Link to="/submit-report" className="btn-cta-empty">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Submit a report
                  </Link>
                </div>
              )
            )}
            {Array.isArray(reports) &&
              reports.map((r) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  onClick={() =>
                    setActiveReport({ id: r.id, isPublic: false })
                  }
                />
              ))}
          </div>
        </div>
      )}

      {tab === 'map' && (
        <div className="tab-panel active">
          <div className="reports-filters">
            <select
              className="filter-select"
              value={mapFilters.status}
              onChange={(e) =>
                setMapFilters((f) => ({ ...f, status: e.target.value }))
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
              value={mapFilters.category_id}
              onChange={(e) =>
                setMapFilters((f) => ({
                  ...f,
                  category_id: e.target.value,
                }))
              }
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || ''} {c.name}
                </option>
              ))}
            </select>
            <div className="map-counter">
              <span>{publicReports.length}</span> reports
            </div>
          </div>

          <div className="map-legend">
            <span className="legend-item">
              <span className="legend-dot legend-submitted"></span>{' '}
              Submitted
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-review"></span> Under review
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-progress"></span> In progress
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-resolved"></span> Resolved
            </span>
          </div>

          <div id="publicMap" style={{ height: 500 }}>
            <PublicMap
              reports={publicReports}
              onMarkerClick={(id) =>
                setActiveReport({ id, isPublic: true })
              }
            />
          </div>
        </div>
      )}

      <Link to="/submit-report" className="new-report-fab" aria-label="New report" title="New report">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>

      <ReportDetailModal
        report={activeReport}
        onClose={() => setActiveReport(null)}
        onDeleted={handleReportDeleted}
      />
    </>
  )
}

function ReportRow({ report, onClick }) {
  const dateStr = formatRelativeDate(report.created_at)
  const sClass = report.status || 'submitted'
  const sLabel = statusLabel(report.status)
  const severity = (report.severity || 'medium').toLowerCase()

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
          <span>{dateStr}</span>
        </div>
      </div>
    </div>
  )
}

function PublicMap({ reports, onMarkerClick }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
        maxZoom={19}
      />
      <FitBounds reports={reports} />
      {reports.map((r) => {
        const sClass = r.status || 'submitted'
        const icon = L.divIcon({
          className: '',
          html: `<div class="public-marker ${sClass}" title="${(r.title || '').replace(/"/g, '&quot;')}"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })
        return (
          <Marker
            key={r.id}
            position={[parseFloat(r.latitude), parseFloat(r.longitude)]}
            icon={icon}
            eventHandlers={{
              click: () => onMarkerClick(r.id),
            }}
          />
        )
      })}
    </MapContainer>
  )
}

function FitBounds({ reports }) {
  const map = useMap()
  useEffect(() => {
    if (!reports || reports.length === 0) return
    const bounds = L.latLngBounds(
      reports.map((r) => [parseFloat(r.latitude), parseFloat(r.longitude)]),
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
  }, [reports, map])
  return null
}

function ReportDetailModal({ report, onClose, onDeleted }) {
  const isOpen = report !== null
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setData(null)
      setError(false)
      return
    }
    let cancelled = false
    setData(null)
    setError(false)
    const url = report.isPublic
      ? `/reports/public/${report.id}`
      : `/reports/${report.id}`
    api
      .get(url)
      .then(({ data: res }) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, report])

  async function handleDelete() {
    if (!data?.report) return
    if (!window.confirm('Delete this report? This cannot be undone.')) return
    try {
      await api.delete(`/reports/${data.report.id}`)
      onDeleted()
    } catch (err) {
      window.alert(
        "Couldn't delete: " +
          (err?.response?.data?.message || err.message),
      )
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
        <ReportDetailBody
          report={data.report}
          responses={data.responses || []}
          isPublic={report.isPublic}
          onDelete={handleDelete}
        />
      )}
    </Modal>
  )
}

function ReportDetailBody({ report, responses, isPublic, onDelete }) {
  const dateStr = formatDate(report.created_at)
  const sClass = report.status || 'submitted'
  const sLabel = statusLabel(report.status)
  const severity = (report.severity || 'medium').toLowerCase()
  const canDelete = !isPublic && report.status === 'submitted'

  const lat = parseFloat(report.latitude)
  const lng = parseFloat(report.longitude)

  const authorLine = useMemo(() => {
    if (isPublic && report.author_first_name) {
      return (
        <p className="news-modal-info" style={{ marginBottom: 16 }}>
          {report.category_icon || ''} {report.category_name} • {dateStr} •
          Reported by {report.author_first_name}{' '}
          {(report.author_last_name || '').charAt(0)}.
        </p>
      )
    }
    return (
      <p className="news-modal-info" style={{ marginBottom: 16 }}>
        {report.category_icon || ''} {report.category_name} • {dateStr}
      </p>
    )
  }, [isPublic, report, dateStr])

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
            <polyline points="21 15 16 10 5 21" />
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
        {authorLine}

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

        <div
          style={{
            margin: '24px 0',
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p className="report-label">Status timeline</p>
          <StatusTimeline status={report.status} />
        </div>

        <div
          style={{
            margin: '24px 0',
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p className="report-label">Responses from municipality</p>
          {responses.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 14px' }}>
              No responses from the municipality yet.
            </div>
          ) : (
            responses.map((r) => <ResponseRow key={r.id} response={r} />)
          )}
        </div>

        {canDelete && (
          <button
            className="btn-comment"
            onClick={onDelete}
            style={{
              background: 'rgba(220,38,38,0.15)',
              color: '#FCA5A5',
              border: '1px solid rgba(220,38,38,0.3)',
              marginTop: 12,
            }}
          >
            Delete report
          </button>
        )}
      </div>
    </>
  )
}

function StatusTimeline({ status }) {
  const steps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'review', label: 'Under review' },
    { key: 'progress', label: 'In progress' },
    { key: 'resolved', label: 'Resolved' },
  ]
  const idx = steps.findIndex((s) => s.key === status)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 8,
      }}
    >
      {steps.map((step, i) => {
        const done = i <= idx
        const current = i === idx
        return (
          <div
            key={step.key}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: done ? 'var(--color-red)' : 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              style={{
                fontSize: 13,
                color: done ? 'var(--color-white)' : 'rgba(255,255,255,0.4)',
                fontWeight: current ? 600 : undefined,
              }}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
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
