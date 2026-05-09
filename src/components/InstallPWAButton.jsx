import { useEffect, useState } from 'react'

// Floating "Install app" button that appears only when the browser
// fires the `beforeinstallprompt` event (Chrome / Edge / Chromium).
// Stays hidden on Safari / iOS (no event fires there) — falls back
// to the browser's own "Add to Home Screen" path.
export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // If already running as an installed app, never show the button.
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) {
      setInstalled(true)
      return
    }

    function onBeforeInstall(e) {
      e.preventDefault() // Stop Chrome from showing its own mini banner
      setDeferredPrompt(e)
    }
    function onAppInstalled() {
      setDeferredPrompt(null)
      setInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice?.outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  // Hide entirely if not installable or already installed.
  if (installed || !deferredPrompt) return null

  return (
    <button
      type="button"
      onClick={handleInstall}
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: 'var(--color-red, #E11D2E)',
        color: 'white',
        border: 'none',
        borderRadius: 999,
        boxShadow: '0 8px 24px rgba(225,29,46,0.35)',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
      aria-label="Install Smart Municipality as an app"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Install app
    </button>
  )
}
