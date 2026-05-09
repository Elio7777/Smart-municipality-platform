import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [citizen, setCitizen] = useState(() => readJSON('citizen'))
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [admin, setAdmin] = useState(() => readJSON('admin'))
  const [adminToken, setAdminToken] = useState(() =>
    localStorage.getItem('adminToken')
  )

  const loginCitizen = useCallback((nextToken, nextCitizen) => {
    localStorage.setItem('token', nextToken)
    localStorage.setItem('citizen', JSON.stringify(nextCitizen))
    setToken(nextToken)
    setCitizen(nextCitizen)
  }, [])

  const logoutCitizen = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('citizen')
    setToken(null)
    setCitizen(null)
  }, [])

  const loginAdmin = useCallback((nextToken, nextAdmin) => {
    localStorage.setItem('adminToken', nextToken)
    localStorage.setItem('admin', JSON.stringify(nextAdmin))
    setAdminToken(nextToken)
    setAdmin(nextAdmin)
  }, [])

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin')
    setAdminToken(null)
    setAdmin(null)
  }, [])

  const value = {
    citizen,
    token,
    admin,
    adminToken,
    isCitizenAuthed: Boolean(token && citizen),
    isAdminAuthed: Boolean(adminToken && admin),
    loginCitizen,
    logoutCitizen,
    loginAdmin,
    logoutAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
