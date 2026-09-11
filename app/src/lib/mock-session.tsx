import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type MockSession = {
  isAuthenticated: boolean
  hasCouple: boolean
  setAuthenticated: (value: boolean) => void
  setHasCouple: (value: boolean) => void
}

const MockSessionContext = createContext<MockSession | null>(null)

/** Dữ liệu giả cho P1-04. Logic thật thay ở P1-14. */
export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false)
  const [hasCouple, setHasCouple] = useState(false)

  const value = useMemo(
    () => ({
      isAuthenticated,
      hasCouple,
      setAuthenticated,
      setHasCouple: (next: boolean) => {
        setHasCouple(next)
        if (next) setAuthenticated(true)
      },
    }),
    [isAuthenticated, hasCouple],
  )

  return (
    <MockSessionContext.Provider value={value}>
      {children}
    </MockSessionContext.Provider>
  )
}

export function useMockSession() {
  const ctx = useContext(MockSessionContext)
  if (!ctx) {
    throw new Error('useMockSession must be used within MockSessionProvider')
  }
  return ctx
}
