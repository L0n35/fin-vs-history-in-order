import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseFeed } from '../lib/feed.mjs'
import { buildCatalogue, partOf, splitTitle, cleanLabel, findSeries } from '../lib/catalogue.mjs'
import { SERIES } from '../lib/series.mjs'
import { formatRange, eraIndex, ERAS, PRESENT } from '../lib/format.mjs'

const xml = await readFile(new URL('./fixtures/feed.xml', import.meta.url), 'utf8')
const episodes = parseFeed(xml)
const find = (guid) => episodes.find((e) => e.guid === guid)

test('parses full episodes and skips trailers', () => {
  assert.equal(episodes.length, 8)
  assert.ok(!episodes.some((e) => e.guid === 'trailer'))
})

test('decodes entities, trims titles and reads durations', () => {
  const ag = find('6fa4d2fc-d3b4-11f1-9f2d-ab5cd8828bba')
  assert.equal(ag.title, 'Shakespearian Diarrhoea & The Original Operation Yewtree | Agincourt (Part 2)')
  assert.equal(find('eb2ea104-ad27-11f1-bc9a-1f1fc71219a0').title.startsWith('Imagine'), true)
  assert.equal(find('renaissance-1').duration, 3512)
  assert.equal(ag.date, '2026-11-05T04:00:00.000Z')
})

test('picks the tagline, not the adverts', () => {
  assert.equal(find('f02599ec-d9cd-11f1-95d5-ebc3ff970807').blurb, 'She was so fit, she must have killed her baby.')
  assert.equal(find('934d7c40-c969-11f1-a918-77b0f2034b89').blurb, 'Hitler gets the ick and breaks Stalin’s heart with Operation Barbarossa')
  assert.equal(find('gnw-1').blurb, '')
})

test('reads part numbers from titles and descriptions', () => {
  assert.deepEqual(partOf('Napoleon’s Final Exile (10/10)'), { p: 10, of: 10 })
  assert.deepEqual(partOf('Horatio Nelson (Part 2/10)'), { p: 2, of: 10 })
  assert.deepEqual(partOf('Stalin: Barbarossa (Part 4)'), { p: 4, of: null })
  assert.deepEqual(partOf('The Iranian Revolution, 1979 (1/3)'), { p: 1, of: 3 })
  assert.deepEqual(partOf('The Renaissance Part 1: Italy'), { p: 1, of: null })
  assert.deepEqual(partOf('Peter The Great', 'The Great Northern War (Part One)'), { p: 1, of: null })
  assert.deepEqual(partOf('The Salem Witch Trials'), { p: null, of: null })
})

test('copes with the odd title formats in the real feed', () => {
  // Missing closing bracket
  assert.deepEqual(partOf('The Battle of Little Big Horn (Part 4/4'), { p: 4, of: 4 })
  assert.equal(cleanLabel('The Battle of Little Big Horn (Part 4/4'), 'The Battle of Little Big Horn')
  // Guest after the part number
  assert.equal(cleanLabel('Nero & the Emperors of Rome (Part 2) with James McCann'), 'Nero & the Emperors of Rome')
  // Part number and subject on the joke side
  const pm = buildCatalogue(
    [{ guid: 'pm1', title: 'Britain has a Cuck Dad and a Bitch Mum: Clement Attlee (Part 1) | Post War British Prime Ministers, 1945-1979', date: '2025-06-02T03:00:00Z', text: '' }],
    [{ id: 'pms', name: 'Post-War British Prime Ministers', short: 'PMs', title: /Prime Ministers/i, range: [1945, 1979], parts: { 1: [1945, 1951] } }],
  )
  const e = pm.series[0].eps[0]
  assert.equal(e.p, 1)
  assert.equal(e.joke, 'Britain has a Cuck Dad and a Bitch Mum')
  assert.equal(e.sub, 'Clement Attlee')
  assert.deepEqual(e.range, [1945, 1951])
})

test('undated groups ignore capitalisation differences', () => {
  const cat = buildCatalogue(
    [
      { guid: 'a', title: 'A | Richard III and The Princes in The Tower (Part 2)', date: '2025-06-05T03:00:00Z', text: '' },
      { guid: 'b', title: 'B | Richard III and the Princes in the Tower (Part 1)', date: '2025-06-02T03:00:00Z', text: '' },
    ],
    [],
  )
  assert.equal(cat.undated.length, 1)
  assert.deepEqual(cat.undated[0].eps.map((e) => e.p), [1, 2])
})

test('labels drop part numbers but keep the subtitle', () => {
  assert.equal(cleanLabel(splitTitle('Trust The Italians to Rediscover Porn | The Renaissance Part 1: Italy').seriesPart), 'The Renaissance: Italy')
  assert.equal(cleanLabel('Stalin: Barbarossa (Part 4)'), 'Stalin: Barbarossa')
})

test('matches episodes to series, parts and date ranges', () => {
  const cat = buildCatalogue(episodes, SERIES, '2026-11-10T12:00:00Z')
  const byId = Object.fromEntries(cat.series.map((s) => [s.id, s]))

  const nap = byId['napoleonic-wars']
  assert.deepEqual(nap.eps.map((e) => e.p), [2, 10])
  assert.equal(nap.eps[0].sub, 'Horatio Nelson')
  assert.deepEqual(nap.eps[0].range, [1758, 1797])
  assert.equal(nap.eps[1].sub, 'Napoleon’s Final Exile')

  const stalin = byId.stalin.eps[0]
  assert.equal(stalin.sub, 'Barbarossa')
  assert.deepEqual(stalin.range, [1939, 1943])

  const gnw = byId['great-northern-war'].eps[0]
  assert.equal(gnw.p, 1)
  assert.equal(gnw.sub, 'Peter The Great')
  assert.deepEqual(gnw.range, [1672, 1700])

  assert.equal(byId.renaissance.eps[0].sub, 'Italy')
  assert.equal(byId.dingo.eps[0].sub, '')
  assert.equal(byId.agincourt.eps[0].joke, 'Shakespearian Diarrhoea & The Original Operation Yewtree')
})

test('series are sorted by when they start', () => {
  const cat = buildCatalogue(episodes, SERIES)
  const ids = cat.series.map((s) => s.id)
  assert.deepEqual(ids, ['agincourt', 'renaissance', 'great-northern-war', 'napoleonic-wars', 'stalin', 'dingo'])
})

test('unknown series land in "Not dated yet", grouped by their title', () => {
  const cat = buildCatalogue(episodes, SERIES, '2026-11-10T12:00:00Z')
  assert.equal(cat.undated.length, 1)
  assert.equal(cat.undated[0].label, 'The Spanish Armada')
  assert.equal(cat.stats.undated, 1)
  assert.equal(cat.stats.dated, 7)
})

test('"New" is relative to the build time', () => {
  const cat = buildCatalogue(episodes, SERIES, '2026-11-10T12:00:00Z')
  const dingo = cat.series.find((s) => s.id === 'dingo').eps[0]
  const nelson = cat.series.find((s) => s.id === 'napoleonic-wars').eps[0]
  assert.equal(dingo.isNew, true)
  assert.equal(nelson.isNew, false)
})

test('formats years and eras', () => {
  assert.equal(formatRange([-2000000, -40000]), '2 million – 40,000 BC')
  assert.equal(formatRange([-10, 54]), '10 BC – AD 54')
  assert.equal(formatRange([41, 54]), 'AD 41–54')
  assert.equal(formatRange([1805, 1805]), '1805')
  assert.equal(formatRange([1780, PRESENT]), '1780–present')
  assert.equal(ERAS[eraIndex([1491, 1547])].name, 'Early modern')
  assert.equal(ERAS[eraIndex([1776, 1920])].name, 'Early modern')
  assert.equal(ERAS[eraIndex([1980, 1982])].name, 'Post-war')
})

test('rules don’t catch words inside other words', () => {
  // "Salem" is inside "Jerusalem"
  const ep = { title: 'Justice for Naughty Francis Bourgeois | The Eichmann Trial: Jerusalem, 1961 (Part 4/4)', text: '' }
  assert.equal(findSeries(ep, SERIES).id, 'eichmann')
})

test('every series rule is well formed', () => {
  const ids = new Set()
  for (const s of SERIES) {
    assert.ok(!ids.has(s.id), `duplicate id ${s.id}`)
    ids.add(s.id)
    assert.ok(s.title instanceof RegExp, `${s.id} needs a title rule`)
    assert.ok(!s.title.global, `${s.id} title rule must not use the g flag`)
    assert.ok(s.range[0] <= s.range[1], `${s.id} range runs backwards`)
    for (const [p, r] of Object.entries(s.parts || {})) assert.ok(r[0] <= r[1], `${s.id} part ${p} runs backwards`)
  }
})
