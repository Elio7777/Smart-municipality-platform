import { useEffect, useState } from 'react'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate, formatRelativeDate, truncate } from '../utils/format.js'
import Skyline from '../components/Skyline.jsx'
import BackLink from '../components/BackLink.jsx'
import Modal from '../components/Modal.jsx'

export default function News() {
  const [items, setItems] = useState(null) // null = loading
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/news')
      .then(({ data }) => {
        if (!cancelled) setItems(data.news || [])
      })
      .catch(() => {
        if (!cancelled) setItems('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Skyline />
      <BackLink to="/home" label="Back to home" />

      <div className="page-header">
        <span className="page-header-eyebrow">● Stay informed</span>
        <h1 className="page-title">News &amp; Announcements</h1>
        <p className="page-subtitle">Latest from the municipality.</p>
      </div>

      <div className="news-list">
        {items === null && <div className="loading-state">Loading news…</div>}
        {items === 'error' && (
          <div className="empty-state">
            Couldn't load news. Please try again.
          </div>
        )}
        {Array.isArray(items) && items.length === 0 && (
          <div className="empty-state">No news yet. Check back soon!</div>
        )}
        {Array.isArray(items) &&
          items.map((news) => (
            <NewsRow
              key={news.id}
              news={news}
              onClick={() => setActiveId(news.id)}
            />
          ))}
      </div>

      <NewsModal
        newsId={activeId}
        isOpen={activeId !== null}
        onClose={() => setActiveId(null)}
      />
    </>
  )
}

function NewsRow({ news, onClick }) {
  const categoryClass = (news.category || 'update').toLowerCase()
  const dateStr = formatDate(news.created_at)
  const department = news.department || 'Municipality'

  return (
    <button
      type="button"
      className="news-row"
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        padding: 0,
        width: '100%',
      }}
    >
      <div className="news-row-thumb">
        {news.image ? (
          <img src={news.image} alt={news.title} />
        ) : (
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
      <div className="news-row-content">
        <span className={`news-category-badge ${categoryClass}`}>
          {news.category}
        </span>
        <h3 className="news-row-title">{news.title}</h3>
        <p className="news-row-excerpt">{truncate(news.content, 140)}</p>
        <div className="news-row-meta">
          <span>{department}</span>
          <span>•</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </button>
  )
}

function NewsModal({ newsId, isOpen, onClose }) {
  const { citizen } = useAuth()
  const currentCitizenId = citizen?.id
  const [data, setData] = useState(null) // { news, comments } or null
  const [error, setError] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!isOpen || !newsId) {
      setData(null)
      setError(false)
      setCommentText('')
      return
    }
    let cancelled = false
    setData(null)
    setError(false)
    api
      .get(`/news/${newsId}`)
      .then(({ data }) => {
        if (!cancelled) setData(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, newsId])

  async function postComment() {
    const content = commentText.trim()
    if (!content) return
    setPosting(true)
    try {
      const { data: res } = await api.post(`/news/${newsId}/comments`, {
        content,
      })
      setData((d) => ({
        ...d,
        comments: [res.comment, ...(d?.comments || [])],
      }))
      setCommentText('')
    } catch (err) {
      window.alert(
        "Couldn't post comment: " +
          (err?.response?.data?.message || err.message),
      )
    } finally {
      setPosting(false)
    }
  }

  async function deleteComment(commentId) {
    if (!window.confirm('Delete this comment?')) return
    try {
      await api.delete(`/news/comments/${commentId}`)
      setData((d) => ({
        ...d,
        comments: (d?.comments || []).filter((c) => c.id !== commentId),
      }))
    } catch (err) {
      window.alert(
        "Couldn't delete comment: " +
          (err?.response?.data?.message || err.message),
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {data === null && !error && (
        <div className="loading-state" style={{ padding: '80px 20px' }}>
          Loading article…
        </div>
      )}
      {error && (
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          Couldn't load article.
        </div>
      )}
      {data && data.news && (
        <NewsArticleBody
          news={data.news}
          comments={data.comments || []}
          currentCitizenId={currentCitizenId}
          commentText={commentText}
          setCommentText={setCommentText}
          onPost={postComment}
          posting={posting}
          onDeleteComment={deleteComment}
        />
      )}
    </Modal>
  )
}

function NewsArticleBody({
  news,
  comments,
  currentCitizenId,
  commentText,
  setCommentText,
  onPost,
  posting,
  onDeleteComment,
}) {
  const categoryClass = (news.category || 'update').toLowerCase()
  const dateStr = formatDate(news.created_at)
  const department = news.department || 'Municipality'

  const initialFromAuth = (() => {
    try {
      const c = JSON.parse(localStorage.getItem('citizen') || '{}')
      return (c.first_name || '?').charAt(0).toUpperCase()
    } catch {
      return '?'
    }
  })()

  return (
    <>
      {news.image ? (
        <img
          src={news.image}
          alt={news.title}
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
          <span className={`news-category-badge ${categoryClass}`}>
            {news.category}
          </span>
          <span className="news-modal-info">
            {department} • {dateStr}
          </span>
        </div>
        <h1 className="news-modal-title">{news.title}</h1>
        <div className="news-modal-content">{news.content}</div>

        <div className="news-modal-comments">
          <div className="comments-header">
            <h2 className="comments-title">Comments</h2>
            <span className="comments-count">{comments.length}</span>
          </div>

          <div className="comment-input-wrap">
            <div className="comment-input-avatar">{initialFromAuth}</div>
            <div className="comment-input-area">
              <textarea
                className="comment-textarea"
                placeholder="Share your thoughts…"
                maxLength={1000}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="comment-input-actions">
                <span className="comment-char-count">
                  {commentText.length} / 1000
                </span>
                <button
                  className="btn-comment"
                  disabled={
                    posting ||
                    commentText.length === 0 ||
                    commentText.length > 1000
                  }
                  onClick={onPost}
                >
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="empty-state">
                No comments yet. Be the first!
              </div>
            ) : (
              comments.map((c) => (
                <Comment
                  key={c.id}
                  comment={c}
                  isOwn={c.citizen_id === currentCitizenId}
                  onDelete={() => onDeleteComment(c.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Comment({ comment, isOwn, onDelete }) {
  const fullName = `${comment.first_name || ''} ${
    comment.last_name || ''
  }`.trim()
  const initial = (comment.first_name || '?').charAt(0).toUpperCase()
  const dateStr = formatRelativeDate(comment.created_at)

  return (
    <div className="comment">
      <div className="comment-avatar">{initial}</div>
      <div className="comment-bubble">
        <div className="comment-meta">
          <span className="comment-author">{fullName}</span>
          <span className="comment-date">{dateStr}</span>
        </div>
        <p className="comment-content">{comment.content}</p>
        {isOwn && (
          <button className="comment-delete-btn" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
