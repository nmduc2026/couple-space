export function buildInviteShare(code: string, origin = window.location.origin) {
  const link = `${origin}/join?code=${code}`
  const text = `Mình vừa tạo một nơi để tụi mình lưu kỉ niệm. Vào bằng mã ${code} nhé: ${link}`
  return { link, text }
}

export async function shareInvite(code: string) {
  const { link, text } = buildInviteShare(code)
  if (navigator.share) {
    await navigator.share({ title: 'Couple Space', text, url: link })
    return
  }
  await navigator.clipboard.writeText(text)
}
