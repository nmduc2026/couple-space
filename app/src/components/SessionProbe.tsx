import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/** Thu useQuery + staleTime (P1-05b). Bo khi co auth that. */
export function SessionProbe() {
  const { isFetching, dataUpdatedAt, isError, error } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      console.log('[Query] goi getSession')
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      return data.session
    },
  })

  const updated =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString('vi-VN')
      : '...'

  return (
    <span className="text-muted">
      Session:{' '}
      {isError
        ? `loi ${error.message}`
        : isFetching
          ? 'dang tai...'
          : `OK (${updated})`}
    </span>
  )
}
