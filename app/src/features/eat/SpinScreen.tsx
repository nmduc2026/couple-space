import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { supabase } from '../../lib/supabase'
import { PREVIEW, previewEatItems } from '../../dev/preview'
import type { EatItem } from '../../hooks/useEatItems'
import { ConfirmSheet, Screen, Stage, Sub, Title, TopBar } from '../../components/ui'
import { btn } from '../../lib/ui-classes'

type Candidate = {
  id: string
  name: string
  address: string | null
  map_url: string | null
  never_tried: boolean
}

type Mode = 'reel' | 'box'
type Phase = 'idle' | 'running' | 'done' | 'empty'

/** Bề rộng một ô trên dải, tính bằng px trong khung toạ độ của app. */
const CARD_W = 132
const CARD_GAP = 10
const SLOT = CARD_W + CARD_GAP

/** Dải phải đủ dài để lướt cho đã mắt, kể cả khi chỉ có 3 quán. */
const MIN_STRIP = 40
const REEL_MS = 3600

/** Số món bỏ vào hộp bí mật. Ít hơn thì hết bất ngờ, nhiều hơn thì loãng. */
const BOX_SIZE = 3

function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function SpinScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { couple } = useCouple()

  const [mode, setMode] = useState<Mode>('reel')
  const [phase, setPhase] = useState<Phase>('idle')
  const [winner, setWinner] = useState<Candidate | null>(null)
  const [askCompose, setAskCompose] = useState(false)

  // --- dải lướt ---
  const [strip, setStrip] = useState<Candidate[]>([])
  const [offset, setOffset] = useState(0)
  const [gliding, setGliding] = useState(false)
  const [landing, setLanding] = useState(-1)

  // --- hộp bí mật ---
  const [boxes, setBoxes] = useState<Candidate[]>([])
  const [shuffling, setShuffling] = useState(false)
  const [opened, setOpened] = useState<number | null>(null)

  const timers = useRef<number[]>([])
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(window.clearTimeout)
  }, [])

  async function loadCandidates(): Promise<Candidate[]> {
    if (PREVIEW) {
      return (previewEatItems() as EatItem[])
        .filter((i) => i.status !== 'archived')
        .map((i) => ({
          id: i.id,
          name: i.name,
          address: i.address,
          map_url: i.map_url,
          never_tried: i.status === 'want',
        }))
    }
    if (!couple) return []
    const { data, error } = await supabase.rpc('spin_eat', {
      p_couple_id: couple.id,
    })
    if (error) throw error
    return (data ?? []) as Candidate[]
  }

  function reset() {
    setPhase('idle')
    setWinner(null)
    setOpened(null)
    setGliding(false)
    setOffset(0)
  }

  async function start() {
    const list = await loadCandidates()
    if (list.length === 0) {
      setPhase('empty')
      return
    }
    setWinner(null)
    setOpened(null)
    setPhase('running')

    // RPC đã xáo sẵn và ưu tiên quán chưa thử, nên phần tử đầu chính là
    // kết quả. Phần dưới đây chỉ là cách KỂ ra kết quả đó.
    const picked = list[0]

    if (mode === 'reel') {
      const filler: Candidate[] = []
      while (filler.length < MIN_STRIP) filler.push(...shuffle(list))
      // Đặt người thắng ở gần cuối dải để còn chỗ lướt trước khi dừng
      const landing = filler.length - 4
      filler[landing] = picked
      setStrip(filler)
      setLanding(landing)

      setOffset(0)
      setGliding(false)
      // Đợi một khung hình để trình duyệt ghi nhận vị trí đầu, nếu không thì
      // nó gộp hai lần đặt lại thành một và hoạt ảnh không chạy.
      timers.current.push(
        window.setTimeout(() => {
          setGliding(true)
          setOffset(landing * SLOT)
        }, 30),
      )
      timers.current.push(
        window.setTimeout(() => {
          setWinner(picked)
          setPhase('done')
        }, REEL_MS + 120),
      )
      return
    }

    // Hộp bí mật: bốc vài món, xáo, rồi để người dùng tự chọn hộp mà mở
    const chosen = shuffle(list).slice(0, Math.min(BOX_SIZE, list.length))
    // Người thắng phải nằm trong số hộp, nếu không thì mở hộp nào cũng vô nghĩa
    if (!chosen.some((c) => c.id === picked.id)) chosen[0] = picked
    setBoxes(shuffle(chosen))
    setShuffling(true)
    timers.current.push(window.setTimeout(() => setShuffling(false), 900))
  }

  function openBox(index: number) {
    if (shuffling || opened !== null) return
    setOpened(index)
    setWinner(boxes[index])
    timers.current.push(window.setTimeout(() => setPhase('done'), 420))
  }

  /** Chốt: ghi một lượt ghé để lần quay sau tránh quán này. */
  async function confirmVisit() {
    if (!winner || !couple || PREVIEW) {
      navigate('/eat')
      return
    }
    await supabase.from('eat_visits').insert({
      couple_id: couple.id,
      item_id: winner.id,
    })
    await supabase
      .from('eat_items')
      .update({ status: 'tried' })
      .eq('id', winner.id)
    await queryClient.invalidateQueries({ queryKey: ['eat_items'] })
    await queryClient.invalidateQueries({ queryKey: ['pending_ratings'] })
    // Vừa đi ăn xong là lúc dễ có ảnh nhất — hỏi ngay, nhưng không ép
    setAskCompose(true)
  }

  const busy = phase === 'running'
  const pickingBox =
    mode === 'box' && phase === 'running' && !shuffling && opened === null

  return (
    <Screen>
      <TopBar to="/eat" label="Huỷ" />
      <Stage className="text-center">
        <Title>Tối nay ăn gì?</Title>
        <Sub>Quay xong thì đi, không cãi nữa.</Sub>

        {phase === 'idle' ? (
          <div className="mt-5 flex gap-1 rounded-2xl border border-border bg-surface p-1">
            {(
              [
                ['reel', '🎞️ Dải quay'],
                ['box', '🎁 Hộp bí mật'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  mode === value ? 'bg-accent text-on-accent' : 'text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 min-h-[13rem]">
          {phase === 'empty' ? (
            <p className="grid min-h-[13rem] place-items-center rounded-[1.75rem] bg-soft px-5 text-sm leading-relaxed text-muted">
              Không còn quán nào để quay.
              <br />
              Thêm quán mới, hoặc chờ hết 14 ngày kể từ lần ghé gần nhất.
            </p>
          ) : mode === 'reel' ? (
            <Reel
              strip={strip}
              offset={offset}
              gliding={gliding}
              idle={phase === 'idle'}
              landing={phase === 'done' ? landing : -1}
            />
          ) : (
            <Boxes
              boxes={boxes}
              shuffling={shuffling}
              opened={opened}
              idle={phase === 'idle'}
              onOpen={openBox}
            />
          )}
        </div>

        {phase === 'done' && winner ? (
          <div className="mt-5">
            <p className="text-[24px] leading-tight font-extrabold text-accent">
              {winner.name}
            </p>
            {winner.address ? (
              <p className="mt-1 text-sm text-muted">{winner.address}</p>
            ) : null}
            {winner.never_tried ? (
              <p className="mt-2 inline-block rounded-full bg-soft px-3 py-1 text-xs text-accent">
                Chưa thử bao giờ
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-8">
          {phase === 'done' ? (
            <>
              <button
                type="button"
                onClick={() => void confirmVisit()}
                className={btn.primary}
              >
                Chốt, đi quán này
              </button>
              <button
                type="button"
                onClick={() => {
                  reset()
                  void start()
                }}
                className={`${btn.ghost} mt-1`}
              >
                Quay lại lần nữa
              </button>
            </>
          ) : (
            pickingBox ? (
            // Xáo xong rồi thì việc cần làm là chạm vào một hộp, không phải
            // bấm nút dưới — để nút kẹt ở "Đang xáo..." là chỉ sai chỗ.
            <p className="py-4 text-center text-[14px] font-medium text-accent">
              Chạm vào một hộp để mở
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void start()}
              className={btn.primary}
            >
              {busy
                ? mode === 'reel'
                  ? 'Đang quay...'
                  : 'Đang xáo...'
                : mode === 'reel'
                  ? '🎲 Quay đi'
                  : '🎁 Xáo hộp'}
            </button>
          )
          )}
        </div>
      </Stage>

      {askCompose ? (
        <ConfirmSheet
          title="Đăng luôn một kỉ niệm?"
          body={`Đã ghi lại lần đi ${winner?.name ?? 'này'}.`}
          confirmLabel="Thêm ảnh, viết vài chữ"
          cancelLabel="Để sau"
          onConfirm={() =>
            navigate(
              `/compose?activity=food&place=${encodeURIComponent(winner?.name ?? '')}`,
              { replace: true },
            )
          }
          onCancel={() => navigate('/eat', { replace: true })}
        />
      ) : null}
    </Screen>
  )
}

/**
 * Dải quay ngang.
 *
 * Cả dải trượt sang trái bằng MỘT phép biến hình có `transition`, không phải
 * bằng bộ đếm nhảy từng ô: trình duyệt chạy transform trên luồng ghép hình nên
 * mượt kể cả lúc app đang tải dữ liệu, còn `setTimeout` từng bước thì giật
 * ngay khi luồng chính bận.
 */
function Reel({
  strip,
  offset,
  gliding,
  idle,
  landing,
}: {
  strip: Candidate[]
  offset: number
  gliding: boolean
  idle: boolean
  landing: number
}) {
  if (idle || strip.length === 0) {
    return (
      <div className="grid min-h-[13rem] place-items-center rounded-[1.75rem] bg-soft">
        <span className="text-6xl" aria-hidden>
          🎞️
        </span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-soft py-7">
      {/* Vạch ngắm giữa khung — chỗ nào dừng dưới vạch là kết quả */}
      <span
        aria-hidden
        className="absolute inset-y-3 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-accent"
      />
      <span
        aria-hidden
        className="absolute top-1 left-1/2 z-10 -translate-x-1/2 text-[14px] text-accent"
      >
        ▼
      </span>

      <div
        className="flex"
        style={{
          gap: `${CARD_GAP}px`,
          // Căn ô đang ngắm vào đúng giữa khung
          transform: `translateX(calc(50% - ${CARD_W / 2}px - ${offset}px))`,
          transition: gliding
            ? `transform ${REEL_MS}ms cubic-bezier(0.12, 0.68, 0.06, 1)`
            : 'none',
        }}
      >
        {strip.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            style={{ width: CARD_W }}
            className={`flex h-24 flex-none flex-col justify-center rounded-2xl border bg-surface px-3 transition ${
              i === landing ? 'border-accent shadow-lg' : 'border-border'
            }`}
          >
            <b className="line-clamp-2 text-[13.5px] leading-snug font-semibold text-text">
              {item.name}
            </b>
            {item.never_tried ? (
              <span className="mt-1 text-[11px] text-accent">chưa thử</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Ba hộp quà: xáo rồi để người dùng tự chọn hộp mà mở. */
function Boxes({
  boxes,
  shuffling,
  opened,
  idle,
  onOpen,
}: {
  boxes: Candidate[]
  shuffling: boolean
  opened: number | null
  idle: boolean
  onOpen: (index: number) => void
}) {
  if (idle || boxes.length === 0) {
    return (
      <div className="grid min-h-[13rem] place-items-center rounded-[1.75rem] bg-soft">
        <span className="text-6xl" aria-hidden>
          🎁
        </span>
      </div>
    )
  }

  return (
    <div className="grid min-h-[13rem] place-items-center rounded-[1.75rem] bg-soft px-4">
      <div className="flex w-full justify-center gap-3">
        {boxes.map((item, i) => {
          const isOpen = opened === i
          return (
            <button
              key={item.id}
              type="button"
              disabled={shuffling || opened !== null}
              onClick={() => onOpen(i)}
              className={`flex h-28 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border bg-surface px-2 transition ${
                isOpen ? 'border-accent' : 'border-border'
              } ${shuffling ? 'animate-pulse' : ''} ${
                opened !== null && !isOpen ? 'opacity-40' : ''
              }`}
            >
              <span aria-hidden className="text-3xl">
                {isOpen ? '🎉' : '🎁'}
              </span>
              <span className="line-clamp-2 text-[12px] leading-tight font-semibold text-text">
                {isOpen ? item.name : shuffling ? '...' : 'Mở?'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
