import { useEffect, useState } from 'react'
import api from '../../api/client.js'
import { useToast } from '../../context/ToastContext.jsx'
import Skyline from '../../components/Skyline.jsx'
import BackLink from '../../components/BackLink.jsx'

const API_BASE = '/admin/contact'

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export default function AdminContact() {
  const [tab, setTab] = useState('info')

  return (
    <>
      <Skyline />
      <BackLink to="/admin" label="Back to dashboard" />

      <div className="page-header">
        <span className="page-header-eyebrow">● Manage</span>
        <h1 className="page-title">Contact &amp; Info</h1>
        <p className="page-subtitle">
          Edit municipality information shown to citizens.
        </p>
      </div>

      <div className="tabs">
        {[
          ['info', 'Info'],
          ['hours', 'Hours'],
          ['departments', 'Departments'],
          ['emergency', 'Emergency'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && <InfoTab />}
      {tab === 'hours' && <HoursTab />}
      {tab === 'departments' && <DepartmentsTab />}
      {tab === 'emergency' && <EmergencyTab />}
    </>
  )
}

function InfoTab() {
  const showToast = useToast()
  const [form, setForm] = useState({
    name: '',
    about: '',
    address: '',
    latitude: '',
    longitude: '',
    main_phone: '',
    main_email: '',
    website: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get(`${API_BASE}/info`)
      .then(({ data }) => {
        if (cancelled || !data.info) return
        const info = data.info
        setForm({
          name: info.name || '',
          about: info.about || '',
          address: info.address || '',
          latitude: info.latitude ?? '',
          longitude: info.longitude ?? '',
          main_phone: info.main_phone || '',
          main_email: info.main_email || '',
          website: info.website || '',
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      about: form.about.trim(),
      address: form.address.trim(),
      latitude: parseFloat(form.latitude) || null,
      longitude: parseFloat(form.longitude) || null,
      main_phone: form.main_phone.trim(),
      main_email: form.main_email.trim(),
      website: form.website.trim(),
    }
    try {
      await api.put(`${API_BASE}/info`, payload)
      showToast('Info saved!')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Save failed', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="tab-panel active">
      <div className="admin-contact-section">
        <h3 className="admin-contact-section-title">Municipality Info</h3>

        <form onSubmit={onSubmit}>
          <div className="report-form-section">
            <label className="report-label">
              Name <span className="required-mark">*</span>
            </label>
            <input
              type="text"
              className="report-input"
              placeholder="Jounieh Municipality"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div className="report-form-section">
            <label className="report-label">About</label>
            <textarea
              className="report-textarea"
              placeholder="Brief description of the municipality"
              rows={3}
              value={form.about}
              onChange={(e) => update('about', e.target.value)}
            />
          </div>

          <div className="report-form-section">
            <label className="report-label">Address</label>
            <input
              type="text"
              className="report-input"
              placeholder="Main Street, Jounieh"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </div>

          <div className="admin-form-grid-2">
            <div className="report-form-section">
              <label className="report-label">Latitude</label>
              <input
                type="text"
                className="report-input"
                placeholder="33.9817"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
              />
            </div>
            <div className="report-form-section">
              <label className="report-label">Longitude</label>
              <input
                type="text"
                className="report-input"
                placeholder="35.6178"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-grid-2">
            <div className="report-form-section">
              <label className="report-label">Main Phone</label>
              <input
                type="text"
                className="report-input"
                placeholder="+961 9 123 456"
                value={form.main_phone}
                onChange={(e) => update('main_phone', e.target.value)}
              />
            </div>
            <div className="report-form-section">
              <label className="report-label">Main Email</label>
              <input
                type="text"
                className="report-input"
                placeholder="info@example.gov.lb"
                value={form.main_email}
                onChange={(e) => update('main_email', e.target.value)}
              />
            </div>
          </div>

          <div className="report-form-section">
            <label className="report-label">Website</label>
            <input
              type="text"
              className="report-input"
              placeholder="https://example.gov.lb"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>

          <div className="admin-section-save">
            <button
              type="submit"
              className="btn-save-section"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HoursTab() {
  const showToast = useToast()
  const [hours, setHours] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get(`${API_BASE}/hours`)
      .then(({ data }) => {
        if (cancelled) return
        const incoming = data.hours || []
        // Ensure every day is represented in display order
        const map = new Map(incoming.map((h) => [h.day_of_week, h]))
        const ordered = DAYS.map(
          (d) =>
            map.get(d) || {
              day_of_week: d,
              open_time: '',
              close_time: '',
              is_closed: false,
            },
        )
        setHours(ordered)
      })
      .catch(() => setHours('error'))
    return () => {
      cancelled = true
    }
  }, [])

  function updateRow(idx, field, value) {
    setHours((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    )
  }

  async function onSave() {
    setSaving(true)
    const payload = {
      hours: hours.map((h) => ({
        day_of_week: h.day_of_week,
        open_time: (h.open_time || '').trim(),
        close_time: (h.close_time || '').trim(),
        is_closed: !!h.is_closed,
      })),
    }
    try {
      await api.put(`${API_BASE}/hours`, payload)
      showToast('Hours saved!')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Save failed', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="tab-panel active">
      <div className="admin-contact-section">
        <h3 className="admin-contact-section-title">Working Hours</h3>
        {hours === null && <div className="loading-state">Loading…</div>}
        {hours === 'error' && (
          <div className="empty-state">Couldn't load hours.</div>
        )}
        {Array.isArray(hours) && (
          <>
            <div>
              {hours.map((h, idx) => (
                <div key={h.day_of_week} className="admin-hours-row">
                  <div className="admin-hours-day">{h.day_of_week}</div>
                  <input
                    type="text"
                    className="report-input hours-open"
                    placeholder="8:00 AM"
                    value={h.open_time || ''}
                    disabled={!!h.is_closed}
                    onChange={(e) =>
                      updateRow(idx, 'open_time', e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="report-input hours-close"
                    placeholder="4:00 PM"
                    value={h.close_time || ''}
                    disabled={!!h.is_closed}
                    onChange={(e) =>
                      updateRow(idx, 'close_time', e.target.value)
                    }
                  />
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={!!h.is_closed}
                      onChange={(e) =>
                        updateRow(idx, 'is_closed', e.target.checked)
                      }
                    />
                    Closed
                  </label>
                </div>
              ))}
            </div>
            <div className="admin-section-save">
              <button
                type="button"
                className="btn-save-section"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save hours'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DepartmentsTab() {
  const showToast = useToast()
  const [items, setItems] = useState(null)

  async function load() {
    setItems(null)
    try {
      const { data } = await api.get(`${API_BASE}/departments`)
      setItems(data.departments || [])
    } catch {
      setItems('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  function addNew() {
    setItems((current) => [
      {
        _new: true,
        _key: `new-${Date.now()}`,
        name: '',
        description: '',
        phone: '',
        email: '',
        sort_order: 0,
      },
      ...(Array.isArray(current) ? current : []),
    ])
  }

  function updateField(key, field, value) {
    setItems((rows) =>
      rows.map((r) =>
        (r.id ?? r._key) === key ? { ...r, [field]: value } : r,
      ),
    )
  }

  function removeNew(key) {
    setItems((rows) => rows.filter((r) => (r.id ?? r._key) !== key))
  }

  async function save(item) {
    if (!item.name?.trim()) {
      showToast('Department name is required', true)
      return
    }
    const payload = {
      name: item.name.trim(),
      description: (item.description || '').trim(),
      phone: (item.phone || '').trim(),
      email: (item.email || '').trim(),
      sort_order: parseInt(item.sort_order) || 0,
    }
    try {
      if (item._new) {
        await api.post(`${API_BASE}/departments`, payload)
      } else {
        await api.put(`${API_BASE}/departments/${item.id}`, payload)
      }
      showToast('Department saved!')
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Save failed', true)
    }
  }

  async function remove(item) {
    if (!window.confirm('Delete this department?')) return
    try {
      await api.delete(`${API_BASE}/departments/${item.id}`)
      showToast('Department deleted')
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Delete failed', true)
    }
  }

  return (
    <div className="tab-panel active">
      <div className="admin-contact-section">
        <h3 className="admin-contact-section-title">
          Departments
          <button type="button" className="btn-add-item" onClick={addNew}>
            + Add department
          </button>
        </h3>
        {items === null && <div className="loading-state">Loading…</div>}
        {items === 'error' && (
          <div className="empty-state">Couldn't load departments.</div>
        )}
        {Array.isArray(items) && items.length === 0 && (
          <div className="empty-state" style={{ padding: 18 }}>
            No departments. Click + Add to create one.
          </div>
        )}
        {Array.isArray(items) &&
          items.map((d) => {
            const key = d.id ?? d._key
            return (
              <div key={key} className="admin-item-row">
                <div className="admin-item-row-header">
                  <p className="admin-item-row-title">
                    Department {d.id ? '#' + d.id : '(new)'}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-add-item"
                      onClick={() => save(d)}
                    >
                      Save
                    </button>
                    {d.id ? (
                      <button
                        type="button"
                        className="btn-delete-small"
                        onClick={() => remove(d)}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-delete-small"
                        onClick={() => removeNew(key)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="report-form-section">
                  <label className="report-label">
                    Name <span className="required-mark">*</span>
                  </label>
                  <input
                    type="text"
                    className="report-input"
                    placeholder="Department name"
                    value={d.name || ''}
                    onChange={(e) =>
                      updateField(key, 'name', e.target.value)
                    }
                  />
                </div>
                <div className="report-form-section">
                  <label className="report-label">Description</label>
                  <textarea
                    className="report-textarea"
                    rows={2}
                    placeholder="What this department handles"
                    value={d.description || ''}
                    onChange={(e) =>
                      updateField(key, 'description', e.target.value)
                    }
                  />
                </div>
                <div className="admin-form-grid-2">
                  <div className="report-form-section">
                    <label className="report-label">Phone</label>
                    <input
                      type="text"
                      className="report-input"
                      placeholder="+961 9 123 456"
                      value={d.phone || ''}
                      onChange={(e) =>
                        updateField(key, 'phone', e.target.value)
                      }
                    />
                  </div>
                  <div className="report-form-section">
                    <label className="report-label">Email</label>
                    <input
                      type="text"
                      className="report-input"
                      placeholder="dept@example.gov.lb"
                      value={d.email || ''}
                      onChange={(e) =>
                        updateField(key, 'email', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div
                  className="report-form-section"
                  style={{ maxWidth: 100 }}
                >
                  <label className="report-label">Order</label>
                  <input
                    type="number"
                    className="report-input"
                    value={d.sort_order ?? 0}
                    onChange={(e) =>
                      updateField(key, 'sort_order', e.target.value)
                    }
                  />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

function EmergencyTab() {
  const showToast = useToast()
  const [items, setItems] = useState(null)

  async function load() {
    setItems(null)
    try {
      const { data } = await api.get(`${API_BASE}/emergency`)
      setItems(data.emergency || [])
    } catch {
      setItems('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  function addNew() {
    setItems((current) => [
      {
        _new: true,
        _key: `new-${Date.now()}`,
        icon: '🚨',
        name: '',
        number: '',
        sort_order: 0,
      },
      ...(Array.isArray(current) ? current : []),
    ])
  }

  function updateField(key, field, value) {
    setItems((rows) =>
      rows.map((r) =>
        (r.id ?? r._key) === key ? { ...r, [field]: value } : r,
      ),
    )
  }

  function removeNew(key) {
    setItems((rows) => rows.filter((r) => (r.id ?? r._key) !== key))
  }

  async function save(item) {
    if (!item.name?.trim() || !item.number?.trim()) {
      showToast('Name and number are required', true)
      return
    }
    const payload = {
      name: item.name.trim(),
      number: item.number.trim(),
      icon: (item.icon || '').trim() || '🚨',
      sort_order: parseInt(item.sort_order) || 0,
    }
    try {
      if (item._new) {
        await api.post(`${API_BASE}/emergency`, payload)
      } else {
        await api.put(`${API_BASE}/emergency/${item.id}`, payload)
      }
      showToast('Saved!')
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Save failed', true)
    }
  }

  async function remove(item) {
    if (!window.confirm('Delete this emergency contact?')) return
    try {
      await api.delete(`${API_BASE}/emergency/${item.id}`)
      showToast('Deleted')
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Delete failed', true)
    }
  }

  return (
    <div className="tab-panel active">
      <div className="admin-contact-section">
        <h3 className="admin-contact-section-title">
          Emergency Contacts
          <button type="button" className="btn-add-item" onClick={addNew}>
            + Add contact
          </button>
        </h3>
        {items === null && <div className="loading-state">Loading…</div>}
        {items === 'error' && (
          <div className="empty-state">
            Couldn't load emergency contacts.
          </div>
        )}
        {Array.isArray(items) && items.length === 0 && (
          <div className="empty-state" style={{ padding: 18 }}>
            No emergency contacts. Click + Add.
          </div>
        )}
        {Array.isArray(items) &&
          items.map((e) => {
            const key = e.id ?? e._key
            return (
              <div key={key} className="admin-item-row">
                <div className="admin-item-row-header">
                  <p className="admin-item-row-title">
                    Contact {e.id ? '#' + e.id : '(new)'}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-add-item"
                      onClick={() => save(e)}
                    >
                      Save
                    </button>
                    {e.id ? (
                      <button
                        type="button"
                        className="btn-delete-small"
                        onClick={() => remove(e)}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-delete-small"
                        onClick={() => removeNew(key)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="admin-form-grid-3">
                  <div className="report-form-section">
                    <label className="report-label">Icon</label>
                    <input
                      type="text"
                      className="report-input"
                      placeholder="🚨"
                      value={e.icon ?? ''}
                      onChange={(ev) =>
                        updateField(key, 'icon', ev.target.value)
                      }
                    />
                  </div>
                  <div className="report-form-section">
                    <label className="report-label">
                      Name <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="report-input"
                      placeholder="Fire, Police…"
                      value={e.name || ''}
                      onChange={(ev) =>
                        updateField(key, 'name', ev.target.value)
                      }
                    />
                  </div>
                  <div className="report-form-section">
                    <label className="report-label">
                      Number <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="report-input"
                      placeholder="112"
                      value={e.number || ''}
                      onChange={(ev) =>
                        updateField(key, 'number', ev.target.value)
                      }
                    />
                  </div>
                  <div className="report-form-section">
                    <label className="report-label">Order</label>
                    <input
                      type="number"
                      className="report-input"
                      value={e.sort_order ?? 0}
                      onChange={(ev) =>
                        updateField(key, 'sort_order', ev.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

