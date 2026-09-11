import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

type UiStore = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

/** State chi ton tai tren may (UI). Khong chua du lieu Supabase. */
export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'couple-space-ui' },
  ),
)
