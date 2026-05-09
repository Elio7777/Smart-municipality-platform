# Smart Municipality Platform

A modern civic platform for municipalities that lets citizens report issues, request services, and stay informed — and gives administrators a dashboard to manage everything in one place. Built as a React + Vite Single-Page Application with a Node.js/Express backend and a MySQL database, fully installable as a Progressive Web App on desktop and mobile.

## Features

### For Citizens
- **Account management** — register with country picker for phone, login with email or phone, forgot-password recovery
- **Submit reports** — report city issues with a photo, GPS-pinned location on a Leaflet map, severity, and category
- **Track your reports** — list with filters and a public map showing all city reports color-coded by status
- **Request services** — apply for documents (birth certificates, permits, etc.) and download responses from the municipality
- **News & announcements** — read articles and post comments
- **Contact info** — view department contacts, working hours, emergency numbers, and the municipality location on a map
- **AI assistant** — chat with a Groq-powered chatbot that knows the platform and answers questions about municipal procedures
- **Install as an app** — works offline as a PWA on phones and computers

### For Administrators
- **Dashboard** — KPIs for total reports, pending reviews, active citizens, news published
- **Manage reports** — review submissions, change status (Submitted → Review → In Progress → Resolved), reply to citizens
- **Manage news** — create, edit, delete articles with images
- **Service requests** — review citizen requests and upload response documents (any file type)
- **Contact & info editor** — 4 tabs to manage municipality info, working hours, departments, and emergency contacts

## Tech Stack

**Frontend:** React 19, Vite, React Router 7, Axios, React-Leaflet, vite-plugin-pwa
**Backend:** Node.js, Express 5, MySQL2, JWT, bcrypt, Multer
**Dev:** Concurrently, Nodemon, ESLint
**External:** Groq Cloud (Llama 3.3) for AI chatbot, OpenStreetMap for tiles

## Prerequisites

- **Node.js 18+** and npm
- **MySQL** running locally (XAMPP, WAMP, or standalone)
- A **Groq API key** (free tier at https://console.groq.com) for the chatbot

## Installation

```bash
# 1. Clone or extract the project
cd smart-municipality-react

# 2. Install all dependencies (frontend + backend)
npm install
```

## Configuration

Create a `.env` file in the project root with:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_municipality
JWT_SECRET=any_long_random_string_at_least_32_chars
GROQ_API_KEY=your_groq_api_key
```

> The `.env` file is git-ignored — it should never be committed.

## Database Setup

1. Open **phpMyAdmin** or your MySQL client.
2. Create a database named `smart_municipality`.
3. Import the schema (12 tables):
   - `admins`, `citizens`, `categories`, `reports`, `report_responses`,
   - `news`, `news_comments`, `service_requests`,
   - `municipality_info`, `working_hours`, `departments`, `emergency_contacts`
4. Seed at least one admin in the `admins` table:
   ```sql
   INSERT INTO admins (employee_id, first_name, last_name, email, phone, password, position)
   VALUES (
     'ADM001',
     'Admin',
     'User',
     'admin@municipality.gov',
     '70000000',
     '$2b$10$REPLACE_WITH_BCRYPT_HASH_OF_YOUR_PASSWORD',
     'Municipality Admin'
   );
   ```
5. Seed default `categories` (otherwise citizens can't submit reports):
   ```sql
   INSERT INTO categories (name, description, icon) VALUES
     ('Pothole',      'Damaged road surface',                '🕳️'),
     ('Street Light', 'Broken or missing lighting',          '💡'),
     ('Trash',        'Garbage / illegal dumping',           '🗑️'),
     ('Water/Sewage', 'Leaks, flooding, sewer issues',       '💧'),
     ('Road Damage', 'Cracks, sinkholes, missing signs',     '🚧'),
     ('Green Spaces','Trees, parks, public gardens',         '🌳'),
     ('Parking',     'Illegal parking, missing markings',    '🚗'),
     ('Other',       'Anything else',                        '🔧');
   ```

## Running the App

### Development (recommended)

One command starts both servers with hot reload:

```bash
npm run dev
```

- Backend → http://localhost:5000
- Frontend → http://localhost:5173

Open the frontend URL in your browser. Vite proxies `/api` and `/uploads` requests to the backend automatically.

### Production build

```bash
npm run build      # creates dist/ folder
npm run preview    # serves it locally for testing
```

In production, the Express backend can serve the React `dist/` folder directly on port 5000 — see `server.js`.

### Other npm scripts

| Command | What it does |
|---|---|
| `npm run dev` | Backend + frontend together (recommended) |
| `npm run client` | Just the React dev server |
| `npm run server` | Just the backend |
| `npm run server:dev` | Backend with auto-restart (nodemon) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint on `src/` |
| `npm start` | Run backend in production mode |

## Project Structure

```
smart-municipality-react/
├── server.js                    # Express API entry point
├── vite.config.mjs              # Vite + PWA configuration
├── eslint.config.mjs            # ESLint (scoped to src/)
├── pwa-assets.config.mjs        # PWA icon generator config
├── index.html                   # HTML shell with PWA meta tags
├── .env                         # Secrets (git-ignored)
│
├── config/db.js                 # MySQL connection pool
├── middleware/                  # JWT auth, file upload
├── controllers/                 # Business logic (11 files)
├── routes/                      # Express routes (8 files)
├── uploads/                     # User-submitted files
│
├── public/                      # PWA icons + favicon
└── src/                         # React app
    ├── main.jsx                 # Entry point
    ├── App.jsx                  # Routes
    ├── api/client.js            # Axios with token interceptor
    ├── assets/style.css         # Global styles
    ├── context/                 # AuthContext, ToastContext
    ├── data/countries.js        # Country picker data
    ├── utils/                   # Date formatters, Leaflet setup
    ├── components/              # 14 reusable components
    └── pages/                   # 14 pages (citizen + admin)
```

## Routing

### Public
- `/login` — citizen login
- `/register` — citizen registration
- `/forgot-password` — password reset
- `/admin/login` — admin login

### Citizen (protected)
- `/home` — dashboard with feature cards
- `/news` — articles + comments
- `/submit-report` — new report form
- `/my-reports` — list + public map
- `/services` — service requests + AI chatbot
- `/contact` — municipality contact info

### Admin (protected)
- `/admin` — dashboard + KPIs
- `/admin/reports` — manage all citizen reports
- `/admin/news` — manage news articles
- `/admin/service-requests` — fulfill citizen requests
- `/admin/contact` — edit contact information

## Progressive Web App

The app is fully installable on:
- **Desktop Chrome / Edge** — install icon appears in the address bar
- **Android Chrome** — "Add to Home screen" / "Install app"
- **iOS Safari** — Share → Add to Home Screen

Once installed:
- Launches in its own window without browser chrome
- Branded red theme color and icon on the home screen
- Caches static assets and API responses for offline-friendly operation
- Updates automatically when you deploy a new version

## Form Validation

All input is validated on **both** frontend and backend:

| Field | Rule |
|---|---|
| First / Last name | Letters only, 2–50 characters |
| Email | Standard email format |
| Phone | International format with country picker (8–15 digits) |
| Password | Minimum 8 characters |

Invalid input shows inline red errors on the field. Server errors show in a top banner.

## Security

- Passwords hashed with **bcrypt** (10 rounds)
- Authentication via **JWT tokens** (7-day expiry) stored in `localStorage`
- Citizen and admin tokens use separate keys to prevent role escalation
- All admin endpoints protected by `requireAdmin` middleware
- Citizen endpoints protected by `requireCitizen` middleware
- `.env` excluded from git to keep secrets safe

## Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `(empty for XAMPP default)` |
| `DB_NAME` | Database name | `smart_municipality` |
| `JWT_SECRET` | Secret for signing JWTs | Random 32+ char string |
| `GROQ_API_KEY` | For the AI chatbot | `gsk_...` from console.groq.com |

## Default Test Credentials

After seeding the admin, login as:

**Admin** → http://localhost:5173/admin/login
- Email: `admin@municipality.gov` (or Employee ID `ADM001`)
- Password: whatever you hashed in the SQL insert

**Citizen** → register a new account through `/register` (no defaults).

## Troubleshooting

**`ECONNREFUSED` when calling `/api/...`** — the backend isn't running. Make sure `npm run dev` is active in the terminal and you see "Backend running on http://localhost:5000".

**MySQL connection error** — check your `.env` `DB_*` values. For XAMPP defaults, `DB_USER=root`, `DB_PASSWORD=` (empty), `DB_HOST=localhost`.

**Login works but admin dashboard says nothing loaded** — make sure you have at least one row in the `admins` table and rows in `categories`.

**PWA install button doesn't appear** — only Chrome / Edge / Chromium browsers fire the `beforeinstallprompt` event. Safari (iOS) uses the Share menu. Firefox doesn't support it on desktop.

**Old code keeps showing after edits** — service worker caching. Hard-refresh with `Ctrl+Shift+R`, or in DevTools → Application → Service Workers, click "Unregister".

## License

Academic project — Jounieh Municipality Smart City Platform.
