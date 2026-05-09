import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const url = config.url || ''
  const isAdminRoute =
    url.startsWith('/admin') || url.startsWith('/admins')
  const token = isAdminRoute
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
