import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: string
  kind: ToastKind
  title: string
  subtitle?: string
}

interface ToastContextType {
  addToast: (kind: ToastKind, title: string, subtitle?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((kind: ToastKind, title: string, subtitle?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, kind, title, subtitle }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`}>
            <div className="toast-body">
              <span className="toast-title">{toast.title}</span>
              {toast.subtitle && <span className="toast-subtitle">{toast.subtitle}</span>}
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
