// Chụp màn hình từng màn để review UI mà không cần mở trình duyệt bằng tay.
//   npm run shots            -> ảnh vào .shots/
//   SHOTS_DIR=... npm run shots
// Cần dev server chạy sẵn ở PORT (mặc định 5173), hoặc script tự bật.

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const PORT = Number(process.env.PORT ?? 5173)
const BASE = `http://localhost:${PORT}`
const OUT = process.env.SHOTS_DIR ?? '.shots'
const ONLY = process.argv.slice(2)

/** Mỗi mục: tên file · đường dẫn · chờ thấy chữ này rồi mới chụp. */
const SCREENS = [
  { name: 'welcome', url: '/welcome', wait: 'Bắt đầu' },
  { name: 'email', url: '/login?preview=1', wait: 'Email của bạn' },
  { name: 'otp', url: '/login/otp?preview=1', wait: 'Nhập mã' },
  { name: 'choice', url: '/setup?preview=1', wait: 'mã mời chưa' },
  { name: 'setup', url: '/setup/create?preview=1', wait: 'Kể tụi mình nghe' },
  { name: 'waiting', url: '/waiting?preview=1&solo=1', wait: 'Gửi lời mời' },
  { name: 'join-confirm', url: '/join?preview=1&code=A7K2M9', wait: 'mời bạn vào' },
  { name: 'home', url: '/?preview=1', wait: 'ngày bên nhau' },
  { name: 'home-waiting', url: '/?preview=1&solo=1', wait: 'Đang chờ' },
  { name: 'timeline', url: '/timeline?preview=1', wait: 'Kỉ niệm' },
  { name: 'timeline-grid', url: '/timeline?preview=1&view=grid', wait: 'Kỉ niệm' },
  { name: 'post', url: '/timeline/preview-post-0?preview=1', wait: 'Hoàng hôn' },
  { name: 'compose', url: '/compose?preview=1', wait: 'Thêm kỉ niệm' },
  { name: 'plan', url: '/plan?preview=1', wait: 'Sinh nhật' },
  { name: 'event-new', url: '/plan/new?preview=1', wait: 'Thêm dịp' },
  { name: 'eat', url: '/eat?preview=1', wait: 'Muốn thử' },
  { name: 'eat-spin', url: '/eat/spin?preview=1', wait: 'Tối nay ăn gì' },
  { name: 'settings', url: '/settings?preview=1', wait: 'Cài đặt' },
  { name: 'unpair', url: '/settings/unpair?preview=1', wait: 'Trước khi huỷ' },
]

async function waitForServer(timeoutMs = 40_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(1500) })
      if (res.ok) return true
    } catch {
      // chưa lên, thử lại
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

async function main() {
  let server = null
  if (!(await waitForServer(1500))) {
    console.log('Dev server chưa chạy — tự bật...')
    server = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
      stdio: 'ignore',
      shell: true,
    })
    if (!(await waitForServer())) {
      throw new Error(`Không bật được dev server ở ${BASE}`)
    }
  }

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch()
  const wanted = ONLY.length
    ? SCREENS.filter((s) => ONLY.includes(s.name))
    : SCREENS

  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'vi-VN',
      colorScheme: theme,
    })
    // Zustand persist giữ theme trong localStorage — đặt trước khi app chạy
    await context.addInitScript(
      ([value]) => {
        window.localStorage.setItem(
          'couple-space-ui',
          JSON.stringify({ state: { theme: value }, version: 0 }),
        )
      },
      [theme],
    )

    const page = await context.newPage()
    for (const screen of wanted) {
      const url = BASE + screen.url
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 })
        if (screen.wait) {
          await page.getByText(screen.wait, { exact: false }).first().waitFor({
            timeout: 8000,
          })
        }
        await page.waitForTimeout(250)
        const file = path.join(OUT, `${screen.name}-${theme}.png`)
        await page.screenshot({ path: file, fullPage: true })
        console.log('OK  ', file)
      } catch (err) {
        console.log('FAIL', screen.name, theme, '-', err.message.split('\n')[0])
      }
    }
    await context.close()
  }

  await browser.close()
  if (server) server.kill()
  console.log('\nẢnh nằm ở:', path.resolve(OUT))
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
