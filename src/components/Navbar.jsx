import { Link } from 'react-router-dom'

export default function Navbar({ onMenuClick, isAdmin = false }) {
  const homeHref = isAdmin ? '/admin' : '/home'

  return (
    <nav className="home-navbar">
      <div className="home-navbar-left">
        <button
          className="menu-toggle"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link to={homeHref} className="navbar-logo">
          <span className="logo-mark"></span>
          Smart Municipality
          {isAdmin && <span className="navbar-admin-badge">Admin</span>}
        </Link>
      </div>
      <div className="home-navbar-right"></div>
    </nav>
  )
}
