import { useState } from 'react'
import { Field } from './ui'
import { IconEye, IconEyeOff } from './icons'
import { input } from '../lib/ui-classes'

/** Ô mật khẩu có nút hiện/ẩn — dùng chung login, đặt MK, đặt lại MK. */
export function PasswordField({
  label,
  value,
  onChange,
  disabled,
  autoComplete = 'new-password',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoComplete?: string
  placeholder?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${input} pr-12`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          disabled={disabled}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-muted transition hover:text-text active:scale-95 disabled:opacity-50"
        >
          {show ? <IconEyeOff size={20} /> : <IconEye size={20} />}
        </button>
      </div>
    </Field>
  )
}
