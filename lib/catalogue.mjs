import { compare } from './format.mjs'

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }
const toNumber = (s) => (/^\d+$/.test(s) ? Number(s) : WORDS[s.toLowerCase()] ?? null)
const squash = (s) => s.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '')

/** "Joke | Series (Part 2)" → { joke: "Joke", seriesPart: "Series (Part 2)" } */
export function splitTitle(title) {
  const i = title.lastIndexOf('|')
  if (i < 0) return { joke: title.trim(), seriesPart: title.trim() }
  return { joke: title.slice(0, i).trim(), seriesPart: title.slice(i + 1).trim() }
}

/** The series half of a title without its part number: "Stalin: Barbarossa (Part 4)" → "Stalin: Barbarossa" */
export function cleanLabel(seriesPart) {
  return seriesPart
    .replace(/\([^)]*\)/g, '')
    .replace(/\bpart\s+\d{1,2}\b/i, '')
    .replace(/\s+:/g, ':')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Part number (and total, when the title gives one) from the title, falling back to the description. */
export function partOf(seriesPart, text = '') {
  let m = seriesPart.match(/\((?:part\s*)?(\d{1,2})(?:\s*(?:\/|of)\s*(\d{1,2}))?\s*\)/i)
  if (m) return { p: Number(m[1]), of: m[2] ? Number(m[2]) : null }
  m = seriesPart.match(/\bpart\s+(\d{1,2})\b/i)
  if (m) return { p: Number(m[1]), of: null }
  m = text.match(/\(\s*part\s+(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:(?:\/|of)\s*(\d{1,2}))?\s*\)/i)
  if (m) return { p: toNumber(m[1]), of: m[2] ? Number(m[2]) : null }
  m = text.match(/\bpart\s+(\d{1,2})\s+of\s+(\d{1,2})\b/i)
  if (m) return { p: Number(m[1]), of: Number(m[2]) }
  return { p: null, of: null }
}

/** First series whose title rule matches, then the first whose description rule matches. */
export function findSeries(episode, seriesList) {
  const { seriesPart } = splitTitle(episode.title)
  return (
    seriesList.find((s) => s.title && s.title.test(seriesPart)) ||
    seriesList.find((s) => s.text && s.text.test(episode.text || '')) ||
    null
  )
}

/** What this part is about, when the title names more than the series: "Stalin: Famine" → "Famine". */
export function subtitleOf(label, series) {
  if (squash(label) === squash(series.name)) return ''
  const colon = label.indexOf(':')
  if (colon > 0) {
    const prefix = squash(label.slice(0, colon))
    if (prefix === squash(series.name) || prefix === squash(series.short)) return label.slice(colon + 1).trim()
  }
  return label
}

/**
 * Join episodes from the feed with the series mapping.
 * @param {import('./feed.mjs').Episode[]} episodes
 * @param {import('./series.mjs').Series[]} seriesList
 * @param {Date|string|number} now  Used for the "New" badge, so pass the build time.
 * @param {Record<string, { youtube?: string, spotify?: string }>} links  From data/links.json, keyed by guid.
 */
export function buildCatalogue(episodes, seriesList, now = Date.now(), links = {}) {
  const nowMs = new Date(now).getTime()
  const grouped = new Map(seriesList.map((s) => [s.id, []]))
  const undated = []

  for (const ep of episodes) {
    const { joke, seriesPart } = splitTitle(ep.title)
    const label = cleanLabel(seriesPart)
    const { p, of } = partOf(seriesPart, ep.text)
    const s = findSeries(ep, seriesList)
    const age = (nowMs - Date.parse(ep.date)) / 864e5
    const entry = {
      guid: ep.guid,
      title: ep.title,
      joke,
      label,
      blurb: ep.blurb || '',
      date: ep.date,
      duration: ep.duration,
      p,
      of,
      isNew: age >= -1 && age <= 14,
      links: links[ep.guid] || {},
      series: s ? { id: s.id, name: s.name, short: s.short, theme: !!s.theme } : null,
      sub: s ? subtitleOf(label, s) : '',
      range: s ? (p != null && s.parts && s.parts[p]) || s.range : null,
    }
    if (s) grouped.get(s.id).push(entry)
    else undated.push(entry)
  }

  const series = seriesList
    .map((s) => ({
      id: s.id,
      name: s.name,
      short: s.short,
      range: s.range,
      theme: !!s.theme,
      eps: grouped.get(s.id).sort((a, b) => compare([a.p ?? 99, a.date], [b.p ?? 99, b.date])),
    }))
    .filter((s) => s.eps.length)
    .sort((a, b) => compare([a.range[0], a.range[1], a.name], [b.range[0], b.range[1], b.name]))

  // Undated episodes, grouped by the series name in their title so it's clear what to add next.
  const groups = new Map()
  for (const e of undated) {
    const key = e.label.split(':')[0].trim() || e.title
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(e)
  }
  const undatedGroups = [...groups.entries()]
    .map(([label, eps]) => ({ label, eps: eps.sort((a, b) => compare([a.p ?? 99, a.date], [b.p ?? 99, b.date])) }))
    .sort((a, b) => b.eps.reduce((m, e) => (e.date > m ? e.date : m), '').localeCompare(a.eps.reduce((m, e) => (e.date > m ? e.date : m), '')))

  const main = series.filter((s) => !s.theme)
  return {
    series,
    undated: undatedGroups,
    stats: {
      episodes: episodes.length,
      dated: episodes.length - undated.length,
      undated: undated.length,
      series: series.length,
      earliest: main.length ? Math.min(...main.map((s) => s.range[0])) : null,
      latest: main.length ? Math.max(...main.map((s) => s.range[1])) : null,
    },
  }
}
