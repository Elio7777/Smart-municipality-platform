import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Skyline from '../components/Skyline.jsx'

const features = [
  {
    to: '/submit-report',
    title: 'Reports & Map',
    desc: 'Submit issues with photo and map pin. Browse all reported issues across the city.',
    cta: 'Open feature →',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    to: '/services',
    title: 'Request Services',
    desc: 'Apply for permits, request certificates, book appointments with municipal departments.',
    cta: 'Browse services →',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    to: '/news',
    title: 'News & Announcements',
    desc: "Stay updated with the latest from your municipality and what's happening in your city.",
    cta: 'Read news →',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8z" />
      </svg>
    ),
  },
  {
    to: '/contact',
    title: 'Contact & Info',
    desc: 'Find department contacts, working hours, and ask our AI chatbot anything.',
    cta: 'Get in touch →',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
]

export default function Home() {
  const { citizen } = useAuth()
  const firstName = citizen?.first_name || 'there'

  return (
    <>
      <Skyline />

      <div className="main-welcome">
        <span className="welcome-eyebrow">● Welcome back</span>
        <h1 className="welcome-title">
          Hello, <span className="accent">{firstName}</span>
        </h1>
        <p className="welcome-subtitle">What would you like to do today?</p>
      </div>

      <div className="features-grid">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
            <span className="feature-cta">{f.cta}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
