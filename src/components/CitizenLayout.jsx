import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import CitizenSidebar from './CitizenSidebar.jsx'
import InstallPWAButton from './InstallPWAButton.jsx'

export default function CitizenLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="home-shell">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="home-grid">
        <CitizenSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="home-main">
          <Outlet />
        </main>
      </div>
      <InstallPWAButton />
    </div>
  )
}
