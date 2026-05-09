// server.js
// Express backend for the Smart Municipality Platform.
// In dev: Vite (5173) proxies /api and /uploads here on PORT.
// In prod: after `npm run build`, this server also serves the React dist/.

const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const db = require('./config/db')

const app = express()

// ================ MIDDLEWARE ================
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Uploaded files (photos, request documents)
app.use('/uploads', express.static('uploads'))

// ================ API ROUTES ================
app.use('/api/citizens', require('./routes/citizenAuth'))
app.use('/api/news', require('./routes/news'))
app.use('/api/admins', require('./routes/adminAuth'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/service-requests', require('./routes/serviceRequests'))
app.use('/api/chat', require('./routes/chatbot'))
app.use('/api/contact', require('./routes/contactPublic'))

app.get('/api/test', (req, res) => {
  res.json({
    message: '🎉 Welcome to Smart Municipality Platform API!',
    status: 'Server is running',
    timestamp: new Date(),
  })
})

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS db_time')
    res.json({
      message: '✅ Database connected successfully!',
      database_time: rows[0].db_time,
    })
  } catch (error) {
    res.status(500).json({
      message: '❌ Database connection failed',
      error: error.message,
    })
  }
})

// ================ PRODUCTION STATIC SERVE ================
// Only kicks in if you've run `npm run build` (which produces dist/).
// In dev, this block is a no-op and Vite serves the UI.
const distDir = path.join(__dirname, 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA fallback — any non-API route returns index.html so React Router takes over.
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

// ================ START SERVER ================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})
