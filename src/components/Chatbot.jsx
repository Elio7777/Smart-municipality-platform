import { useEffect, useRef, useState } from 'react'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const SUGGESTIONS = [
  'How do I report a pothole?',
  'What are the office hours?',
  'How do I request a birth certificate?',
]

export default function Chatbot() {
  const { citizen } = useAuth()
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  const userInitial = (citizen?.first_name || 'Y').charAt(0).toUpperCase()

  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [history, isWaiting])

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  async function send(text) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || isWaiting) return

    const newUserMsg = { role: 'user', content: trimmed }
    const priorHistory = history
    setHistory((h) => [...h, newUserMsg])
    setInput('')
    setIsWaiting(true)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    try {
      const { data } = await api.post('/chat', {
        message: trimmed,
        history: priorHistory,
      })
      const reply = data.reply
      setHistory((h) => [...h, { role: 'assistant', content: reply }])
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Please try again.'
      setHistory((h) => [
        ...h,
        {
          role: 'assistant',
          content: `Sorry, I'm having trouble right now. ${msg}`,
        },
      ])
    } finally {
      setIsWaiting(false)
      inputRef.current?.focus()
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function autoResize(e) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'
  }

  return (
    <>
      <button
        className={`chat-bubble${open ? ' hidden' : ''}`}
        aria-label="Open AI assistant"
        onClick={handleOpen}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <div className={`chat-panel${open ? ' open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-bot-avatar">🤖</div>
            <div className="chat-header-info">
              <h4>AI Assistant</h4>
              <p>
                <span className="chat-status-dot"></span> Online
              </p>
            </div>
          </div>
          <button
            className="chat-close-btn"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="chat-messages" ref={messagesRef}>
          {history.length === 0 && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">👋</div>
              <h3>Hi! I'm your municipal assistant</h3>
              <p>
                Ask me anything about the platform, services, or municipality.
              </p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="chat-suggestion"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg ${msg.role === 'user' ? 'user' : 'bot'}`}
            >
              <div className="chat-msg-avatar">
                {msg.role === 'user' ? userInitial : '🤖'}
              </div>
              <div className="chat-msg-bubble">{msg.content}</div>
            </div>
          ))}

          {isWaiting && (
            <div className="chat-msg bot">
              <div className="chat-msg-avatar">🤖</div>
              <div className="chat-typing">
                <span className="chat-typing-dot"></span>
                <span className="chat-typing-dot"></span>
                <span className="chat-typing-dot"></span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-bar">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask me anything…"
            rows="1"
            value={input}
            onChange={autoResize}
            onKeyDown={onKey}
          />
          <button
            className="chat-send-btn"
            aria-label="Send message"
            onClick={() => send()}
            disabled={isWaiting}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
