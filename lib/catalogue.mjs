import { compare, PATREON_URL } from './format.mjs'

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }
const NUM = '(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)'
const toNumber = (s) => (/^\d+$/.test(s) ? Number(s) : WORDS[s.toLowerCase()] ?? null)
const squash = (s) => s.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '')

/** "Joke | Series (Part 2)" → { joke: "Joke", seriesPart: "Series (Part 2)" } */
export function splitTitle(title) {
  const i = title.lastIndexOf('|')
  if (i < 0) return { joke: title.trim(), seriesPart: title.trim() }
  return { joke: title.slice(0, i).trim(), seriesPart: title.slice(i + 1).trim() }
}

/**
 * The series half of a title without its part number or trailing guest:
 * "Stalin: Barbarossa (Part 4)" → "Stalin: Barbarossa", "Nero (Part 2) with James McCann" → "Nero"
 */
export function cleanLabel(seriesPart) {
  return seriesPart
    .replace(/\([^)]*(?:\)|$)/g, '') // also an unclosed "(Part 4/4"
    .replace(/\[[^\]]*(?:\]|$)/g, '')
    .replace(/\bpart\s+\d{1,2}\b/i, '')
    .replace(/\s+with\s+[A-Z][^\s]*(?:\s+[A-Z][^\s]*)*\s*$/, '')
    .replace(/\s+:/g, ':')
    .replace(/\s+/g, ' ')
    .trim()
}

// "(Part 2/10)", "(Part One)", "[Part 1]", and the odd unclosed "(Part 4/4"
const PART_WORDS = new RegExp(`[(\\[]\\s*part\\s+${NUM}\\s*(?:(?:\\/|of)\\s*(\\d{1,2}))?\\s*(?:[)\\]]|$)`, 'i')
// "(9/10)"
const PART_FRACTION = /\(\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:\)|$)/

function partInBrackets(s) {
  let m = s.match(PART_WORDS)
  if (m) return { p: toNumber(m[1]), of: m[2] ? Number(m[2]) : null }
  m = s.match(PART_FRACTION)
  if (m) return { p: Number(m[1]), of: Number(m[2]) }
  return null
}

/**
 * Part number (and total, when the title gives one). Looks at the series half of the title,
 * then the joke half (some series put it there), then the description.
 */
export function partOf(seriesPart, text = '', joke = '') {
  let found = partInBrackets(seriesPart)
  if (found) return found
  let m = seriesPart.match(/\bpart\s+(\d{1,2})\b/i)
  if (m) return { p: Number(m[1]), of: null }
  found = partInBrackets(joke)
  if (found) return { ...found, inJoke: true }
  m = text.match(new RegExp(`\\(\\s*part\\s+${NUM}\\s*(?:(?:\\/|of)\\s*(\\d{1,2}))?\\s*\\)`, 'i'))
  if (m) return { p: toNumber(m[1]), of: m[2] ? Number(m[2]) : null }
  m = text.match(/\bpart\s+(\d{1,2})\s+of\s+(\d{1,2})\b/i)
  if (m) return { p: Number(m[1]), of: Number(m[2]) }
  return { p: null, of: null }
}

/**
 * Titles like "Britain has a Cuck Dad: Clement Attlee (Part 1) | Post War British Prime Ministers"
 * carry the part and its subject on the joke side. Split those out.
 */
function splitJokePart(joke) {
  const bare = joke.replace(PART_WORDS, '').replace(PART_FRACTION, '').trim()
  const colon = bare.lastIndexOf(':')
  if (colon < 0) return { joke: bare, sub: '' }
  return { joke: bare.slice(0, colon).trim(), sub: bare.slice(colon + 1).trim() }
}

/**
 * First series whose title rule matches, then the first whose description rule matches.
 * Main episodes are matched on the series half of the title; bonus titles have no
 * joke half, so they're matched on the whole thing.
 */
export function findSeries(episode, seriesList, { wholeTitle = false } = {}) {
  const subject = wholeTitle ? episode.title : splitTitle(episode.title).seriesPart
  return (
    seriesList.find((s) => s.title && s.title.test(subject)) ||
    seriesList.find((s) => s.text && s.text.test(episode.text || '')) ||
    null
  )
}

/**
 * What this part is about, when the title names more than the series:
 * "Stalin: Famine" → "Famine", "Beethoven: The Great Composers" → "Beethoven".
 */
export function subtitleOf(label, series) {
  if (squash(label) === squash(series.name)) return ''
  const colon = label.indexOf(':')
  if (colon > 0) {
    const before = label.slice(0, colon).trim()
    const after = label.slice(colon + 1).trim()
    const names = [squash(series.name), squash(series.short)]
    if (names.includes(squash(before))) return after
    if (names.includes(squash(after))) return before
  }
  return label
}

/** A date range set per subject, e.g. per Prime Minister, optionally split further by part. */
function subjectRange(series, sub, p) {
  if (!series.subjects || !sub) return null
  const hit = Object.entries(series.subjects).find(([name]) => squash(name) === squash(sub))
  if (!hit) return null
  const value = hit[1]
  if (Array.isArray(value)) return value
  return (p != null && value[p]) || Object.values(value)[0]
}

/** Series named "The History of …" get their own section on the site. */
export const isHistoryOf = (name) => /^the history of\b/i.test(name)

const latest = (eps) => eps.reduce((m, e) => (e.date > m ? e.date : m), '')

/**
 * Join episodes with the series mapping.
 * @param {(import('./feed.mjs').Episode & { bonus?: boolean, spotify?: string })[]} episodes  Feed episodes plus bonus ones.
 * @param {import('./series.mjs').Series[]} seriesList  Main series.
 * @param {Date|string|number} now  Used for the "New" badge, so pass the build time.
 * @param {Record<string, { youtube?: string, spotify?: string }>} links  From data/links.json, keyed by guid.
 * @param {import('./series.mjs').Series[]} bonusList  Series for bonus episodes. Bonus episodes only match these.
 */
export function buildCatalogue(episodes, seriesList, now = Date.now(), links = {}, bonusList = []) {
  const nowMs = new Date(now).getTime()
  const allSeries = [...seriesList, ...bonusList.map((s) => ({ ...s, bonus: true }))]
  const grouped = new Map(allSeries.map((s) => [s.id, []]))
  const undated = []

  for (const ep of episodes) {
    const bonus = !!ep.bonus
    const split = splitTitle(ep.title)
    const label = cleanLabel(bonus ? ep.title : split.seriesPart)
    const { p, of, inJoke } = partOf(split.seriesPart, ep.text, split.joke)
    const s = bonus ? findSeries(ep, allSeries.filter((x) => x.bonus), { wholeTitle: true }) : findSeries(ep, seriesList)
    // Series dated per subject name the subject on the joke side: "Joke: Harold Wilson (Part 2) | Series"
    const subjectInJoke = !bonus && (inJoke || (s?.subjects && split.joke.includes(':')))
    const { joke, sub: jokeSub } = subjectInJoke ? splitJokePart(split.joke) : { joke: bonus ? ep.title : split.joke, sub: '' }
    // Bonus titles are already the whole story, so they only get a subtitle when it's a named subject.
    const sub = jokeSub || (s && (!bonus || s.subjects) ? subtitleOf(label, s) : '')
    const age = (nowMs - Date.parse(ep.date)) / 864e5
    const epLinks = { ...(links[ep.guid] || {}) }
    if (bonus) {
      if (ep.spotify) epLinks.spotify = ep.spotify
      epLinks.patreon = PATREON_URL
    }
    const entry = {
      guid: ep.guid,
      title: ep.title,
      joke,
      label,
      bonus,
      blurb: ep.blurb || '',
      date: ep.date,
      duration: ep.duration,
      p,
      of,
      isNew: age >= -1 && age <= 14,
      links: epLinks,
      series: s ? { id: s.id, name: s.name, short: s.short, theme: isHistoryOf(s.name), bonus: !!s.bonus } : null,
      sub,
      range: s ? subjectRange(s, sub, p) || (p != null && s.parts && s.parts[p]) || s.range : null,
    }
    if (s) grouped.get(s.id).push(entry)
    else undated.push(entry)
  }

  const series = allSeries
    .map((s) => {
      const eps = grouped.get(s.id)
      // Part order when every episode has a part number, otherwise release order.
      const byPart = eps.every((e) => e.p != null)
      eps.sort((a, b) => (byPart ? compare([a.p, a.date], [b.p, b.date]) : a.date.localeCompare(b.date)))
      return { id: s.id, name: s.name, short: s.short, range: s.range ?? null, theme: isHistoryOf(s.name), bonus: !!s.bonus, eps }
    })
    .filter((s) => s.eps.length)
    // Series without a date ("odds and ends") go last.
    .sort((a, b) =>
      compare(
        [a.range ? a.range[0] : Infinity, a.range ? a.range[1] : Infinity, a.name],
        [b.range ? b.range[0] : Infinity, b.range ? b.range[1] : Infinity, b.name],
      ),
    )

  // Undated episodes, grouped by the series name in their title so it's clear what to add next.
  const groups = new Map()
  for (const e of undated) {
    const label = e.label.split(':')[0].trim() || e.title
    const key = `${e.bonus ? 'bonus:' : ''}${label.toLowerCase()}`
    if (!groups.has(key)) groups.set(key, { label, bonus: e.bonus, eps: [] })
    groups.get(key).eps.push(e)
  }
  const undatedGroups = [...groups.values()]
    .map((g) => ({ ...g, eps: g.eps.sort((a, b) => compare([a.p ?? 99, a.date], [b.p ?? 99, b.date])) }))
    .sort((a, b) => latest(b.eps).localeCompare(latest(a.eps)))

  const dated = series.filter((s) => s.range && !s.theme)
  const count = (pred) => episodes.filter(pred).length
  return {
    series,
    undated: undatedGroups,
    stats: {
      episodes: count((e) => !e.bonus),
      bonus: count((e) => e.bonus),
      undated: undated.filter((e) => !e.bonus).length,
      undatedBonus: undated.filter((e) => e.bonus).length,
      dated: count((e) => !e.bonus) - undated.filter((e) => !e.bonus).length,
      series: series.filter((s) => !s.bonus).length,
      bonusSeries: series.filter((s) => s.bonus).length,
      earliest: dated.length ? Math.min(...dated.map((s) => s.range[0])) : null,
      latest: dated.length ? Math.max(...dated.filter((s) => !s.bonus).map((s) => s.range[1])) : null,
    },
  }
}
