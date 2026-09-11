import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import {
  GuestOnly,
  RequireAuth,
  RequireCouple,
  RequireNoCouple,
} from './components/RequireAuth'
import { MockSessionBar } from './components/MockSessionBar'
import { WelcomePage } from './features/auth/WelcomePage'
import { LoginPage } from './features/auth/LoginPage'
import { SetupPage } from './features/pairing/SetupPage'
import { JoinPage } from './features/pairing/JoinPage'
import { WaitingPage } from './features/pairing/WaitingPage'
import { HomePage } from './features/home/HomePage'
import { SettingsPage } from './features/settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<RequireNoCouple />}>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/waiting" element={<WaitingPage />} />
          </Route>

          <Route element={<RequireCouple />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>

      <MockSessionBar />
    </BrowserRouter>
  )
}
