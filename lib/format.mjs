// Years are plain numbers: negative for BC, PRESENT for "still going".
export const PRESENT = 9999

/** Bonus episodes are Patreon exclusives; there's no per-episode Patreon link, so this is the show's page. */
export const PATREON_URL = 'https://www.patreon.com/fintaylor'

/** Eras used for list headings and the timeline's stretched axis (w = share of timeline width). */
export const ERAS = [
  { name: 'Prehistory', from: -2000000, to: -3000, w: 0.07 },
  { name: 'Ancient world', from: -3000, to: 500, w: 0.13 },
  { name: 'Medieval', from: 500, to: 1500, w: 0.15 },
  { name: 'Early modern', from: 1500, to: 1789, w: 0.2 },
  { name: 'Modern', from: 1789, to: 1945, w: 0.25 },
  { name: 'Post-war', from: 1945, to: PRESENT, w: 0.2 },
]

const num = (n) => (n >= 1e6 ? `${n / 1e6} million` : n >= 10000 ? n.toLocaleString('en-GB') : String(n))

export function formatYear(y) {
  if (y >= PRESENT) return 'present'
  if (y < 0) return `${num(-y)} BC`
  if (y < 1000) return `AD ${y}`
  return String(y)
}

/** [1805, 1805] → "1805", [-10, 54] → "10 BC – AD 54", [1780, PRESENT] → "1780–present" */
export function formatRange(range) {
  if (!range) return ''
  const [a, b] = range
  if (a === b) return formatYear(a)
  const end = b >= PRESENT ? 'present' : null
  if (a < 0 && b < 0) return `${num(-a)} – ${num(-b)} BC`
  if (a < 0) return `${num(-a)} BC – ${end || (b < 1000 ? `AD ${b}` : b)}`
  if (a < 1000) return `AD ${a}–${end || b}`
  return `${a}–${end || b}`
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Which era heading a series sits under: the era its main events start in.
 * The list is sorted by that same start year, so the headings always run in order.
 */
export function eraIndex([start]) {
  const i = ERAS.findIndex((e) => start < e.to)
  return i < 0 ? ERAS.length - 1 : i
}

/** Compare arrays element by element, for multi-key sorts. */
export function compare(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1
    if (a[i] > b[i]) return 1
  }
  return 0
}
