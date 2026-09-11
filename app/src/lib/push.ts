import { supabase } from './supabase'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export async function enablePush() {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('Thiếu VITE_VAPID_PUBLIC_KEY trong .env')
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Trình duyệt không hỗ trợ Web Push')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(
      'Quyền thông báo bị từ chối. Vào Cài đặt iPhone để bật lại nếu cần.',
    )
  }

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
      user_agent: navigator.userAgent,
      last_seen_at: new Date().toISOString(),
      user_id: (await supabase.auth.getUser()).data.user?.id,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}
