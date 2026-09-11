import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { ThemeSync } from './components/ThemeSync.tsx'
import { MockSessionProvider } from './lib/mock-session.tsx'
import { queryClient } from './lib/query-client.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MockSessionProvider>
        <ThemeSync />
        <App />
      </MockSessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
