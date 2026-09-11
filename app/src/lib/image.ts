/** Nén ảnh ngay trên máy trước khi upload.
 *
 *  Ảnh gốc điện thoại 4–8 MB; về cạnh dài 1600px chất lượng 80% còn ~300 KB.
 *  Mắt thường không phân biệt được trên màn hình điện thoại nhưng dung lượng
 *  giảm hơn 10 lần — và đây là thứ gần như không sửa được về sau, vì ảnh cũ
 *  đã lỡ lưu bản gốc. Xem database-schema.md mục 13.
 */

const MAX_EDGE = 1600
const QUALITY = 0.8

export type CompressedImage = {
  blob: Blob
  width: number
  height: number
  /** Đuôi file tương ứng kiểu MIME đã nén */
  ext: string
}

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    // imageOrientation: giữ đúng chiều ảnh chụp dọc từ iPhone
    return createImageBitmap(file, { imageOrientation: 'from-image' })
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không đọc được ảnh'))
    img.src = URL.createObjectURL(file)
  })
}

function pickType(): { mime: string; ext: string } {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  // WebP nhỏ hơn JPEG ~25% ở cùng chất lượng, Safari 16+ hỗ trợ
  if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
    return { mime: 'image/webp', ext: 'webp' }
  }
  return { mime: 'image/jpeg', ext: 'jpg' }
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await loadBitmap(file)
  const srcW = 'width' in bitmap ? bitmap.width : 0
  const srcH = 'height' in bitmap ? bitmap.height : 0

  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH))
  const width = Math.round(srcW * scale)
  const height = Math.round(srcH * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas')
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height)
  if ('close' in bitmap) bitmap.close()

  const { mime, ext } = pickType()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, QUALITY),
  )
  if (!blob) throw new Error('Nén ảnh thất bại')

  return { blob, width, height, ext }
}

/** Đọc ngày chụp trong EXIF. Không có thì trả null và màn soạn bài
 *  mặc định hôm nay — không bắt người dùng gõ. */
export async function readExifDate(file: File): Promise<string | null> {
  try {
    const head = await file.slice(0, 128 * 1024).arrayBuffer()
    const view = new DataView(head)
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null

    let offset = 2
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break
      const marker = view.getUint8(offset + 1)
      const size = view.getUint16(offset + 2)
      // APP1 là khối chứa EXIF
      if (marker === 0xe1) {
        const text = new TextDecoder('latin1').decode(
          new Uint8Array(head, offset + 4, Math.min(size, 60_000)),
        )
        // DateTimeOriginal dạng "2026:03:15 18:04:22"
        const m = text.match(/(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/)
        if (m) return `${m[1]}-${m[2]}-${m[3]}`
        return null
      }
      offset += 2 + size
    }
    return null
  } catch {
    return null
  }
}
