// Turns the podcast's RSS feed into a plain list of episodes.
// Zero dependencies on purpose: the feed is simple and consistent,
// and this runs in the GitHub Action before the site is built.

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** Strip CDATA wrappers and decode HTML entities once. */
function decodeOnce(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
      if (code[0] === '#') {
        const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : m
      }
      return NAMED[code.toLowerCase()] ?? m
    })
}

/** The feed double-encodes some text (e.g. `&amp;nbsp;`), so decode twice. */
export function decode(s) {
  return decodeOnce(decodeOnce(s))
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`))
  return m ? decode(m[1]).trim() : ''
}

function seconds(raw) {
  if (!raw) return null
  if (/^\d+$/.test(raw)) return Number(raw)
  const parts = raw.split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  return parts.reduce((total, n) => total * 60 + n, 0)
}

const BOILERPLATE = /brought to you by|surfshark|coupon|patreon|truther|people who like history|ad choices|adchoices|hexclad|saily|crackers|merch|book in audio|offer excludes|new show|introducing paddy|sponsored|\(part\b/i

/** First paragraph of the description that reads like the episode's own tagline. */
function blurbFrom(header) {
  for (const raw of header.split(/\n\s*\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim()
    if (line.split(' ').length < 4) continue
    if (BOILERPLATE.test(line)) continue
    return line.length > 220 ? line.slice(0, 217).trimEnd() + '…' : line
  }
  return ''
}

/**
 * @typedef {object} Episode
 * @property {string} guid
 * @property {string} title     Full title as published.
 * @property {string} date      ISO timestamp of release.
 * @property {number|null} duration  Seconds.
 * @property {string} text      Description before the chapter list, used for matching.
 * @property {string} blurb     The episode's one-line tagline, if one could be found.
 */

/** @param {string} xml @returns {Episode[]} */
export function parseFeed(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
  const episodes = []
  for (const block of items) {
    const type = tag(block, 'itunes:episodeType')
    if (type && type !== 'full') continue
    const title = tag(block, 'title').replace(/\s+/g, ' ').trim()
    const pub = new Date(tag(block, 'pubDate'))
    if (!title || Number.isNaN(pub.getTime())) continue
    const description = tag(block, 'description').replace(/\r/g, '')
    const header = description.split(/chapters\s*[:;]/i)[0]
    episodes.push({
      guid: tag(block, 'guid') || title,
      title,
      date: pub.toISOString(),
      duration: seconds(tag(block, 'itunes:duration')),
      text: header.replace(/\s+/g, ' ').trim().slice(0, 800),
      blurb: blurbFrom(header),
    })
  }
  return episodes.sort((a, b) => b.date.localeCompare(a.date))
}
