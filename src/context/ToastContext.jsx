import { createContext, useContext, useRef, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', isError: false, show: false })
  const timerRef = useRef(null)

  const showToast = useCallback((message, isError = false) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, isError, show: true })
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }))
    }, 2200)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className={`section-toast${toast.isError ? ' error' : ''}${
          toast.show ? ' show' : ''
        }`}
      >
        {toast.message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
