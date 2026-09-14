import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { PREVIEW, previewSession, previewUser } from '../dev/preview'

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (PREVIEW) {
    return {
      session: previewSession,
      user: previewUser,
      isLoading: false,
      isAuthenticated: true,
    }
  }

  return {
    session,
    user: session?.user ?? null,
    isLoading: session === undefined,
    isAuthenticated: !!session,
  }
}
