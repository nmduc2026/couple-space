import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router'
import { lazy, Suspense, useEffect } from 'react'
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
import { HomeScreen } from './features/home/HomeScreen'
import { TimelineScreen } from './features/timeline/TimelineScreen'
import { PlanScreen } from './features/plan/PlanScreen'
import { ExpensesScreen } from './features/expenses/ExpensesScreen'
import { EatScreen } from './features/eat/EatScreen'
import { useCouple } from './hooks/useCouple'
import { useSession } from './hooks/useSession'

/*
 * Tách gói theo màn hình.
 *
 * Trước đây cả app nằm trong MỘT tệp 721KB: mở lần đầu là tải hết, kể cả màn
 * Tổng kết năm (có canvas) hay xuất PDF mà cả năm mới dùng một lần. Trên 4G thì
 * đó là vài giây trắng màn hình trước khi thấy gì.
 *
 * Giữ tải sẵn: màn đăng nhập, ghép đôi, và bốn màn có trong thanh tab — đó là
 * những thứ luôn cần ngay. Còn lại tải khi nào mở tới.
 */
const JoinScreen = lazy(() => import('./features/pairing/JoinScreen').then((m) => ({ default: m.JoinScreen })))
const WaitingScreen = lazy(() => import('./features/pairing/WaitingScreen').then((m) => ({ default: m.WaitingScreen })))
const PostDetailScreen = lazy(() => import('./features/timeline/PostDetailScreen').then((m) => ({ default: m.PostDetailScreen })))
const ComposeScreen = lazy(() => import('./features/timeline/ComposeScreen').then((m) => ({ default: m.ComposeScreen })))
const EventFormScreen = lazy(() => import('./features/plan/EventFormScreen').then((m) => ({ default: m.EventFormScreen })))
const GoalDetailScreen = lazy(() => import('./features/goals/GoalDetailScreen').then((m) => ({ default: m.GoalDetailScreen })))
const ExpenseFormScreen = lazy(() => import('./features/expenses/ExpenseFormScreen').then((m) => ({ default: m.ExpenseFormScreen })))
const EatDetailScreen = lazy(() => import('./features/eat/EatDetailScreen').then((m) => ({ default: m.EatDetailScreen })))
const AlbumsScreen = lazy(() => import('./features/albums/AlbumsScreen').then((m) => ({ default: m.AlbumsScreen })))
const AlbumDetailScreen = lazy(() => import('./features/albums/AlbumDetailScreen').then((m) => ({ default: m.AlbumDetailScreen })))
const ExportPdfScreen = lazy(() => import('./features/albums/ExportPdfScreen').then((m) => ({ default: m.ExportPdfScreen })))
const QuestionScreen = lazy(() => import('./features/question/QuestionScreen').then((m) => ({ default: m.QuestionScreen })))
const LettersScreen = lazy(() => import('./features/letters/LettersScreen').then((m) => ({ default: m.LettersScreen })))
const MoodScreen = lazy(() => import('./features/mood/MoodScreen').then((m) => ({ default: m.MoodScreen })))
const MapScreen = lazy(() => import('./features/map/MapScreen').then((m) => ({ default: m.MapScreen })))
const WrappedScreen = lazy(() => import('./features/wrapped/WrappedScreen').then((m) => ({ default: m.WrappedScreen })))
const WishlistScreen = lazy(() => import('./features/wishlist/WishlistScreen').then((m) => ({ default: m.WishlistScreen })))
const SpinScreen = lazy(() => import('./features/eat/SpinScreen').then((m) => ({ default: m.SpinScreen })))
const SettingsScreen = lazy(() => import('./features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })))
const UnpairScreen = lazy(() => import('./features/settings/UnpairScreen').then((m) => ({ default: m.UnpairScreen })))

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
      <Suspense fallback={<Loading />}>
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
              <Route path="/question" element={<QuestionScreen />} />
              <Route path="/letters" element={<LettersScreen />} />
              <Route path="/mood" element={<MoodScreen />} />
              <Route path="/map" element={<MapScreen />} />
              <Route path="/wrapped" element={<WrappedScreen />} />
              <Route path="/wishlist" element={<WishlistScreen />} />
              <Route path="/albums" element={<AlbumsScreen />} />
              <Route path="/expenses" element={<ExpensesScreen />} />
              <Route path="/eat" element={<EatScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Route>

            {/* Màn toàn trang — tab bar sẽ che mất nút chính */}
            <Route path="/waiting" element={<WaitingScreen />} />
            <Route path="/compose" element={<ComposeScreen />} />
            <Route path="/timeline/:id" element={<PostDetailScreen />} />
            <Route path="/plan/new" element={<EventFormScreen />} />
            <Route path="/plan/:id" element={<EventFormScreen />} />
            <Route path="/plan/goals/:id" element={<GoalDetailScreen />} />
            <Route path="/expenses/new" element={<ExpenseFormScreen />} />
            <Route path="/expenses/:id" element={<ExpenseFormScreen />} />
            <Route path="/eat/spin" element={<SpinScreen />} />
            <Route path="/eat/:id" element={<EatDetailScreen />} />
            <Route path="/albums/export" element={<ExportPdfScreen />} />
            <Route path="/albums/:id" element={<AlbumDetailScreen />} />
            <Route path="/settings/unpair" element={<UnpairScreen />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
