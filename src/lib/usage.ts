// A small, local-only tally of how this browser has used Linkshare, so a quick
// answer can say "new" vs "returning" without any tracking. It lives in
// localStorage on the device and is only sent along with a quick answer.

const KEY = 'usage'

interface Usage {
  firstSeenAt: string | null // null: used Linkshare before we started counting
  lastVisitDay: string
  visitDays: number // distinct days with a visit
  drops: number
  receives: number
}

const today = () => new Date().toISOString().slice(0, 10)

const read = (): Usage | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Usage) : null
  } catch {
    return null
  }
}

const write = (u: Usage) => {
  try { localStorage.setItem(KEY, JSON.stringify(u)) } catch { /* storage blocked */ }
}

// Call once per page load, before anything else writes creatorId
export const recordVisit = () => {
  const u = read()
  if (!u) {
    // An existing device ID means they used Linkshare before this tally existed
    let knownBefore = false
    try { knownBefore = localStorage.getItem('creatorId') !== null } catch { /* ignore */ }
    write({
      firstSeenAt: knownBefore ? null : new Date().toISOString(),
      lastVisitDay: today(),
      visitDays: knownBefore ? 2 : 1,
      drops: 0,
      receives: 0
    })
    return
  }
  if (u.lastVisitDay !== today()) {
    write({ ...u, lastVisitDay: today(), visitDays: u.visitDays + 1 })
  }
}

const bump = (field: 'drops' | 'receives') => {
  const u = read()
  if (u) write({ ...u, [field]: u[field] + 1 })
}
export const recordDrop = () => bump('drops')
export const recordReceive = () => bump('receives')

export const getUsage = () => {
  const u = read()
  return {
    first_seen_at: u?.firstSeenAt ?? null,
    visit_days: u?.visitDays ?? null,
    drops_made: u?.drops ?? null,
    codes_received: u?.receives ?? null,
    // Returning = came back on another day, or used it before counting began
    is_returning: u ? u.visitDays > 1 || u.firstSeenAt === null : null
  }
}
