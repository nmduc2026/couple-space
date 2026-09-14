import { QueryClient } from '@tanstack/react-query'

/** Mot lan duy nhat o cap module — khong tao trong component. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 phut — du lieu cap doi doi cham
      refetchOnWindowFocus: true, // mo lai PWA thi tu moi
      retry: 1,
    },
  },
})
