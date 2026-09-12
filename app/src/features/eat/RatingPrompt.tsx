import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { usePendingRatings } from '../../hooks/useEatItems'
import { VERDICTS, type Verdict } from '../../lib/eatVerdicts'

/** Dải hỏi đánh giá sau khi ăn: một chạm, bỏ qua được, không nài. */
export function RatingPrompt() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const pending = usePendingRatings()
  const [skipped, setSkipped] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Mỗi lần chỉ hỏi MỘT quán — hỏi dồn ba cái là thành bài kiểm tra
  const ask = pending.find((p) => !skipped.includes(p.visit_id))
  if (!ask) return null

  async function rate(verdict: Verdict) {
    if (!ask || !couple || !user || PREVIEW) return
    setSaving(true)
    const { error } = await supabase.from('eat_ratings').insert({
      couple_id: couple.id,
      visit_id: ask.visit_id,
      user_id: user.id,
      verdict,
    })
    setSaving(false)
    if (error) return
    await queryClient.invalidateQueries({ queryKey: ['pending_ratings'] })
    await queryClient.invalidateQueries({ queryKey: ['eat_item_stats'] })
  }

  return (
    <section className="mt-3 rounded-2xl border border-accent/30 bg-soft p-3.5">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-[14px] leading-relaxed text-text">
          <b className="font-semibold">{ask.item_name}</b> ngon không?
        </p>
        <button
          type="button"
          aria-label="Bỏ qua"
          onClick={() => setSkipped((l) => [...l, ask.visit_id])}
          className="-mt-1 shrink-0 px-1 text-[13px] text-muted"
        >
          ✕
        </button>
      </div>

      <div className="mt-2.5 flex gap-2">
        {VERDICTS.map((v) => (
          <button
            key={v.key}
            type="button"
            disabled={saving}
            onClick={() => void rate(v.key)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border border-border bg-surface py-2 text-[11.5px] text-muted transition active:scale-[0.97] disabled:opacity-50"
          >
            <span aria-hidden className="text-xl">
              {v.emoji}
            </span>
            {v.label}
          </button>
        ))}
      </div>
    </section>
  )
}
