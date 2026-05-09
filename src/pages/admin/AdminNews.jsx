import { useEffect, useRef, useState } from 'react'
import api from '../../api/client.js'
import { formatRelativeDate, truncate } from '../../utils/format.js'
import Skyline from '../../components/Skyline.jsx'
import BackLink from '../../components/BackLink.jsx'
import Modal from '../../components/Modal.jsx'

function stripHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export default function AdminNews() {
  const [search, setSearch] = useState('')
  const [news, setNews] = useState(null)
  const [editorState, setEditorState] = useState({ open: false, articleId: null })

  async function loadNews() {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    setNews(null)
    try {
      const { data } = await api.get(`/admin/news?${params.toString()}`)
      setNews(data.news)
    } catch {
      setNews('error')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNews()
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <>
      <Skyline />
      <BackLink to="/admin" label="Back to dashboard" />

      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span className="page-header-eyebrow">● Manage</span>
          <h1 className="page-title">News &amp; Announcements</h1>
          <p className="page-subtitle">Publish updates for your citizens.</p>
        </div>
        <button
          className="report-submit-btn"
          style={{ width: 'auto', padding: '11px 18px' }}
          onClick={() => setEditorState({ open: true, articleId: null })}
        >
          + New article
        </button>
      </div>

      <div
        className="reports-filters"
        style={{ gridTemplateColumns: '1fr' }}
      >
        <input
          type="text"
          className="filter-input"
          placeholder="🔍 Search news by title or content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="reports-list">
        {news === null && (
          <div className="loading-state">Loading news…</div>
        )}
        {news === 'error' && (
          <div className="empty-state">Couldn't load news.</div>
        )}
        {Array.isArray(news) && news.length === 0 && (
          <div className="empty-state">
            {search
              ? 'No articles match your search.'
              : 'No news articles yet. Click "+ New article" to create one.'}
          </div>
        )}
        {Array.isArray(news) &&
          news.map((a) => (
            <AdminNewsRow
              key={a.id}
              article={a}
              onClick={() =>
                setEditorState({ open: true, articleId: a.id })
              }
            />
          ))}
      </div>

      <NewsEditorModal
        key={editorState.articleId ?? 'new'}
        isOpen={editorState.open}
        articleId={editorState.articleId}
        onClose={() => setEditorState({ open: false, articleId: null })}
        onSaved={async () => {
          setEditorState({ open: false, articleId: null })
          await loadNews()
        }}
      />
    </>
  )
}

function AdminNewsRow({ article, onClick }) {
  const dateStr = formatRelativeDate(article.created_at)
  const excerpt =
    article.excerpt ||
    truncate(stripHtml(article.content || ''), 120)

  return (
    <div className="report-row" onClick={onClick} style={{ cursor: 'pointer' }}>
      {article.image ? (
        <img
          src={article.image}
          alt={article.title}
          className="report-row-thumb"
        />
      ) : (
        <div className="report-row-thumb"></div>
      )}
      <div className="report-row-content">
        <div className="report-row-top">
          <h3 className="report-row-title">{article.title}</h3>
          {article.category && (
            <span className="status-badge submitted">
              {article.category}
            </span>
          )}
        </div>
        <div className="report-row-meta">
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {excerpt}
          </span>
        </div>
        <div className="report-row-meta" style={{ marginTop: 6 }}>
          <span>{dateStr}</span>
        </div>
      </div>
    </div>
  )
}

function NewsEditorModal({ isOpen, articleId, onClose, onSaved }) {
  const isEdit = !!articleId
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('') // data URL or existing URL
  const [hadExistingImage, setHadExistingImage] = useState(false)
  const [removeExisting, setRemoveExisting] = useState(false)
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setAlert({ type: '', message: '' })
    setImageFile(null)
    setImagePreview('')
    setHadExistingImage(false)
    setRemoveExisting(false)
    if (fileRef.current) fileRef.current.value = ''

    if (!isEdit) {
      setForm({ title: '', excerpt: '', content: '', category: '' })
      return
    }

    let cancelled = false
    api
      .get(`/admin/news/${articleId}`)
      .then(({ data }) => {
        if (cancelled) return
        const a = data.article
        setForm({
          title: a.title || '',
          excerpt: a.excerpt || '',
          content: a.content || '',
          category: a.category || '',
        })
        if (a.image) {
          setImagePreview(a.image)
          setHadExistingImage(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAlert({ type: 'error', message: "Couldn't load article" })
        }
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, articleId, isEdit])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function onImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = ''
      setAlert({ type: 'error', message: 'Image too large (max 5 MB)' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    setImageFile(file)
    setRemoveExisting(false)
  }

  function onImageRemove(e) {
    e.stopPropagation()
    e.preventDefault()
    setImageFile(null)
    setImagePreview('')
    if (fileRef.current) fileRef.current.value = ''
    if (hadExistingImage) setRemoveExisting(true)
  }

  async function onSave(e) {
    e.preventDefault()
    setAlert({ type: '', message: '' })

    const title = form.title.trim()
    const content = form.content.trim()
    if (!title || !content) {
      return setAlert({
        type: 'error',
        message: 'Title and content are required',
      })
    }

    setSaving(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('excerpt', form.excerpt.trim())
    formData.append('category', form.category.trim())
    if (imageFile) formData.append('image', imageFile)
    if (isEdit) formData.append('remove_image', removeExisting ? 'true' : 'false')

    try {
      if (isEdit) {
        await api.put(`/admin/news/${articleId}`, formData)
      } else {
        await api.post('/admin/news', formData)
      }
      setAlert({
        type: 'success',
        message: isEdit ? 'Article updated!' : 'Article created!',
      })
      setTimeout(() => onSaved(), 700)
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Save failed',
      })
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!articleId) return
    if (!window.confirm('Delete this article? This cannot be undone.')) return
    try {
      await api.delete(`/admin/news/${articleId}`)
      onSaved()
    } catch (err) {
      window.alert(
        "Couldn't delete: " + (err?.response?.data?.message || err.message),
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="news-modal-body">
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'white',
            marginBottom: 18,
          }}
        >
          {isEdit ? 'Edit article' : 'New article'}
        </h2>

        <div
          className={`form-alert ${alert.type}${
            alert.message ? ' show' : ''
          }`}
        >
          {alert.message}
        </div>

        <form onSubmit={onSave} noValidate>
          <div className="report-form-section">
            <label className="report-label">
              Title <span className="required-mark">*</span>
            </label>
            <input
              type="text"
              className="report-input"
              placeholder="Article title"
              maxLength={200}
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>

          <div className="report-form-section">
            <label className="report-label">Excerpt (short summary)</label>
            <input
              type="text"
              className="report-input"
              placeholder="One-sentence summary"
              maxLength={300}
              value={form.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
            />
          </div>

          <div className="report-form-section">
            <label className="report-label">
              Content <span className="required-mark">*</span>
            </label>
            <textarea
              className="report-textarea"
              placeholder="Full article content…"
              rows={8}
              required
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
            />
          </div>

          <div className="report-form-section">
            <label className="report-label">Image (optional)</label>
            <div
              className={`photo-upload-zone${
                imagePreview ? ' has-photo' : ''
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                className="photo-upload-input"
                accept="image/*"
                onChange={onImageChange}
              />
              <div className="photo-upload-content">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      className="photo-preview"
                      alt="Preview"
                    />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      aria-label="Remove image"
                      onClick={onImageRemove}
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
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p>
                      <strong>Tap to upload</strong> an image
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
            <label className="report-label">Category (optional)</label>
            <input
              type="text"
              className="report-input"
              placeholder="Announcement, Event, Update…"
              maxLength={50}
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              type="submit"
              className="report-submit-btn"
              style={{ flex: 1 }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save article'}
            </button>
            {isEdit && (
              <button
                type="button"
                className="btn-comment"
                onClick={onDelete}
                style={{
                  background: 'rgba(220,38,38,0.15)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(220,38,38,0.3)',
                }}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  )
}
