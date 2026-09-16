import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/query-client.ts'

/**
 * Sau mỗi lần deploy, PWA đôi khi còn giữ HTML cũ trỏ tới file JS đã xoá
 * → màn hình trắng. Vite báo `vite:preloadError`; reload một lần là ổn.
 */
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'cs:chunk-reload'
  if (sessionStorage.getItem(key) === '1') return
  sessionStorage.setItem(key, '1')
  window.location.reload()
})
window.addEventListener('load', () => {
  sessionStorage.removeItem('cs:chunk-reload')
})

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main
          style={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            background: '#fbf8f9',
            color: '#3f3a3c',
          }}
        >
          <div>
            <p style={{ marginBottom: 12 }}>Có lỗi khi mở app.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                border: 'none',
                borderRadius: 12,
                padding: '10px 16px',
                background: '#e11d48',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Tải lại
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
