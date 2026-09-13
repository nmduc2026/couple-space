/*
 * Bộ icon nét, vẽ tay bằng SVG.
 *
 * Trước đây thanh tab và các lối tắt ở Home dùng emoji. Emoji là thứ làm app
 * lộ ra ngay là đồ dựng nhanh: mỗi hệ máy vẽ một kiểu (🗓️ trên iOS khác hẳn
 * trên Android), chúng nó nhiều màu nên đánh nhau với bảng màu của app, và
 * không có cách nào làm chúng nó sáng lên theo màu nhấn khi đang ở tab đó.
 * Không app iPhone thật nào dùng emoji làm icon điều hướng.
 *
 * Ở đây mọi icon dùng `stroke: currentColor`, nên chỉ cần đặt `text-accent`
 * hay `text-muted` ở thẻ cha là icon đổi màu theo — đúng cách chữ vẫn làm.
 *
 * Cùng một khổ 24×24 và cùng độ dày nét, để đặt cạnh nhau không cái nào nặng
 * hơn cái nào.
 */

type IconProps = {
  /** Cỡ tính theo px. Mặc định 24 — khổ gốc, nét sắc nhất. */
  size?: number
  className?: string
}

function Svg({
  size = 24,
  className = '',
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

/* ---- Thanh tab ---- */

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.6 10.6 12 3.8l8.4 6.8" />
    <path d="M6 9.6V20h12V9.6" />
    <path d="M10 20v-5h4v5" />
  </Svg>
)

export const IconPhoto = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="6.4" width="18.4" height="13.4" rx="3.2" />
    <path d="M8.6 6.4l1.3-2.2h4.2l1.3 2.2" />
    <circle cx="12" cy="13.2" r="3.6" />
  </Svg>
)

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.2" y="5" width="17.6" height="15.4" rx="3.2" />
    <path d="M3.2 9.8h17.6M8.2 3.4v3M15.8 3.4v3" />
  </Svg>
)

export const IconWallet = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="6" width="18.4" height="13" rx="3.2" />
    <path d="M2.8 10.4h18.4" />
    <circle cx="16.8" cy="14.8" r="1.1" />
  </Svg>
)

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
)

/* ---- Lối tắt ở Home ---- */

export const IconQuestion = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.4 12.2c0 4-3.8 7.2-8.4 7.2-1 0-2-.15-2.9-.42L4 20.4l1.5-3.6a6.8 6.8 0 0 1-1.9-4.6c0-4 3.8-7.2 8.4-7.2s8.4 3.2 8.4 7.2Z" />
    <path d="M10.2 10.4a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.6-1.9 2.8" />
    <path d="M12 16.1v.01" />
  </Svg>
)

export const IconMood = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M9 10.3v.01M15 10.3v.01" />
    <path d="M8.8 14.2a4.2 4.2 0 0 0 6.4 0" />
  </Svg>
)

export const IconLetter = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="3" />
    <path d="M3.4 8 12 13.4 20.6 8" />
  </Svg>
)

export const IconDice = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4" />
    <path d="M8.4 8.4v.01M15.6 8.4v.01M12 12v.01M8.4 15.6v.01M15.6 15.6v.01" />
  </Svg>
)

export const IconMap = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c3.6-4.1 6-7.2 6-10a6 6 0 1 0-12 0c0 2.8 2.4 5.9 6 10Z" />
    <circle cx="12" cy="10.8" r="2.3" />
  </Svg>
)

export const IconGift = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.4" y="8.6" width="17.2" height="11.8" rx="2.6" />
    <path d="M2.6 8.6h18.8M12 8.6v11.8" />
    <path d="M12 8.6S10.9 4 8.8 4a2.3 2.3 0 0 0 0 4.6ZM12 8.6S13.1 4 15.2 4a2.3 2.3 0 0 1 0 4.6Z" />
  </Svg>
)

export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.4l1.9 5.1 5.1 1.9-5.1 1.9L12 17.4l-1.9-5.1L5 10.4l5.1-1.9Z" />
    <path d="M18.6 16.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" />
  </Svg>
)

export const IconAlbum = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="3.6" width="14" height="14" rx="3" />
    <path d="M17 20.4H6a2.6 2.6 0 0 1-2.6-2.6V7" />
    <path d="m8.4 14.2 3-3.2 2.4 2.4 2-1.8 3.2 3.2" />
  </Svg>
)

export const IconBowl = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.2 11.2h17.6a8.8 8.8 0 0 1-8.8 8.4 8.8 8.8 0 0 1-8.8-8.4Z" />
    <path d="M9 8.2c-.9-1.4.5-2.3 0-3.8M13 8.2c-.9-1.4.5-2.3 0-3.8" />
  </Svg>
)

/* ---- Dùng chung ---- */

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.2 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.2a1.9 1.9 0 0 1-3.8 0v-.1a1.5 1.5 0 0 0-2.7-1.1l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.2a1.9 1.9 0 0 1 0-3.8h.1a1.5 1.5 0 0 0 1.1-2.7l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4v-.2a1.9 1.9 0 0 1 3.8 0v.1a1.5 1.5 0 0 0 2.6 1.1l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.9 1.9 0 0 1 0 3.8h-.1a1.5 1.5 0 0 0-1.4.9Z" />
  </Svg>
)

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.4 5.6 6.4 6.4-6.4 6.4" />
  </Svg>
)

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5.6 9.4 6.4 6.4 6.4-6.4" />
  </Svg>
)

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5.4M11 5.6 4.6 12l6.4 6.4" />
  </Svg>
)

export const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.8 11.3V4.6a.8.8 0 0 1 .8-.8h6.7c.2 0 .4.1.6.2l8 8a1.6 1.6 0 0 1 0 2.3l-5.2 5.2a1.6 1.6 0 0 1-2.3 0l-8-8a.8.8 0 0 1-.6-.2Z" />
    <path d="M7.8 7.8v.01" />
  </Svg>
)

export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
)
