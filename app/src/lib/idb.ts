/* Lớp mỏng bọc IndexedDB. Dùng IndexedDB chứ không phải localStorage vì
   hàng đợi phải giữ được **Blob ảnh** qua lần mở app sau — localStorage chỉ
   chứa chuỗi, và nhét ảnh base64 vào đó thì vượt hạn mức ngay tấm thứ hai. */

const DB_NAME = 'couple-space'
const DB_VERSION = 1
export const OUTBOX = 'outbox'

let handle: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (handle) return handle
  handle = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(OUTBOX)) {
        db.createObjectStore(OUTBOX, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Không mở được IndexedDB'))
  })
  return handle
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  body: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = body(tx.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('IndexedDB lỗi'))
      }),
  )
}

export function idbPut<T>(store: string, value: T) {
  return run(store, 'readwrite', (s) => s.put(value))
}

export function idbDelete(store: string, key: IDBValidKey) {
  return run(store, 'readwrite', (s) => s.delete(key))
}

export function idbAll<T>(store: string): Promise<T[]> {
  return run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)
}
