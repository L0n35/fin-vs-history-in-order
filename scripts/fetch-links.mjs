// Finds each episode on YouTube and Spotify and saves the links to data/links.json.
//
// Needs API credentials (as GitHub Actions secrets in CI, or in a local .env file):
//   YOUTUBE_API_KEY                           YouTube Data API v3 key
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET  Spotify app credentials
// Optional: SPOTIFY_SHOW_ID, SPOTIFY_MARKET (default GB), YOUTUBE_HANDLE (default @FinvsHistory)
//
// A platform that isn't configured or fails is skipped with a warning. The build carries on
// and those episodes just don't get that link.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { isoDurationSeconds, matchLinks } from '../lib/links.mjs'

try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
} catch {
  // No .env file, which is normal in CI.
}

const DATA_DIR = new URL('../data/', import.meta.url)
const MIN_EPISODE_SECONDS = 20 * 60 // anything shorter on YouTube is a clip or a Short

async function getJSON(url, init) {
  const res = await fetch(url, init)
  if (!res.ok) {
    const err = new Error(`${new URL(url).host} returned HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

const YT_API = 'https://www.googleapis.com/youtube/v3'

/** Every item in a playlist (uploads lists are playlists too). */
async function playlistItems(playlistId, key, maxPages = 60) {
  const items = []
  let pageToken = ''
  for (let page = 0; page < maxPages; page++) {
    const list = await getJSON(
      `${YT_API}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${key}${pageToken ? `&pageToken=${pageToken}` : ''}`,
    )
    for (const it of list.items || []) {
      items.push({
        id: it.contentDetails.videoId,
        title: it.snippet.title,
        text: (it.snippet.description || '').slice(0, 600),
        date: it.contentDetails.videoPublishedAt || it.snippet.publishedAt,
        owner: it.snippet.videoOwnerChannelId,
        ownerName: it.snippet.videoOwnerChannelTitle,
      })
    }
    pageToken = list.nextPageToken
    if (!pageToken) break
  }
  return items
}

/** Video lengths in seconds, 50 at a time. */
async function videoLengths(ids, key) {
  const lengths = new Map()
  for (let i = 0; i < ids.length; i += 50) {
    const details = await getJSON(`${YT_API}/videos?part=contentDetails&id=${ids.slice(i, i + 50).join(',')}&key=${key}`)
    for (const v of details.items || []) lengths.set(v.id, isoDurationSeconds(v.contentDetails.duration))
  }
  return lengths
}

const looksLikeEpisode = (v) => v.title.includes('|') || /fin vs history|people who like history/i.test(v.text)

/**
 * The show's own channel mostly holds clips, with full episodes gathered into playlists.
 * So: read the channel's uploads and every one of its playlists, then the uploads of whichever
 * channels own the videos in those playlists, and keep anything long enough to be an episode.
 */
async function youtubeVideos(key) {
  const handle = process.env.YOUTUBE_HANDLE || '@FinvsHistory'
  const channel = await getJSON(`${YT_API}/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${key}`)
  const ch = channel.items?.[0]
  if (!ch) throw new Error(`no YouTube channel found for ${handle}`)

  /** @type {Map<string, any>} */
  const found = new Map()
  const add = (items, trusted) => {
    for (const v of items) if (v.id && !found.has(v.id)) found.set(v.id, { ...v, trusted })
  }

  add(await playlistItems(ch.contentDetails.relatedPlaylists.uploads, key), true)

  const playlists = []
  let pageToken = ''
  for (let page = 0; page < 5; page++) {
    const list = await getJSON(
      `${YT_API}/playlists?part=snippet&channelId=${ch.id}&maxResults=50&key=${key}${pageToken ? `&pageToken=${pageToken}` : ''}`,
    )
    playlists.push(...(list.items || []).map((p) => p.id))
    pageToken = list.nextPageToken
    if (!pageToken) break
  }
  for (const id of playlists) add(await playlistItems(id, key, 10), true)

  // Channels that own the playlisted videos. Their other uploads count only if they look like episodes.
  const owners = new Map()
  for (const v of found.values()) if (v.owner && v.owner !== ch.id) owners.set(v.owner, v.ownerName)
  for (const [ownerId, ownerName] of owners) {
    const before = found.size
    add(await playlistItems(`UU${ownerId.slice(2)}`, key, 40), false)
    console.log(`YouTube: also read ${found.size - before} uploads from ${ownerName} (${ownerId})`)
  }

  const lengths = await videoLengths([...found.keys()], key)
  const videos = [...found.values()]
    .filter((v) => (lengths.get(v.id) || 0) >= MIN_EPISODE_SECONDS && (v.trusted || looksLikeEpisode(v)))
    .map((v) => ({ url: `https://www.youtube.com/watch?v=${v.id}`, title: v.title, text: v.text, date: v.date, duration: lengths.get(v.id) }))

  console.log(`YouTube: ${ch.snippet?.title} has ${playlists.length} playlists; ${found.size} videos checked, ${videos.length} full-length episodes`)
  return videos
}

async function spotifyEpisodes(clientId, clientSecret) {
  const token = await getJSON('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const auth = { headers: { Authorization: `Bearer ${token.access_token}` } }
  const api = 'https://api.spotify.com/v1'
  const market = process.env.SPOTIFY_MARKET || 'GB'

  let show = process.env.SPOTIFY_SHOW_ID
  if (!show) {
    const search = await getJSON(`${api}/search?q=${encodeURIComponent('Fin vs History')}&type=show&market=${market}&limit=10`, auth)
    show = (search.shows?.items || []).find((s) => s && s.name?.trim().toLowerCase() === 'fin vs history')?.id
    if (!show) throw new Error('couldn’t find the show on Spotify. Set SPOTIFY_SHOW_ID')
    console.log(`Spotify show ID is ${show}. Set SPOTIFY_SHOW_ID to skip the search.`)
  }

  const episodes = []
  let limit = 50
  for (let offset = 0; offset < 3000; offset += limit) {
    let page
    try {
      page = await getJSON(`${api}/shows/${show}/episodes?market=${market}&limit=${limit}&offset=${offset}`, auth)
    } catch (err) {
      // Development-mode apps have had page sizes cut before; fall back to a smaller page.
      if (err.status === 400 && limit > 10) {
        limit = 10
        offset -= limit
        continue
      }
      throw err
    }
    for (const e of page.items || []) {
      if (e?.external_urls?.spotify) {
        episodes.push({
          url: e.external_urls.spotify,
          title: e.name,
          text: (e.description || '').slice(0, 600),
          date: e.release_date,
          duration: e.duration_ms ? Math.round(e.duration_ms / 1000) : null,
        })
      }
    }
    if (!page.next) break
  }
  return episodes
}

const episodes = JSON.parse(await readFile(new URL('episodes.json', DATA_DIR), 'utf8').catch(() => '[]'))
const links = {}

const unmatched = {}

async function collect(name, key, configured, load) {
  if (!configured) {
    console.warn(`${name} links skipped: credentials aren’t set.`)
    return
  }
  try {
    const candidates = await load()
    const matched = matchLinks(episodes, candidates)
    for (const [guid, url] of matched) (links[guid] ||= {})[key] = url
    const used = new Set(matched.values())
    unmatched[key] = candidates.filter((c) => !used.has(c.url)).map(({ text, ...rest }) => ({ ...rest, text: text?.slice(0, 200) }))
    console.log(`${name}: found ${candidates.length} episodes, matched ${matched.size} of ${episodes.length}.`)
  } catch (err) {
    console.warn(`${name} links skipped: ${err instanceof Error ? err.message : err}`)
  }
}

const { YOUTUBE_API_KEY, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env
await collect('YouTube', 'youtube', !!YOUTUBE_API_KEY, () => youtubeVideos(YOUTUBE_API_KEY))
await collect('Spotify', 'spotify', !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET), () => spotifyEpisodes(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET))

await mkdir(DATA_DIR, { recursive: true })
await writeFile(new URL('links.json', DATA_DIR), JSON.stringify(links, null, 2) + '\n')
// Platform episodes that didn't match anything in the feed, for checking the matching and spotting gaps.
await writeFile(new URL('unmatched.json', DATA_DIR), JSON.stringify(unmatched, null, 2) + '\n')
