import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet'
import api from '../api/client.js'
import Skyline from '../components/Skyline.jsx'
import BackLink from '../components/BackLink.jsx'

const DEFAULT_CENTER = [33.9817, 35.6178] // Jounieh, Lebanon

export default function SubmitReport() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [position, setPosition] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [locating, setLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState(
    'Click the map or use GPS',
  )
  const mapRef = useRef(null)
  const photoInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/reports/categories')
      .then(({ data }) => {
        if (!cancelled) setCategories(data.categories || [])
      })
      .catch(() => {
        /* swallow — dropdown shows fallback */
      })
    return () => {
      cancelled = true
    }
  }, [])

  function showAlert(message, type) {
    setAlert({ message, type })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = ''
      showAlert('Photo too large (max 5 MB)', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
    setPhoto(file)
  }

  function resetPhoto(e) {
    e?.stopPropagation()
    e?.preventDefault()
    setPhoto(null)
    setPhotoPreview('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  function onLocateMe() {
    if (!navigator.geolocation) {
      setLocationStatus('GPS not supported by your browser')
      return
    }
    setLocationStatus('Getting your location…')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const next = [latitude, longitude]
        setPosition(next)
        setLocationStatus(
          `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        )
        setLocating(false)
        if (mapRef.current) mapRef.current.setView(next, 17)
      },
      (error) => {
        let msg = 'Could not get your location'
        if (error.code === 1) msg = 'Location permission denied'
        if (error.code === 2) msg = 'Location unavailable'
        if (error.code === 3) msg = 'Location request timed out'
        setLocationStatus(msg)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function onSubmit(e) {
    e.preventDefault()
    setAlert({ type: '', message: '' })

    if (!title.trim() || !categoryId || !description.trim()) {
      return showAlert('Please fill in all required fields', 'error')
    }
    if (!photo) {
      return showAlert('Please upload a photo', 'error')
    }
    if (!position) {
      return showAlert('Please set the location on the map', 'error')
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('category_id', categoryId)
    formData.append('description', description.trim())
    formData.append('latitude', position[0])
    formData.append('longitude', position[1])
    formData.append('severity', severity)
    formData.append('photo', photo)

    setSubmitting(true)
    try {
      await api.post('/reports', formData)
      showAlert('Report submitted successfully! Redirecting…', 'success')
      setTimeout(() => navigate('/my-reports'), 1500)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Something went wrong. Please try again.'
      showAlert(msg, 'error')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Skyline />
      <BackLink to="/home" label="Back to home" />

      <div className="page-header">
        <span className="page-header-eyebrow">● New report</span>
        <h1 className="page-title">Report an issue</h1>
        <p className="page-subtitle">
          Help your community by reporting problems you see.
        </p>
      </div>

      <div className="report-form-container">
        <div
          className={`form-alert ${alert.type}${
            alert.message ? ' show' : ''
          }`}
        >
          {alert.message}
        </div>

        <form className="report-form" noValidate onSubmit={onSubmit}>
          <div className="report-form-section">
            <label htmlFor="title" className="report-label">
              Title <span className="required-mark">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="report-input"
              placeholder="e.g., Large pothole on Main Street"
              maxLength={100}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="report-help-text">
              Short headline for your report (max 100 chars)
            </p>
          </div>

          <div className="report-form-section">
            <label htmlFor="category_id" className="report-label">
              Category <span className="required-mark">*</span>
            </label>
            <select
              id="category_id"
              className="report-select"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">
                {categories.length === 0
                  ? 'Loading categories…'
                  : 'Select a category…'}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || ''} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="report-form-section">
            <label htmlFor="description" className="report-label">
              Description <span className="required-mark">*</span>
            </label>
            <textarea
              id="description"
              className="report-textarea"
              placeholder="Describe the issue in detail…"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="report-form-section">
            <label className="report-label">
              Photo <span className="required-mark">*</span>
            </label>
            <div
              className={`photo-upload-zone${photoPreview ? ' has-photo' : ''}`}
            >
              <input
                ref={photoInputRef}
                type="file"
                className="photo-upload-input"
                accept="image/*"
                onChange={onPhotoChange}
              />
              <div className="photo-upload-content">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      className="photo-preview"
                      alt="Preview"
                    />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      aria-label="Remove photo"
                      onClick={resetPhoto}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </>
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
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p>
                      <strong>Tap to upload</strong> a photo
                    </p>
                    <p className="report-help-text">
                      JPG, PNG, WEBP — max 5 MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="report-form-section">
            <label className="report-label">Severity</label>
            <div className="severity-group">
              {['low', 'medium', 'high'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`severity-btn${severity === s ? ' active' : ''}`}
                  onClick={() => setSeverity(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="report-form-section">
            <label className="report-label">
              Location <span className="required-mark">*</span>
            </label>
            <div className="location-actions">
              <button
                type="button"
                className="btn-locate"
                disabled={locating}
                onClick={onLocateMe}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Use my location
              </button>
              <span
                className={`location-status${position ? ' set' : ''}`}
              >
                {locationStatus}
              </span>
            </div>
            <div id="reportMap" style={{ height: 320 }}>
              <ReportMap
                position={position}
                onChange={(latlng) => {
                  setPosition([latlng.lat, latlng.lng])
                  setLocationStatus(
                    `📍 ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
                  )
                }}
                mapRefStore={mapRef}
              />
            </div>
          </div>

          <button
            type="submit"
            className="report-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </>
  )
}

function ReportMap({ position, onChange, mapRefStore }) {
  return (
    <MapContainer
      center={position || DEFAULT_CENTER}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      ref={(instance) => {
        if (instance) mapRefStore.current = instance
      }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
        maxZoom={19}
      />
      <ClickHandler onClick={onChange} />
      {position && (
        <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = e.target.getLatLng()
              onChange(ll)
            },
          }}
        />
      )}
    </MapContainer>
  )
}

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng)
    },
  })
  return null
}
