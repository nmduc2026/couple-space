export function buildInviteShare(code: string, origin = window.location.origin) {
  const link = `${origin}/join?code=${code}`
  return { link, text: link }
}

export type ShareInviteResult = 'copied'

/** Chỉ copy link mời — không mở sheet Share của hệ thống. */
export async function shareInvite(code: string): Promise<ShareInviteResult> {
  const { link } = buildInviteShare(code)
  await navigator.clipboard.writeText(link)
  return 'copied'
}
