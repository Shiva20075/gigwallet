import { useEffect, useState } from 'react'

// State that survives reloads. `init` builds the first-run value; `revive`
// may repair or reject whatever was stored (return null to fall back to init).
export function useLocalStorage(key, init, revive = (v) => v) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) {
        const revived = revive(JSON.parse(raw))
        if (revived != null) return revived
      }
    } catch {
      // corrupt or unavailable storage — start fresh
    }
    return init()
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or blocked — the app still works for this session
    }
  }, [key, value])

  return [value, setValue]
}
