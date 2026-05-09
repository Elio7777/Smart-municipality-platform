import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import AdminSidebar from './AdminSidebar.jsx'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // On admin home we show "Manage Reports" as the primary link
  // and stats. On other admin pages, we link back to Dashboard.
  const isHome =
    location.pathname === '/admin' || location.pathname === '/admin/home'

  const primaryLink = isHome
    ? { to: '/admin/reports', label: 'Manage Reports' }
    : { to: '/admin', label: 'Dashboard' }

  return (
    <div className="home-shell">
      <Navbar onMenuClick={() => setSidebarOpen(true)} isAdmin />
      <div className="home-grid">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          primaryLink={primaryLink}
        />
        <main className="home-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
