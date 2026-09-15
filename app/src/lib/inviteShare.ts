export function buildInviteShare(code: string, origin = window.location.origin) {
  const link = `${origin}/join?code=${code}`
  return { link, text: link }
}

export type ShareInviteResult = 'shared' | 'copied'

/** Chia sẻ / copy chỉ link mời (không kèm câu chữ). */
export async function shareInvite(code: string): Promise<ShareInviteResult> {
  const { link } = buildInviteShare(code)

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Couple Space', url: link })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
    }
  }

  await navigator.clipboard.writeText(link)
  return 'copied'
}
