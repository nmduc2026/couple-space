/** Kiểm tra mật khẩu trước khi gửi lên Supabase (ngưỡng mặc định ≥ 6). */
export function passwordError(password: string, confirm: string): string | null {
  if (password.length < 6) {
    return 'Mật khẩu cần ít nhất 6 ký tự.'
  }
  if (password !== confirm) {
    return 'Hai lần nhập mật khẩu chưa khớp.'
  }
  return null
}
