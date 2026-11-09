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

async function youtubeVideos(key) {
  const api = 'https://www.googleapis.com/youtube/v3'
  const handle = process.env.YOUTUBE_HANDLE || '@FinvsHistory'
  const channel = await getJSON(`${api}/channels?part=snippet,contentDetails,statistics&forHandle=${encodeURIComponent(handle)}&key=${key}`)
  const ch = channel.items?.[0]
  const uploads = ch?.contentDetails?.relatedPlaylists?.uploads
  if (!uploads) throw new Error(`no YouTube channel found for ${handle}`)
  console.log(`YouTube channel: ${ch.snippet?.title} (${ch.id}), ${ch.statistics?.videoCount ?? '?'} public videos`)

  const videos = []
  const checked = []
  let pageToken = ''
  for (let page = 0; page < 60; page++) {
    const list = await getJSON(
      `${api}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploads}&key=${key}${pageToken ? `&pageToken=${pageToken}` : ''}`,
    )
    const batch = (list.items || []).map((it) => ({
      id: it.contentDetails.videoId,
      title: it.snippet.title,
      text: (it.snippet.description || '').slice(0, 600),
      date: it.contentDetails.videoPublishedAt || it.snippet.publishedAt,
    }))
    if (batch.length) {
      const details = await getJSON(`${api}/videos?part=contentDetails&id=${batch.map((v) => v.id).join(',')}&key=${key}`)
      const lengths = new Map((details.items || []).map((v) => [v.id, isoDurationSeconds(v.contentDetails.duration)]))
      for (const v of batch) {
        checked.push({ title: v.title, secs: lengths.get(v.id) || 0 })
        if ((lengths.get(v.id) || 0) >= MIN_EPISODE_SECONDS) {
          videos.push({ url: `https://www.youtube.com/watch?v=${v.id}`, title: v.title, text: v.text, date: v.date })
        }
      }
    }
    pageToken = list.nextPageToken
    if (!pageToken) break
  }

  // Diagnostics, so the build report shows what the channel actually contains.
  console.log(`YouTube: checked ${checked.length} uploads, ${videos.length} at least ${MIN_EPISODE_SECONDS / 60} minutes long`)
  const longest = [...checked].sort((a, b) => b.secs - a.secs).slice(0, 5)
  if (longest.length) console.log(`Longest uploads:\n${longest.map((v) => `  ${Math.round(v.secs / 60)} min  ${v.title}`).join('\n')}`)
  try {
    const playlists = await getJSON(`${api}/playlists?part=snippet,contentDetails&channelId=${ch.id}&maxResults=50&key=${key}`)
    const names = (playlists.items || []).map((p) => `  ${p.snippet.title} (${p.contentDetails.itemCount} items, ${p.id})`)
    console.log(names.length ? `Playlists:\n${names.join('\n')}` : 'Playlists: none')
  } catch (err) {
    console.log(`Playlists: couldn't list (${err instanceof Error ? err.message : err})`)
  }
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
        episodes.push({ url: e.external_urls.spotify, title: e.name, text: (e.description || '').slice(0, 600), date: e.release_date })
      }
    }
    if (!page.next) break
  }
  return episodes
}

const episodes = JSON.parse(await readFile(new URL('episodes.json', DATA_DIR), 'utf8').catch(() => '[]'))
const links = {}

async function collect(name, key, configured, load) {
  if (!configured) {
    console.warn(`${name} links skipped: credentials aren’t set.`)
    return
  }
  try {
    const candidates = await load()
    const matched = matchLinks(episodes, candidates)
    for (const [guid, url] of matched) (links[guid] ||= {})[key] = url
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
