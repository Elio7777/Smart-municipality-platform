import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function decodeJwtPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export default function ProtectedRoute({ role = 'citizen', children }) {
  const auth = useAuth()
  const location = useLocation()

  if (role === 'admin') {
    const payload = auth.adminToken ? decodeJwtPayload(auth.adminToken) : null
    const expired = payload?.exp && payload.exp * 1000 < Date.now()
    const wrongRole = payload && payload.role !== 'admin'

    if (!auth.isAdminAuthed || expired || wrongRole) {
      if (expired || wrongRole) auth.logoutAdmin()
      return <Navigate to="/admin/login" replace />
    }
    return children
  }

  if (!auth.isCitizenAuthed) {
    const target = location.pathname + location.search
    sessionStorage.setItem('redirectAfterLogin', target)
    return <Navigate to="/login" replace />
  }
  return children
}
