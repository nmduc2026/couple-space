import { Navigate, Outlet } from 'react-router'
import { useMockSession } from '../lib/mock-session'

/** Chưa đăng nhập → /welcome. Logic thật ở P1-14. */
export function RequireAuth() {
  const { isAuthenticated } = useMockSession()
  if (!isAuthenticated) return <Navigate to="/welcome" replace />
  return <Outlet />
}

/** Đã đăng nhập nhưng chưa có space → /setup. */
export function RequireCouple() {
  const { hasCouple } = useMockSession()
  if (!hasCouple) return <Navigate to="/setup" replace />
  return <Outlet />
}

/** Đã có space thì không ở nhóm setup/join/waiting. */
export function RequireNoCouple() {
  const { hasCouple } = useMockSession()
  if (hasCouple) return <Navigate to="/" replace />
  return <Outlet />
}

/** Đã đăng nhập thì không ở welcome/login. */
export function GuestOnly() {
  const { isAuthenticated, hasCouple } = useMockSession()
  if (isAuthenticated) {
    return <Navigate to={hasCouple ? '/' : '/setup'} replace />
  }
  return <Outlet />
}
