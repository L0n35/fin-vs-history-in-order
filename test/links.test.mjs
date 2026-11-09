import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isoDurationSeconds, keepLastLinks, matchLinks, normalise, titleKeys } from '../lib/links.mjs'
import { buildCatalogue } from '../lib/catalogue.mjs'
import { SERIES } from '../lib/series.mjs'

const ep = (guid, title, date, text = '') => ({ guid, title, date, text })
const vid = (id, title, date, text = '') => ({ url: `https://www.youtube.com/watch?v=${id}`, title, date, text })

const episodes = [
  ep('dingo-1', 'Golden Grahams Are For Satanists | “A Dingo Ate My Baby!” (Part 1)', '2026-11-09T04:00:00Z'),
  ep('agincourt-2', 'Shakespearian Diarrhoea & The Original Operation Yewtree | Agincourt (Part 2)', '2026-11-05T04:00:00Z'),
  ep('stalin-5', 'Russian Humour Is Pushing People Into Canals | Stalin: Yalta & Last Days (Part 5)', '2026-10-30T03:00:00Z'),
  ep('stalin-4', 'Hitler’s Jet Fuel Melts Stalin’s Beams | Stalin: Barbarossa (Part 4)', '2026-10-29T03:00:00Z'),
  ep('iran-1', 'An MI6 Coup Against A Persian Power Bottom | The Iranian Revolution, 1979 (1/3)', '2025-04-14T03:00:00Z'),
  ep('nap-10', 'Imagine The Falklands But With Less Going On | Napoleon’s Final Exile (10/10)', '2026-10-01T03:00:00Z'),
  ep('salem', 'All torture is relaxing for the first bit | The Salem Witch Trials', '2025-02-27T03:00:00Z'),
]

test('normalises punctuation, accents and ampersands', () => {
  assert.equal(normalise('Shakespearian Diarrhoea & The Original Operation Yewtree'), 'shakespearian diarrhoea and the original operation yewtree')
  assert.equal(normalise('Hernán Cortés'), 'hernan cortes')
  assert.equal(titleKeys('A | Stalin: Barbarossa (Part 4)').series, 'stalin barbarossa#4')
})

test('reads YouTube durations', () => {
  assert.equal(isoDurationSeconds('PT1H2M3S'), 3723)
  assert.equal(isoDurationSeconds('PT58S'), 58)
  assert.equal(isoDurationSeconds('P0D'), 0)
  assert.equal(isoDurationSeconds(undefined), 0)
})

test('matches exact titles, even with curly quotes and spacing differences', () => {
  const m = matchLinks(episodes, [
    vid('a', "Golden Grahams Are For Satanists | 'A Dingo Ate My Baby!' (Part 1)", '2026-11-09T05:00:00Z'),
    vid('b', 'Shakespearian Diarrhoea and The Original Operation Yewtree | Agincourt (Part 2)', '2026-11-05T05:00:00Z'),
  ])
  assert.equal(m.get('dingo-1'), 'https://www.youtube.com/watch?v=a')
  assert.equal(m.get('agincourt-2'), 'https://www.youtube.com/watch?v=b')
})

test('matches on the series and part when the joke title differs', () => {
  const m = matchLinks(episodes, [vid('c', 'Stalin Was Aura Farming | Stalin: Yalta & Last Days (Part 5)', '2026-10-31T09:00:00Z')])
  assert.equal(m.get('stalin-5'), 'https://www.youtube.com/watch?v=c')
})

test('matches on the description when the title is completely different', () => {
  const m = matchLinks(episodes, [
    vid('d', 'How Britain & America Overthrew Iran’s Leader', '2025-04-20T09:00:00Z', 'The Iranian Revolution, 1979 (Part 1/3)\nThe show for people who like history'),
  ])
  assert.equal(m.get('iran-1'), 'https://www.youtube.com/watch?v=d')
})

test('falls back to the release date only when it is unambiguous', () => {
  // Stalin 4 and 5 came out a day apart, so a mystery video between them matches neither.
  const ambiguous = matchLinks(episodes, [vid('e', 'Totally different title', '2026-10-29T20:00:00Z')])
  assert.equal(ambiguous.size, 0)
  // Salem has nothing else near it.
  const clear = matchLinks(episodes, [vid('f', 'Witches!', '2025-02-27T10:00:00Z')])
  assert.equal(clear.get('salem'), 'https://www.youtube.com/watch?v=f')
})

test('a long supercut released the same day doesn’t block the date fallback', () => {
  const wilson = [ep('wilson-2', '“Stop Pegging Grandad!”: Harold Wilson (Part 2) | Post War British Prime Ministers, 1945-1979', '2025-09-29T03:00:00Z')]
  wilson[0].duration = 3300
  const m = matchLinks(wilson, [
    { ...vid('w', 'The Prime Minister Who Got Abused By His Secretary', '2025-09-29T16:00:00Z'), duration: 3350 },
    { ...vid('s', 'The Nazi Supercut | The Best of Fin vs History', '2025-09-29T18:00:00Z'), duration: 10860 },
  ])
  assert.equal(m.get('wilson-2'), 'https://www.youtube.com/watch?v=w')
})

test('each video is used for one episode at most', () => {
  const m = matchLinks(episodes, [vid('g', 'Hitler’s Jet Fuel Melts Stalin’s Beams | Stalin: Barbarossa (Part 4)', '2026-10-29T03:00:00Z')])
  assert.equal(m.size, 1)
  assert.equal(m.get('stalin-4'), 'https://www.youtube.com/watch?v=g')
})

test('Spotify-style dates (no time) still match', () => {
  const m = matchLinks(episodes, [
    { url: 'https://open.spotify.com/episode/x', title: 'Imagine The Falklands But With Less Going On | Napoleon’s Final Exile (10/10)', date: '2026-10-01' },
  ])
  assert.equal(m.get('nap-10'), 'https://open.spotify.com/episode/x')
})

test('the catalogue carries links through to each episode', () => {
  const cat = buildCatalogue(episodes, SERIES, '2026-11-10T00:00:00Z', {
    'stalin-4': { youtube: 'https://www.youtube.com/watch?v=g', spotify: 'https://open.spotify.com/episode/y' },
  })
  const stalin = cat.series.find((s) => s.id === 'stalin')
  assert.deepEqual(stalin.eps.find((e) => e.guid === 'stalin-4').links, {
    youtube: 'https://www.youtube.com/watch?v=g',
    spotify: 'https://open.spotify.com/episode/y',
  })
  assert.deepEqual(stalin.eps.find((e) => e.guid === 'stalin-5').links, {})
})

test('keeps the last build’s links for a platform whose lookup failed', () => {
  const links = { a: { youtube: 'yt-a-new' } }
  const last = {
    a: { youtube: 'yt-a-old', spotify: 'sp-a' },
    b: { spotify: 'sp-b' },
    gone: { spotify: 'sp-gone' }, // no longer in the feed
  }
  assert.equal(keepLastLinks(links, last, 'spotify', ['a', 'b']), 2)
  assert.deepEqual(links, { a: { youtube: 'yt-a-new', spotify: 'sp-a' }, b: { spotify: 'sp-b' } })
  // Never overwrites this run's links
  assert.equal(keepLastLinks(links, last, 'youtube', ['a', 'b']), 0)
  assert.equal(links.a.youtube, 'yt-a-new')
  assert.equal(keepLastLinks(links, {}, 'spotify', ['a']), 0)
})
