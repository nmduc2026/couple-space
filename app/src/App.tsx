import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router'
import { useEffect } from 'react'
import {
  GuestOnly,
  RequireAuth,
  RequireCouple,
  RequireNoCouple,
} from './components/RequireAuth'
import { ThemeSync } from './components/ThemeSync'
import { AppShell } from './components/AppShell'
import { Loading } from './components/ui'
import { PREVIEW } from './dev/preview'
import { WelcomeScreen } from './features/auth/WelcomeScreen'
import { EmailScreen } from './features/auth/EmailScreen'
import { OtpScreen } from './features/auth/OtpScreen'
import { ChoiceScreen } from './features/pairing/ChoiceScreen'
import { SetupScreen } from './features/pairing/SetupScreen'
import { WaitingScreen } from './features/pairing/WaitingScreen'
import { JoinScreen } from './features/pairing/JoinScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { TimelineScreen } from './features/timeline/TimelineScreen'
import { PostDetailScreen } from './features/timeline/PostDetailScreen'
import { ComposeScreen } from './features/timeline/ComposeScreen'
import { PlanScreen } from './features/plan/PlanScreen'
import { EventFormScreen } from './features/plan/EventFormScreen'
import { EatScreen } from './features/eat/EatScreen'
import { SpinScreen } from './features/eat/SpinScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { UnpairScreen } from './features/settings/UnpairScreen'
import { useCouple } from './hooks/useCouple'
import { useSession } from './hooks/useSession'

function JoinEntry() {
  const [params] = useSearchParams()
  const { isAuthenticated, isLoading } = useSession()
  const { couple, isLoading: coupleLoading } = useCouple()

  useEffect(() => {
    const code = params.get('code')
    if (code) sessionStorage.setItem('pendingInviteCode', code.toUpperCase())
  }, [params])

  if (PREVIEW) {
    return <JoinScreen />
  }

  if (isLoading || (isAuthenticated && coupleLoading)) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (couple) {
    return <Navigate to="/" replace />
  }

  return <JoinScreen />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeSync />
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="/login" element={<EmailScreen />} />
          <Route path="/login/otp" element={<OtpScreen />} />
        </Route>

        <Route path="/join" element={<JoinEntry />} />

        <Route element={<RequireAuth />}>
          <Route element={<RequireNoCouple />}>
            <Route path="/setup" element={<ChoiceScreen />} />
            <Route path="/setup/create" element={<SetupScreen />} />
          </Route>

          <Route element={<RequireCouple />}>
            {/* Màn có thanh tab dưới đáy */}
            <Route element={<AppShell />}>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/timeline" element={<TimelineScreen />} />
              <Route path="/plan" element={<PlanScreen />} />
              <Route path="/eat" element={<EatScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Route>

            {/* Màn toàn trang — tab bar sẽ che mất nút chính */}
            <Route path="/waiting" element={<WaitingScreen />} />
            <Route path="/compose" element={<ComposeScreen />} />
            <Route path="/timeline/:id" element={<PostDetailScreen />} />
            <Route path="/plan/new" element={<EventFormScreen />} />
            <Route path="/plan/:id" element={<EventFormScreen />} />
            <Route path="/eat/spin" element={<SpinScreen />} />
            <Route path="/settings/unpair" element={<UnpairScreen />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
