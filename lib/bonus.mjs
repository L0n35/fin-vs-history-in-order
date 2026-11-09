// Bonus episodes: the Patreon exclusives that also appear on Spotify (often as locked previews).
// They aren't in the public RSS feed, so they come from the Spotify episode list.
import { normalise } from './links.mjs'

/** Spotify titles that mark an episode as a Patreon bonus. */
export const BONUS_TITLE = /patreon exclusives?|film club/i

/**
 * Tidies the many title styles into one:
 * "Patreon Film Club: Zulu vs Zulu Dawn | Patreon Exclusive" → "Film Club: Zulu vs Zulu Dawn"
 * "The Odyssey (Greek Myths Part 2) | Patreon Exclusive | Fin vs History" → "The Odyssey (Greek Myths Part 2)"
 */
export function cleanBonusTitle(title) {
  let t = title
    .replace(/\s*\|\s*patreon exclusives?\s*/gi, ' | ')
    .replace(/\s*\|\s*fin vs history\s*$/i, '')
    .replace(/(\s*\|\s*)+$/, '')
    .trim()
  const trailingClub = t.match(/^(.*?)\s*\|\s*patreon film club$/i)
  if (trailingClub) t = `Film Club: ${trailingClub[1]}`
  t = t.replace(/^(?:patreon\s+)?film club\s*[:|\-–]\s*/i, 'Film Club: ')
  return t.replace(/\s+/g, ' ').trim()
}

const BOILERPLATE = /for weekly bonus|sign up to the patreon|patreon\.com|surfshark|brought to you|ad choices|become a truther|coupon code|listen to paddy/i

/** The episode's own one-liner from its Spotify description, without the adverts. */
export function bonusBlurb(text = '') {
  const flat = text.replace(/\s+/g, ' ').trim()
  const cut = flat.search(BOILERPLATE)
  const head = (cut >= 0 ? flat.slice(0, cut) : flat).trim()
  const sentence = head.match(/^(.{8,200}?[.!?…])(?:\s|$)/)
  const line = (sentence ? sentence[1] : head.slice(0, 200)).trim()
  return line.split(' ').length >= 3 ? line : ''
}

/**
 * Bonus episodes from the Spotify list: Patreon-titled episodes that didn't match a feed episode.
 * Re-uploads with the same title are kept once, at their first release.
 * @param {{ url: string, title: string, date: string, duration?: number|null, text?: string }[]} spotifyEpisodes
 * @param {Set<string>} matchedUrls  Spotify URLs already matched to feed episodes.
 */
export function extractBonus(spotifyEpisodes, matchedUrls = new Set()) {
  const byTitle = new Map()
  for (const c of spotifyEpisodes) {
    if (matchedUrls.has(c.url) || !BONUS_TITLE.test(c.title)) continue
    const title = cleanBonusTitle(c.title)
    const key = normalise(title)
    const day = String(c.date).slice(0, 10)
    const existing = byTitle.get(key)
    if (existing && existing.day <= day) continue
    const id = c.url.split('/').pop().split('?')[0]
    byTitle.set(key, {
      day,
      episode: {
        guid: `spotify:${id}`,
        title,
        date: `${day}T12:00:00.000Z`,
        duration: c.duration ?? null,
        text: (c.text || '').slice(0, 600),
        blurb: bonusBlurb(c.text),
        bonus: true,
        spotify: c.url,
      },
    })
  }
  return [...byTitle.values()].map((v) => v.episode).sort((a, b) => b.date.localeCompare(a.date))
}
