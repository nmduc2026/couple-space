import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MockSessionProvider } from './lib/mock-session.tsx'
import { watchSystemTheme } from './lib/theme.ts'

watchSystemTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MockSessionProvider>
      <App />
    </MockSessionProvider>
  </StrictMode>,
)
