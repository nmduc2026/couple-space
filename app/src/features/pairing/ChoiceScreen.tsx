import { Link } from 'react-router'
import { Screen, Spacer, Stage, Sub, Title } from '../../components/ui'

const OPTIONS = [
  {
    to: '/setup/create',
    title: 'Tạo mới',
    hint: 'Chưa có mã mời',
    emoji: '🤍',
  },
  {
    to: '/join',
    title: 'Có mã rồi',
    hint: 'Nhập mã 6 ký tự',
    emoji: '✉️',
  },
]

export function ChoiceScreen() {
  return (
    <Screen>
      <div className="top-safe" />
      <Stage className="justify-center">
        <Title>Bạn đã có mã mời chưa?</Title>
        <Sub>Chọn một cách để bắt đầu.</Sub>

        <div className="mt-8 flex flex-col gap-3">
          {OPTIONS.map((option) => (
            <Link
              key={option.to}
              to={option.to}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4 text-left transition active:scale-[0.99]"
            >
              <span aria-hidden className="text-2xl">
                {option.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-text">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-muted">
                  {option.hint}
                </span>
              </span>
              <span aria-hidden className="ml-auto text-muted">
                ›
              </span>
            </Link>
          ))}
        </div>
        <Spacer />
      </Stage>
    </Screen>
  )
}
