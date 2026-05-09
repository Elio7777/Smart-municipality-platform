import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Skyline from '../../components/Skyline.jsx'

export default function AdminHome() {
  const { admin } = useAuth()
  const [stats, setStats] = useState(null)

  const firstName = admin?.first_name || 'Admin'

  useEffect(() => {
    let cancelled = false
    api
      .get('/admin/stats')
      .then(({ data }) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const features = [
    {
      to: '/admin/reports',
      title: 'Manage Reports',
      desc: 'Review citizen reports, update status, and respond to issues.',
      cta: 'Open dashboard →',
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
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      to: '/admin/contact',
      title: 'Contact & Info',
      desc: 'Manage municipality info, hours, departments, and emergency contacts.',
      cta: 'Open editor →',
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
    {
      to: '/admin/news',
      title: 'Manage News',
      desc: 'Publish announcements and updates for citizens to see.',
      cta: 'Open editor →',
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
      to: '/admin/service-requests',
      title: 'Service Requests',
      desc: 'Review citizen requests and upload requested documents.',
      cta: 'Open dashboard →',
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
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      ),
    },
  ]

  return (
    <>
      <Skyline />

      <div className="main-welcome">
        <span className="welcome-eyebrow">● Admin dashboard</span>
        <h1 className="welcome-title">
          Welcome, <span className="accent">{firstName}</span>
        </h1>
        <p className="welcome-subtitle">
          Manage citizen reports and platform content from one place.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total reports</div>
          <div className="kpi-value">{stats?.total_reports ?? 0}</div>
          <div className="kpi-trend">all time</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending review</div>
          <div className="kpi-value warning">
            {stats?.pending_reports ?? 0}
          </div>
          <div className="kpi-trend">needs action</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active citizens</div>
          <div className="kpi-value">{stats?.total_citizens ?? 0}</div>
          <div className="kpi-trend">registered</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">News published</div>
          <div className="kpi-value">{stats?.total_news ?? 0}</div>
          <div className="kpi-trend">articles</div>
        </div>
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
