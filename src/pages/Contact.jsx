import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import api from '../api/client.js'
import Skyline from '../components/Skyline.jsx'
import BackLink from '../components/BackLink.jsx'

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export default function Contact() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get('/contact')
      .then(({ data: res }) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const info = data?.info
  const hours = data?.hours || []
  const departments = data?.departments || []
  const emergency = data?.emergency || []

  return (
    <>
      <Skyline />
      <BackLink to="/home" label="Back to home" />

      <div className="page-header">
        <span className="page-header-eyebrow">● Get in touch</span>
        <h1 className="page-title">{info?.name || 'Contact & Info'}</h1>
        <p className="page-subtitle">
          {info?.about ||
            (data
              ? 'Get in touch with the municipality.'
              : 'Loading municipality information…')}
        </p>
      </div>

      <div className="emergency-banner">
        <p className="emergency-title">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Emergency contacts
        </p>
        <div className="emergency-grid">
          {!data && !error && (
            <div
              className="loading-state"
              style={{ gridColumn: '1 / -1', padding: 14 }}
            >
              Loading…
            </div>
          )}
          {data && emergency.length === 0 && (
            <p
              style={{ color: 'rgba(255,255,255,0.5)', padding: 8 }}
            >
              No emergency contacts listed.
            </p>
          )}
          {emergency.map((e) => (
            <a key={e.id} href={`tel:${e.number}`} className="emergency-item">
              <span className="emergency-icon">{e.icon || '🚨'}</span>
              <div className="emergency-text">
                <p className="emergency-label">{e.name}</p>
                <p className="emergency-number">{e.number}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-card-header">
            <div className="contact-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h3 className="contact-card-title">Contact Information</h3>
          </div>
          <div className="contact-card-content">
            {!data && !error && (
              <div className="loading-state" style={{ padding: '14px 0' }}>
                Loading…
              </div>
            )}
            {data && info && <ContactRows info={info} />}
            {data && !info && (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                No contact info available.
              </p>
            )}
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-card-header">
            <div className="contact-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="contact-card-title">Working Hours</h3>
          </div>
          <div>
            {!data && !error && (
              <div className="loading-state" style={{ padding: '14px 0' }}>
                Loading…
              </div>
            )}
            {data && hours.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                No hours listed.
              </p>
            )}
            {data && hours.length > 0 && (
              <table className="hours-table">
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.day_of_week}>
                      <td>{DAY_LABELS[h.day_of_week] || h.day_of_week}</td>
                      <td>
                        {h.is_closed ? (
                          <span className="closed">Closed</span>
                        ) : (
                          `${h.open_time || '—'} – ${h.close_time || '—'}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div
        className="contact-card"
        style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}
      >
        <div className="contact-card-header">
          <div className="contact-card-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
            </svg>
          </div>
          <h3 className="contact-card-title">Departments</h3>
        </div>
        <div className="dept-list">
          {!data && !error && (
            <div className="loading-state" style={{ padding: '14px 0' }}>
              Loading…
            </div>
          )}
          {data && departments.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              No departments listed.
            </p>
          )}
          {departments.map((d) => (
            <div key={d.id} className="dept-item">
              <h4 className="dept-name">{d.name}</h4>
              {d.description && <p className="dept-info">{d.description}</p>}
              {(d.phone || d.email) && (
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    gap: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  {d.phone && (
                    <a
                      href={`tel:${d.phone}`}
                      style={{
                        fontSize: 11,
                        color: 'var(--color-red)',
                        textDecoration: 'none',
                      }}
                    >
                      📞 {d.phone}
                    </a>
                  )}
                  {d.email && (
                    <a
                      href={`mailto:${d.email}`}
                      style={{
                        fontSize: 11,
                        color: 'var(--color-red)',
                        textDecoration: 'none',
                      }}
                    >
                      ✉ {d.email}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className="contact-card"
        style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}
      >
        <div className="contact-card-header">
          <div className="contact-card-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className="contact-card-title">Find us</h3>
        </div>
        <div id="contactMap" style={{ height: 300 }}>
          {info && info.latitude && info.longitude && (
            <ContactMap info={info} />
          )}
        </div>
      </div>

      {error && (
        <div className="empty-state">Couldn't load contact info.</div>
      )}
    </>
  )
}

function ContactRows({ info }) {
  return (
    <>
      {info.address && (
        <div className="contact-row">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{info.address}</span>
        </div>
      )}
      {info.main_phone && (
        <div className="contact-row">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <a href={`tel:${info.main_phone}`}>{info.main_phone}</a>
        </div>
      )}
      {info.main_email && (
        <div className="contact-row">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <a href={`mailto:${info.main_email}`}>{info.main_email}</a>
        </div>
      )}
      {info.website && (
        <div className="contact-row">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <a href={info.website} target="_blank" rel="noopener noreferrer">
            {info.website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
    </>
  )
}

function ContactMap({ info }) {
  const lat = parseFloat(info.latitude)
  const lng = parseFloat(info.longitude)
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
        maxZoom={19}
      />
      <Marker position={[lat, lng]}>
        <Popup>
          <strong>{info.name}</strong>
          <br />
          {info.address || ''}
        </Popup>
      </Marker>
    </MapContainer>
  )
}
