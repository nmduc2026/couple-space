import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { supabase } from '../../lib/supabase'
import { PREVIEW, previewEatItems } from '../../dev/preview'
import type { EatItem } from '../../hooks/useEatItems'
import { Screen, Stage, Sub, Title, TopBar } from '../../components/ui'
import { btn } from '../../lib/ui-classes'

type Candidate = {
  id: string
  name: string
  address: string | null
  map_url: string | null
  never_tried: boolean
}

const SPIN_MS = 1500
const TICK_MS = 80

export function SpinScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { couple } = useCouple()

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [shownIndex, setShownIndex] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done' | 'empty'>(
    'idle',
  )
  const [winner, setWinner] = useState<Candidate | null>(null)
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

  /** Quay ~1.5 giây: nháy qua các lựa chọn rồi dừng ở kết quả. */
  async function spin() {
    const list = await loadCandidates()
    if (list.length === 0) {
      setPhase('empty')
      return
    }
    setCandidates(list)
    setWinner(null)
    setPhase('spinning')

    const picked = list[0] // RPC đã xáo và ưu tiên quán chưa thử
    let elapsed = 0
    const step = () => {
      elapsed += TICK_MS
      setShownIndex((i) => (i + 1) % list.length)
      if (elapsed < SPIN_MS) {
        timers.current.push(window.setTimeout(step, TICK_MS))
      } else {
        setWinner(picked)
        setPhase('done')
      }
    }
    timers.current.push(window.setTimeout(step, TICK_MS))
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
    navigate('/eat')
  }

  const spinningName = candidates[shownIndex]?.name ?? '...'

  return (
    <Screen>
      <TopBar to="/eat" />
      <Stage className="text-center">
        <Title>Tối nay ăn gì?</Title>
        <Sub>Quay xong thì đi, không cãi nữa.</Sub>

        <div className="mt-10 grid min-h-[11rem] place-items-center rounded-[1.75rem] bg-soft px-5 py-8">
          {phase === 'idle' ? (
            <span className="text-6xl" aria-hidden>
              🎲
            </span>
          ) : phase === 'empty' ? (
            <p className="text-sm leading-relaxed text-muted">
              Không còn quán nào để quay.
              <br />
              Thêm quán mới, hoặc chờ hết 14 ngày kể từ lần ghé gần nhất.
            </p>
          ) : phase === 'spinning' ? (
            <p className="animate-pulse text-2xl font-bold text-accent">
              {spinningName}
            </p>
          ) : (
            <div>
              <p className="text-[26px] leading-tight font-extrabold text-accent">
                {winner?.name}
              </p>
              {winner?.address ? (
                <p className="mt-2 text-sm text-muted">{winner.address}</p>
              ) : null}
              {winner?.never_tried ? (
                <p className="mt-3 inline-block rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
                  Chưa thử bao giờ
                </p>
              ) : null}
            </div>
          )}
        </div>

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
                onClick={() => void spin()}
                className={`${btn.ghost} mt-1`}
              >
                Quay lại
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void spin()}
              disabled={phase === 'spinning'}
              className={btn.primary}
            >
              {phase === 'spinning' ? 'Đang quay...' : 'Quay'}
            </button>
          )}
        </div>
      </Stage>
    </Screen>
  )
}
