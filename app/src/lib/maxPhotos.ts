/** Số ảnh tối đa mỗi bài — cấu hình qua `VITE_MAX_PHOTOS` trong `.env`. */
export const MAX_PHOTOS = (() => {
  const raw = Number.parseInt(import.meta.env.VITE_MAX_PHOTOS ?? '', 10)
  return Number.isFinite(raw) && raw > 0 ? raw : 8
})()
