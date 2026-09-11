/** Kho câu hỏi cho "Câu hỏi mỗi ngày".
 *
 *  Để trong code chứ không để trong DB: đổi kho không phải migrate dữ liệu,
 *  và `question_answers` chỉ lưu chỉ số. Thêm câu mới thì **nối vào cuối
 *  mảng**, đừng chèn vào giữa — chỉ số của câu cũ sẽ lệch.
 */

export type QuestionTone = 'nhẹ' | 'vui' | 'sâu' | 'nhìn lại' | 'nhìn tới'

export type Question = {
  text: string
  tone: QuestionTone
}

export const QUESTIONS: Question[] = [
  // ---- nhẹ ----
  { text: 'Hôm nay có gì làm bạn mỉm cười?', tone: 'nhẹ' },
  { text: 'Bữa ngon nhất tuần này của bạn là gì?', tone: 'nhẹ' },
  { text: 'Bài hát đang lặp đi lặp lại trong đầu bạn?', tone: 'nhẹ' },
  { text: 'Nếu được ngủ nướng thêm một tiếng, bạn sẽ làm gì?', tone: 'nhẹ' },
  { text: 'Thứ nhỏ xíu nào hôm nay làm bạn thấy dễ chịu?', tone: 'nhẹ' },
  { text: 'Bạn thích buổi sáng hay buổi tối hơn? Vì sao?', tone: 'nhẹ' },
  { text: 'Món ăn nào bạn có thể ăn cả tuần không chán?', tone: 'nhẹ' },
  { text: 'Chỗ nào trong nhà là chỗ bạn thích nhất?', tone: 'nhẹ' },
  { text: 'Mùi hương nào làm bạn thấy bình yên?', tone: 'nhẹ' },
  { text: 'Bạn hay mở app nào nhất trên điện thoại?', tone: 'nhẹ' },
  { text: 'Thời tiết kiểu gì hợp với tâm trạng bạn hôm nay?', tone: 'nhẹ' },
  { text: 'Bạn thích đi bộ, đi xe hay ngồi yên một chỗ?', tone: 'nhẹ' },
  { text: 'Một thứ bạn mua gần đây mà thấy đáng tiền?', tone: 'nhẹ' },
  { text: 'Bạn uống gì đầu tiên khi thức dậy?', tone: 'nhẹ' },
  { text: 'Màu nào bạn thấy hợp với mình nhất?', tone: 'nhẹ' },
  { text: 'Hôm nay bạn nói câu gì nhiều nhất?', tone: 'nhẹ' },
  { text: 'Bạn thích nhà gọn gàng hay hơi bừa một chút?', tone: 'nhẹ' },
  { text: 'Nếu chiều nay được nghỉ, bạn đi đâu?', tone: 'nhẹ' },
  { text: 'Món tráng miệng bạn không bao giờ từ chối?', tone: 'nhẹ' },
  { text: 'Bạn có thói quen nhỏ nào mà ít người biết?', tone: 'nhẹ' },

  // ---- vui ----
  { text: 'Nếu tụi mình là một cặp trong phim, phim đó tên gì?', tone: 'vui' },
  { text: 'Người kia làm gì mà bạn thấy buồn cười nhất?', tone: 'vui' },
  { text: 'Nếu được đổi nghề một ngày, bạn làm nghề gì?', tone: 'vui' },
  { text: 'Siêu năng lực vô dụng nào bạn muốn có?', tone: 'vui' },
  { text: 'Tụi mình cãi nhau vì chuyện nhỏ xíu nào buồn cười nhất?', tone: 'vui' },
  { text: 'Nếu nuôi thú cưng, bạn đặt tên nó là gì?', tone: 'vui' },
  { text: 'Bạn nghĩ người kia sẽ sống sót mấy ngày trong rừng?', tone: 'vui' },
  { text: 'Nếu phải hát karaoke một bài, bạn chọn bài nào?', tone: 'vui' },
  { text: 'Món nào người kia nấu mà bạn khen cho vui lòng thôi?', tone: 'vui' },
  { text: 'Nếu trúng số, tiêu khoản đầu tiên vào việc gì?', tone: 'vui' },
  { text: 'Biệt danh xấu xí nào bạn muốn đặt cho người kia?', tone: 'vui' },
  { text: 'Ai là người dễ dỗ hơn trong hai đứa?', tone: 'vui' },
  { text: 'Trò gì bạn chơi dở nhất?', tone: 'vui' },
  { text: 'Nếu được xoá một thói quen của người kia, bạn xoá cái nào?', tone: 'vui' },
  { text: 'Tình huống xấu hổ nhất bạn từng gặp trước mặt người kia?', tone: 'vui' },
  { text: 'Bạn nghĩ mình giống con vật nào nhất?', tone: 'vui' },
  { text: 'Nếu tụi mình mở quán, quán bán gì?', tone: 'vui' },
  { text: 'Ai sẽ là người quên ngày kỉ niệm trước?', tone: 'vui' },
  { text: 'Câu nói cửa miệng của người kia là gì?', tone: 'vui' },
  { text: 'Nếu phải sống thiếu một thứ: cà phê hay điện thoại?', tone: 'vui' },

  // ---- sâu ----
  { text: 'Lúc nào bạn thấy được thương nhất?', tone: 'sâu' },
  { text: 'Điều gì bạn sợ nhưng chưa nói ra?', tone: 'sâu' },
  { text: 'Bạn cần gì ở người kia mà ngại mở lời?', tone: 'sâu' },
  { text: 'Khi buồn, bạn muốn được ở một mình hay được ôm?', tone: 'sâu' },
  { text: 'Điều gì làm bạn thấy an toàn trong mối quan hệ này?', tone: 'sâu' },
  { text: 'Bạn học được gì về mình từ khi yêu người kia?', tone: 'sâu' },
  { text: 'Lần gần nhất bạn thấy tự hào về người kia là khi nào?', tone: 'sâu' },
  { text: 'Có chuyện gì bạn vẫn còn để bụng không?', tone: 'sâu' },
  { text: 'Bạn định nghĩa "được yêu" là như thế nào?', tone: 'sâu' },
  { text: 'Điều gì ở bản thân bạn khó chấp nhận nhất?', tone: 'sâu' },
  { text: 'Bạn muốn người kia hiểu điều gì về gia đình bạn?', tone: 'sâu' },
  { text: 'Khi mệt, bạn muốn nghe câu gì nhất?', tone: 'sâu' },
  { text: 'Bạn đang mang nỗi lo nào mà chưa kể?', tone: 'sâu' },
  { text: 'Điều gì làm bạn tin là tụi mình đi được đường dài?', tone: 'sâu' },
  { text: 'Bạn tha thứ nhanh hay lâu? Vì sao?', tone: 'sâu' },
  { text: 'Lần nào bạn thấy tụi mình gần nhau nhất?', tone: 'sâu' },
  { text: 'Có điều gì bạn muốn tụi mình làm khác đi không?', tone: 'sâu' },
  { text: 'Bạn cần bao nhiêu không gian riêng để thấy dễ thở?', tone: 'sâu' },
  { text: 'Điều gì ở người kia làm bạn thấy được tôn trọng?', tone: 'sâu' },
  { text: 'Bạn muốn được an ủi kiểu nào khi thất bại?', tone: 'sâu' },

  // ---- nhìn lại ----
  { text: 'Lần đầu gặp nhau, bạn nghĩ gì trong đầu?', tone: 'nhìn lại' },
  { text: 'Khoảnh khắc nào làm bạn biết mình thích người kia?', tone: 'nhìn lại' },
  { text: 'Chuyến đi nào bạn nhớ nhất?', tone: 'nhìn lại' },
  { text: 'Tin nhắn nào của người kia bạn còn nhớ nguyên văn?', tone: 'nhìn lại' },
  { text: 'Năm vừa rồi tụi mình thay đổi điều gì nhiều nhất?', tone: 'nhìn lại' },
  { text: 'Bữa ăn nào cùng nhau bạn nhớ lâu nhất?', tone: 'nhìn lại' },
  { text: 'Lần nào bạn thấy người kia mạnh mẽ nhất?', tone: 'nhìn lại' },
  { text: 'Có quyết định nào của tụi mình bạn thấy đúng nhất?', tone: 'nhìn lại' },
  { text: 'Ngày nào bạn muốn sống lại một lần nữa?', tone: 'nhìn lại' },
  { text: 'Hồi mới quen, bạn hiểu lầm gì về người kia?', tone: 'nhìn lại' },
  { text: 'Món quà nào bạn nhớ nhất, dù nhỏ?', tone: 'nhìn lại' },
  { text: 'Lần cãi nhau nào dạy bạn nhiều nhất?', tone: 'nhìn lại' },
  { text: 'Bạn của một năm trước sẽ ngạc nhiên vì điều gì hôm nay?', tone: 'nhìn lại' },
  { text: 'Thói quen nào của tụi mình tự nhiên hình thành lúc nào không hay?', tone: 'nhìn lại' },
  { text: 'Ai là người chủ động nhiều hơn hồi đầu?', tone: 'nhìn lại' },

  // ---- nhìn tới ----
  { text: 'Cuối tuần này bạn muốn làm gì cùng nhau?', tone: 'nhìn tới' },
  { text: 'Ba năm nữa bạn muốn tụi mình ở đâu?', tone: 'nhìn tới' },
  { text: 'Có nơi nào bạn muốn đi mà chưa nói không?', tone: 'nhìn tới' },
  { text: 'Bạn muốn học gì mới trong năm nay?', tone: 'nhìn tới' },
  { text: 'Thói quen nào bạn muốn tụi mình bắt đầu?', tone: 'nhìn tới' },
  { text: 'Nếu để dành được một khoản, bạn muốn dùng vào gì?', tone: 'nhìn tới' },
  { text: 'Bạn hình dung một ngày lý tưởng của tụi mình thế nào?', tone: 'nhìn tới' },
  { text: 'Có điều gì bạn muốn thử một lần trong đời không?', tone: 'nhìn tới' },
  { text: 'Bạn muốn ăn mừng dịp tới như thế nào?', tone: 'nhìn tới' },
  { text: 'Tháng này bạn muốn tụi mình bớt làm gì lại?', tone: 'nhìn tới' },
  { text: 'Bạn muốn nhà của tụi mình sau này trông ra sao?', tone: 'nhìn tới' },
  { text: 'Có kỹ năng nào bạn muốn người kia dạy cho mình?', tone: 'nhìn tới' },
  { text: 'Mùa tới bạn mong chờ điều gì nhất?', tone: 'nhìn tới' },
  { text: 'Nếu có một tuần rảnh hoàn toàn, tụi mình làm gì?', tone: 'nhìn tới' },
  { text: 'Bạn muốn tụi mình giữ được điều gì mãi?', tone: 'nhìn tới' },
]

export const BANK_SIZE = QUESTIONS.length

/** Câu của ngày — xáo cố định theo `coupleId` nên hai máy luôn ra cùng
 *  câu, mỗi đôi một thứ tự riêng, và quay vòng khi hết kho.
 *  Đây là nơi duy nhất tính chỉ số; DB chỉ lưu lại con số đã tính. */
export function questionIndexFor(coupleId: string, ymd: string): number {
  const days = Math.floor(Date.UTC(...ymdTuple(ymd)) / 86_400_000)
  const offset = hashOffset(coupleId)
  return (((days + offset) % BANK_SIZE) + BANK_SIZE) % BANK_SIZE
}

function ymdTuple(ymd: string): [number, number, number] {
  const [y, m, d] = ymd.split('-').map(Number)
  return [y, m - 1, d]
}

function hashOffset(id: string) {
  let hash = 0
  for (const ch of id) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 100_000
  }
  return hash
}
