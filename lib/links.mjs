// Matches episodes from the RSS feed to the same episode on YouTube or Spotify.
// Titles usually line up exactly, but not always (YouTube sometimes gets a different title),
// so matching falls back through looser checks and finally the release date.
import { cleanLabel, partOf, splitTitle } from './catalogue.mjs'

/** Lowercase, accents and punctuation stripped: "Napoleon’s Final Exile (10/10)" → "napoleon s final exile 10 10" */
export function normalise(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** The ways an episode can be recognised, from most to least specific. */
export function titleKeys(title, text = '') {
  const { joke, seriesPart } = splitTitle(title)
  const { p } = partOf(seriesPart, text)
  const label = title.includes('|') ? normalise(cleanLabel(seriesPart)) : ''
  return {
    full: normalise(title),
    joke: title.includes('|') && normalise(joke).split(' ').length >= 3 ? normalise(joke) : null,
    series: label && p != null ? `${label}#${p}` : null,
    label,
    p,
  }
}

/** "PT1H2M3S" → 3723 */
export function isoDurationSeconds(d) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(d || '')
  if (!m) return 0
  return (Number(m[1]) || 0) * 86400 + (Number(m[2]) || 0) * 3600 + (Number(m[3]) || 0) * 60 + (Number(m[4]) || 0)
}

/**
 * @param {{ guid: string, title: string, date: string, text?: string }[]} episodes
 * @param {{ url: string, title: string, date: string, text?: string }[]} candidates
 * @returns {Map<string, string>} episode guid → URL
 */
export function matchLinks(episodes, candidates, { days = 1 } = {}) {
  const pool = candidates.map((c) => ({ ...c, keys: titleKeys(c.title, c.text), t: Date.parse(c.date), body: normalise(c.text), used: false }))
  const eps = episodes.map((e) => ({ guid: e.guid, keys: titleKeys(e.title, e.text), t: Date.parse(e.date), duration: e.duration }))
  const found = new Map()

  const passes = [
    // Exact title
    (x, c) => x.keys.full === c.keys.full,
    // Same joke title, different series wording
    (x, c) => x.keys.joke && x.keys.joke === c.keys.joke,
    // Same series and part, different joke
    (x, c) => x.keys.series && x.keys.series === c.keys.series,
    // Title is completely different, but the description names the series and part
    (x, c) => x.keys.label && x.keys.p != null && c.body.includes(x.keys.label) && partOf('', c.text || '').p === x.keys.p,
  ]

  for (const same of passes) {
    for (const x of eps) {
      if (found.has(x.guid)) continue
      const hits = pool.filter((c) => !c.used && same(x, c))
      if (!hits.length) continue
      hits.sort((a, b) => Math.abs(a.t - x.t) - Math.abs(b.t - x.t))
      hits[0].used = true
      found.set(x.guid, hits[0].url)
    }
  }

  // Last resort: an episode and a video released within a day of each other and of similar length,
  // with nothing else like that nearby on either side. The length check stops a 3-hour supercut
  // released the same day from blocking (or stealing) the match.
  const window = days * 864e5
  const sameLength = (a, b) => !a || !b || Math.abs(a - b) <= Math.max(600, 0.2 * Math.max(a, b))
  const near = (c, x) => Math.abs(c.t - x.t) <= window && sameLength(c.duration, x.duration)
  const openEps = eps.filter((x) => !found.has(x.guid))
  for (const x of openEps) {
    const options = pool.filter((c) => !c.used && near(c, x))
    if (options.length !== 1) continue
    const rivals = openEps.filter((y) => !found.has(y.guid) && near(options[0], y))
    if (rivals.length !== 1) continue
    options[0].used = true
    found.set(x.guid, options[0].url)
  }

  return found
}

/**
 * After a platform lookup fails, keep that platform's links from the last good build
 * instead of dropping them. Only fills gaps, and only for episodes still in the feed.
 * @param {Record<string, Record<string, string>>} links  This run's links, updated in place.
 * @param {Record<string, Record<string, string>>} last  The previous build's links.
 * @param {'youtube' | 'spotify'} key
 * @param {Iterable<string>} guids  Episodes in this run's feed.
 * @returns {number} How many links were kept.
 */
export function keepLastLinks(links, last, key, guids) {
  let kept = 0
  for (const guid of guids) {
    const url = last?.[guid]?.[key]
    if (url && !links[guid]?.[key]) {
      ;(links[guid] ||= {})[key] = url
      kept++
    }
  }
  return kept
}
