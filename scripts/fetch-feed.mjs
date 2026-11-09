// Downloads the RSS feed and saves it as data/episodes.json for the site to build from.
//   node scripts/fetch-feed.mjs                 fail loudly if the feed can't be read (used in CI)
//   node scripts/fetch-feed.mjs --keep-on-fail  keep the last saved copy instead (used by `npm run dev`)
import { mkdir, writeFile, access } from 'node:fs/promises'
import { parseFeed } from '../lib/feed.mjs'

const FEED_URL = process.env.FEED_URL || 'https://feeds.megaphone.fm/finvshistory'
const DATA_DIR = new URL('../data/', import.meta.url)
const OUT = new URL('episodes.json', DATA_DIR)
const keepOnFail = process.argv.includes('--keep-on-fail')

try {
  const res = await fetch(FEED_URL, { headers: { 'user-agent': 'fin-vs-history-in-order (unofficial fan site)' } })
  if (!res.ok) throw new Error(`the feed returned HTTP ${res.status}`)
  const episodes = parseFeed(await res.text())
  if (!episodes.length) throw new Error('the feed had no episodes in it')
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(OUT, JSON.stringify(episodes, null, 2) + '\n')
  console.log(`Saved ${episodes.length} episodes to data/episodes.json`)
} catch (err) {
  const reason = err instanceof Error ? err.message : String(err)
  if (!keepOnFail) {
    console.error(`Couldn't update episodes: ${reason}`)
    process.exit(1)
  }
  const exists = await access(OUT).then(() => true, () => false)
  if (!exists) {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(OUT, '[]\n')
  }
  console.warn(`Couldn't update episodes (${reason}). ${exists ? 'Using the last saved copy.' : 'Starting with an empty list.'}`)
}
