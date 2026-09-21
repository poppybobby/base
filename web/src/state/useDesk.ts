import { useCallback, useMemo, useSyncExternalStore } from 'react'

const SAVED_KEY = 'lotnote.saved'
const COMPARE_KEY = 'lotnote.compare'
const NOTES_KEY = 'lotnote.notes'

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeList(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids))
  window.dispatchEvent(new Event('lotnote-store'))
}

function readNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function subscribe(cb: () => void) {
  window.addEventListener('lotnote-store', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('lotnote-store', cb)
    window.removeEventListener('storage', cb)
  }
}

export function useDesk() {
  const savedRaw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(SAVED_KEY) ?? '[]',
    () => '[]',
  )
  const compareRaw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(COMPARE_KEY) ?? '[]',
    () => '[]',
  )
  const notesRaw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(NOTES_KEY) ?? '{}',
    () => '{}',
  )

  const saved = useMemo(() => JSON.parse(savedRaw) as string[], [savedRaw])
  const compare = useMemo(() => JSON.parse(compareRaw) as string[], [compareRaw])
  const notes = useMemo(() => JSON.parse(notesRaw) as Record<string, string>, [notesRaw])

  const toggleSaved = useCallback((id: string) => {
    const cur = readList(SAVED_KEY)
    writeList(
      SAVED_KEY,
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    )
  }, [])

  const toggleCompare = useCallback((id: string): boolean => {
    const cur = readList(COMPARE_KEY)
    if (cur.includes(id)) {
      writeList(
        COMPARE_KEY,
        cur.filter((x) => x !== id),
      )
      return true
    }
    if (cur.length >= 3) return false
    writeList(COMPARE_KEY, [...cur, id])
    return true
  }, [])

  const setNote = useCallback((id: string, text: string) => {
    const cur = readNotes()
    cur[id] = text
    localStorage.setItem(NOTES_KEY, JSON.stringify(cur))
    window.dispatchEvent(new Event('lotnote-store'))
  }, [])

  return { saved, compare, notes, toggleSaved, toggleCompare, setNote }
}
