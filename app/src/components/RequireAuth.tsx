import { useCouple } from '../hooks/useCouple'
import { useSession } from '../hooks/useSession'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Loading as BootScreen } from './ui'
import { PREVIEW } from '../dev/preview'



export function RequireAuth() {
  // Chế độ xem thử (?preview=1) bỏ qua mọi guard để chụp được mọi màn
  const preview = PREVIEW
  const { isAuthenticated, isLoading } = useSession()
  const location = useLocation()

  if (preview) return <Outlet />
  if (isLoading) return <BootScreen />
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RequireCouple() {
  // Chế độ xem thử (?preview=1) bỏ qua mọi guard để chụp được mọi màn
  const preview = PREVIEW
  const { couple, isLoading } = useCouple()
  if (preview) return <Outlet />
  if (isLoading) return <BootScreen />
  if (!couple) return <Navigate to="/setup" replace />
  return <Outlet />
}

export function RequireNoCouple() {
  // Chế độ xem thử (?preview=1) bỏ qua mọi guard để chụp được mọi màn
  const preview = PREVIEW
  const { couple, isLoading } = useCouple()
  if (preview) return <Outlet />
  if (isLoading) return <BootScreen />
  if (couple) return <Navigate to="/" replace />
  return <Outlet />
}

export function GuestOnly() {
  // Chế độ xem thử (?preview=1) bỏ qua mọi guard để chụp được mọi màn
  const preview = PREVIEW
  const { isAuthenticated, isLoading } = useSession()
  const { couple, isLoading: coupleLoading } = useCouple()

  if (preview) return <Outlet />
  if (isLoading || (isAuthenticated && coupleLoading)) return <BootScreen />
  if (isAuthenticated) {
    return <Navigate to={couple ? '/' : '/setup'} replace />
  }
  return <Outlet />
}
