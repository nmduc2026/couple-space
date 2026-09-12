/* Khi nào Tổng kết năm xuất hiện, và số liệu đã chốt hay chưa.
   Luật ở docs/features/p6-wrapped.md mục 4: hiện trên Home từ 15/12,
   chốt số liệu 31/12. Tách ra để test được — ngày tháng là chỗ dễ sai nhất. */

export type WrappedSeason = {
  /** Có đáng đẩy lên Home không. */
  visible: boolean
  /** Năm được tổng kết. Tháng 1 thì vẫn là năm vừa qua. */
  year: number
  /** Đã qua 31/12 của năm đó → số liệu không đổi nữa. */
  final: boolean
}

export function wrappedSeason(today: string): WrappedSeason {
  const [y, m, d] = today.split('-').map(Number)

  // Tháng 1 vẫn xem tổng kết của năm vừa qua — số liệu đã chốt
  if (m === 1) {
    return { visible: true, year: y - 1, final: true }
  }

  // Từ 15/12: tổng kết năm nay, còn chạy tới hết ngày 31
  if (m === 12 && d >= 15) {
    return { visible: true, year: y, final: false }
  }

  return { visible: false, year: y, final: false }
}
