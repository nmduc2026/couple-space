import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { supabase } from '../../lib/supabase'
import { PREVIEW, previewEatItems } from '../../dev/preview'
import type { EatItem } from '../../hooks/useEatItems'
import { ConfirmSheet, Screen, Stage, Sub, Title, TopBar } from '../../components/ui'
import { btn } from '../../lib/ui-classes'
import { Fireworks } from './Fireworks'

type Candidate = {
  id: string
  name: string
  address: string | null
  map_url: string | null
  never_tried: boolean
}

type Mode = 'reel' | 'box'
type Phase = 'idle' | 'running' | 'done' | 'empty'

/** Bao nhiêu bước nhảy trước khi dừng — cảm giác "quay" nằm ở nhịp chậm dần. */
const REEL_STEPS = 26

/** Số hộp tối đa. Nhiều hơn ngần này thì mỗi hộp bé quá, bấm không trúng. */
const MAX_BOXES = 9

const CONFETTI = ['#c2415b', '#e8a0ae', '#f0c27b', '#3f7d63', '#6b4e7d']

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

  const [mode, setMode] = useState<Mode | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [items, setItems] = useState<Candidate[]>([])
  const [cursor, setCursor] = useState(0)
  const [winner, setWinner] = useState<Candidate | null>(null)
  const [askCompose, setAskCompose] = useState(false)

  // --- hộp bí mật ---
  const [boxes, setBoxes] = useState<Candidate[]>([])
  const [shuffling, setShuffling] = useState(false)
  const [opened, setOpened] = useState<number | null>(null)

  const timers = useRef<number[]>([])
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(window.clearTimeout)
  }, [])

  function clearTimers() {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }

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

  /** Chọn kiểu quay → nạp danh sách luôn, để thấy có gì trước khi quay. */
  async function chooseMode(next: Mode) {
    const list = await loadCandidates()
    setMode(next)
    if (list.length === 0) {
      setPhase('empty')
      return
    }
    setItems(shuffle(list))
    setCursor(0)
    setPhase('idle')
    setWinner(null)
    setOpened(null)
  }

  /** Lùi về bước chọn kiểu — KHÔNG rời màn hình.
   *  Trước đây nút Huỷ nhảy thẳng hai bước ra ngoài. */
  function backToModes() {
    clearTimers()
    setMode(null)
    setPhase('idle')
    setWinner(null)
    setOpened(null)
    setShuffling(false)
  }

  function start() {
    if (items.length === 0) return
    setWinner(null)
    setOpened(null)
    setPhase('running')

    const target = Math.floor(Math.random() * items.length)

    if (mode === 'reel') {
      // Nhảy nhanh rồi chậm dần lại — cảm giác quay nằm ở nhịp
      let step = 0
      const tick = () => {
        step++
        setCursor((c) => (c + 1) % items.length)
        if (step < REEL_STEPS) {
          const progress = step / REEL_STEPS
          timers.current.push(
            window.setTimeout(tick, 45 + progress * progress * 260),
          )
        } else {
          setCursor(target)
          setWinner(items[target])
          setPhase('done')
        }
      }
      timers.current.push(window.setTimeout(tick, 60))
      return
    }

    // Hộp bí mật: MỖI MÓN MỘT HỘP, không phải cố định ba cái
    setBoxes(shuffle(items).slice(0, MAX_BOXES))
    setShuffling(true)
    timers.current.push(window.setTimeout(() => setShuffling(false), 900))
  }

  function openBox(index: number) {
    if (shuffling || opened !== null) return
    setOpened(index)
    setWinner(boxes[index])
    timers.current.push(window.setTimeout(() => setPhase('done'), 380))
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

  const running = phase === 'running'
  const pickingBox = mode === 'box' && running && !shuffling && opened === null

  return (
    <Screen>
      {mode === null ? (
        <TopBar to="/eat" label="Huỷ" />
      ) : (
        <div className="top-safe px-4 pb-2">
          <button
            type="button"
            onClick={backToModes}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-muted transition active:scale-95"
          >
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-[16px] text-text"
            >
              ←
            </span>
            Đổi kiểu quay
          </button>
        </div>
      )}

      <Stage className="text-center">
        <Title>Tối nay ăn gì?</Title>
        <Sub>Quay xong thì đi, không cãi nữa.</Sub>

        {mode === null ? (
          <div className="mt-8 space-y-3">
            <ModeCard
              emoji="🎞️"
              title="Dải quay"
              desc="Lướt qua danh sách rồi dừng lại ở một món."
              onClick={() => void chooseMode('reel')}
            />
            <ModeCard
              emoji="🎁"
              title="Hộp bí mật"
              desc="Mỗi món một hộp, xáo lên rồi tự chọn hộp mà mở."
              onClick={() => void chooseMode('box')}
            />
          </div>
        ) : phase === 'empty' ? (
          <p className="mt-8 rounded-3xl bg-soft px-5 py-10 text-sm leading-relaxed text-muted">
            Không còn quán nào để quay.
            <br />
            Thêm quán mới, hoặc chờ hết 14 ngày kể từ lần ghé gần nhất.
          </p>
        ) : mode === 'reel' ? (
          <Reel
            items={items}
            cursor={cursor}
            done={phase === 'done'}
            locked={running}
            onStep={(delta) =>
              setCursor((c) => (c + delta + items.length) % items.length)
            }
          />
        ) : (
          <Boxes
            boxes={boxes}
            shuffling={shuffling}
            opened={opened}
            idle={phase === 'idle'}
            count={items.length}
            onOpen={openBox}
          />
        )}

        {phase === 'done' && winner ? (
          <div className="mt-4">
            {winner.address ? (
              <p className="text-sm text-muted">{winner.address}</p>
            ) : null}
            {winner.never_tried ? (
              <p className="mt-2 inline-block rounded-full bg-soft px-3 py-1 text-xs text-accent">
                Chưa thử bao giờ
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-8">
          {mode === null ? null : phase === 'done' ? (
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
                onClick={start}
                className={`${btn.ghost} mt-1`}
              >
                Quay lại lần nữa
              </button>
            </>
          ) : pickingBox ? (
            <p className="py-4 text-center text-[14px] font-medium text-accent">
              Chạm vào một hộp để mở
            </p>
          ) : (
            <button
              type="button"
              disabled={running || phase === 'empty'}
              onClick={start}
              className={btn.primary}
            >
              {running
                ? mode === 'reel'
                  ? 'Đang quay...'
                  : 'Đang xáo...'
                : mode === 'reel'
                  ? '🎲 Quay đi'
                  : '🎁 Xáo hộp'}
            </button>
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

function ModeCard({
  emoji,
  title,
  desc,
  onClick,
}: {
  emoji: string
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition active:scale-[0.98]"
    >
      <span aria-hidden className="text-3xl">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15.5px] font-semibold text-text">{title}</b>
        <small className="block text-[12.5px] leading-relaxed text-muted">
          {desc}
        </small>
      </span>
      <span aria-hidden className="text-muted">
        ›
      </span>
    </button>
  )
}

/**
 * Ba món một lúc: hai bên mờ, ở giữa là món đang ngắm.
 *
 * Không có vạch đỏ — món ở giữa đã to hơn, viền đậm hơn và hai bên đã mờ đi;
 * thêm một cái vạch nữa chỉ là nói lại điều mắt đã thấy.
 */
function Reel({
  items,
  cursor,
  done,
  locked,
  onStep,
}: {
  items: Candidate[]
  cursor: number
  done: boolean
  locked: boolean
  onStep: (delta: number) => void
}) {
  if (items.length === 0) return null

  const at = (offset: number) =>
    items[(cursor + offset + items.length) % items.length]

  const side =
    'flex h-24 w-[26%] flex-none flex-col justify-center rounded-2xl border border-border bg-surface px-2 opacity-40 blur-[1px]'

  return (
    <div className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-soft px-3 py-6">
      {done ? <Fireworks colors={CONFETTI} /> : null}

      <div className="flex items-center justify-center gap-2">
        <div className={side} aria-hidden>
          <span className="line-clamp-2 text-[12px] leading-snug text-text">
            {at(-1).name}
          </span>
        </div>

        <div
          className={`flex h-32 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border-2 bg-surface px-3 transition ${
            done ? 'border-accent shadow-lg' : 'border-border'
          }`}
        >
          <b className="line-clamp-3 text-[17px] leading-snug font-bold text-balance text-text">
            {at(0).name}
          </b>
          {at(0).never_tried ? (
            <span className="mt-1.5 text-[11.5px] text-accent">chưa thử</span>
          ) : null}
        </div>

        <div className={side} aria-hidden>
          <span className="line-clamp-2 text-[12px] leading-snug text-text">
            {at(1).name}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Món trước"
          disabled={locked}
          onClick={() => onStep(-1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-text disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-[12px] tabular-nums text-muted">
          {(cursor % items.length) + 1}/{items.length}
        </span>
        <button
          type="button"
          aria-label="Món sau"
          disabled={locked}
          onClick={() => onStep(1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-text disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  )
}

/** Mỗi món một hộp — bỏ bao nhiêu món vào thì bấy nhiêu hộp hiện ra. */
function Boxes({
  boxes,
  shuffling,
  opened,
  idle,
  count,
  onOpen,
}: {
  boxes: Candidate[]
  shuffling: boolean
  opened: number | null
  idle: boolean
  count: number
  onOpen: (index: number) => void
}) {
  if (idle || boxes.length === 0) {
    return (
      <div className="mt-6 grid min-h-52 place-items-center rounded-[1.75rem] bg-soft px-6 text-center">
        <div>
          <span className="text-6xl" aria-hidden>
            🎁
          </span>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {count} món sẽ vào {Math.min(count, MAX_BOXES)} hộp.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mt-6 grid min-h-52 place-items-center rounded-[1.75rem] bg-soft p-4">
      {opened !== null ? <Fireworks colors={CONFETTI} /> : null}

      <div className="grid w-full grid-cols-3 gap-2.5">
        {boxes.map((item, i) => {
          const isOpen = opened === i
          return (
            <button
              key={item.id}
              type="button"
              disabled={shuffling || opened !== null}
              onClick={() => onOpen(i)}
              className={`flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border bg-surface px-1.5 transition ${
                isOpen ? 'border-accent shadow-lg' : 'border-border'
              } ${shuffling ? 'animate-pulse' : ''} ${
                opened !== null && !isOpen ? 'opacity-35' : ''
              }`}
            >
              <span aria-hidden className="text-2xl">
                {isOpen ? '🎉' : '🎁'}
              </span>
              <span className="line-clamp-2 text-[11.5px] leading-tight font-semibold text-text">
                {isOpen ? item.name : shuffling ? '...' : 'Mở?'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
