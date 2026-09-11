import { Link } from 'react-router'
import { useMockSession } from '../lib/mock-session'

/** Thanh giả lập trạng thái - chỉ dùng lúc dựng khung, bỏ khi có auth thật. */
export function MockSessionBar() {
  const {
    isAuthenticated,
    hasCouple,
    setAuthenticated,
    setHasCouple,
  } = useMockSession()

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface pb-safe">
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2 px-3 py-2 text-xs text-muted">
        <span className="font-medium text-text">Giả lập</span>
        <button
          type="button"
          className={`rounded px-2 py-1 ${isAuthenticated ? 'bg-accent text-white' : 'bg-bg text-text'}`}
          onClick={() => {
            if (isAuthenticated) {
              setHasCouple(false)
              setAuthenticated(false)
            } else {
              setAuthenticated(true)
            }
          }}
        >
          Đăng nhập: {isAuthenticated ? 'bật' : 'tắt'}
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${hasCouple ? 'bg-accent text-white' : 'bg-bg text-text'}`}
          onClick={() => setHasCouple(!hasCouple)}
        >
          Ghép đôi: {hasCouple ? 'bật' : 'tắt'}
        </button>
        <nav className="flex flex-wrap gap-2">
          <Link className="underline" to="/welcome">
            chào mừng
          </Link>
          <Link className="underline" to="/login">
            đăng nhập
          </Link>
          <Link className="underline" to="/setup">
            tạo space
          </Link>
          <Link className="underline" to="/join">
            nhập mã
          </Link>
          <Link className="underline" to="/waiting">
            phòng chờ
          </Link>
          <Link className="underline" to="/">
            trang chủ
          </Link>
          <Link className="underline" to="/settings">
            cài đặt
          </Link>
        </nav>
      </div>
    </div>
  )
}
