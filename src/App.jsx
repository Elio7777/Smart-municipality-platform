import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import AdminLogin from './pages/AdminLogin.jsx'

import Home from './pages/Home.jsx'
import News from './pages/News.jsx'
import SubmitReport from './pages/SubmitReport.jsx'
import MyReports from './pages/MyReports.jsx'
import Services from './pages/Services.jsx'
import Contact from './pages/Contact.jsx'

import AdminHome from './pages/admin/AdminHome.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminNews from './pages/admin/AdminNews.jsx'
import AdminServiceRequests from './pages/admin/AdminServiceRequests.jsx'
import AdminContact from './pages/admin/AdminContact.jsx'

import CitizenLayout from './components/CitizenLayout.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'

function RootRedirect() {
  const { isCitizenAuthed } = useAuth()
  return <Navigate to={isCitizenAuthed ? '/home' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Citizen (protected) — share CitizenLayout */}
      <Route
        element={
          <ProtectedRoute>
            <CitizenLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/submit-report" element={<SubmitReport />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Admin (protected) — share AdminLayout */}
      <Route
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/home" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/news" element={<AdminNews />} />
        <Route
          path="/admin/service-requests"
          element={<AdminServiceRequests />}
        />
        <Route path="/admin/contact" element={<AdminContact />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
