import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bonusBlurb, cleanBonusTitle, extractBonus } from '../lib/bonus.mjs'
import { buildCatalogue, partOf } from '../lib/catalogue.mjs'
import { BONUS_SERIES, SERIES } from '../lib/series.mjs'
import { PATREON_URL } from '../lib/format.mjs'

test('tidies the different Patreon title styles', () => {
  assert.equal(cleanBonusTitle('Greek Myths (Part One) | Patreon Exclusive'), 'Greek Myths (Part One)')
  assert.equal(cleanBonusTitle('The Odyssey (Greek Myths Part 2) | Patreon Exclusive | Fin vs History'), 'The Odyssey (Greek Myths Part 2)')
  assert.equal(cleanBonusTitle('Raoul Moat | PATREON EXCLUSIVE'), 'Raoul Moat')
  assert.equal(cleanBonusTitle('The Accent Supercut | Patreon Exclusives'), 'The Accent Supercut')
  assert.equal(cleanBonusTitle('Patreon Film Club: APOCALYPTO | Patreon Exclusive'), 'Film Club: APOCALYPTO')
  assert.equal(cleanBonusTitle('Film Club - Khartoum | Patreon Exclusive'), 'Film Club: Khartoum')
  assert.equal(cleanBonusTitle('Film Club | The Last King Of Scotland | Patreon Exclusive'), 'Film Club: The Last King Of Scotland')
  assert.equal(cleanBonusTitle('Scorsese’s Silence & Kurosawa’s Ran | Patreon Film Club'), 'Film Club: Scorsese’s Silence & Kurosawa’s Ran')
})

test('reads part numbers written as words or in square brackets', () => {
  assert.equal(partOf('Greek Myths (Part One)').p, 1)
  assert.equal(partOf('History Of The SAS [Part Two]').p, 2)
  assert.equal(partOf('History of The SAS [Part 1]').p, 1)
  assert.equal(partOf('The Odyssey (Greek Myths Part 2)').p, 2)
  assert.equal(partOf('Burke & Hare (Part Two)').p, 2)
})

test('takes the one-liner from a Spotify description, not the adverts', () => {
  assert.equal(bonusBlurb('Otherwise known as Australia’s Vietnam'), 'Otherwise known as Australia’s Vietnam')
  assert.equal(bonusBlurb('Buckle up, mum’s angry. For weekly bonus episodes, sign up to the Patreon'), 'Buckle up, mum’s angry.')
  assert.equal(bonusBlurb('Anyone fancy a Patreon meet up for the Raoul Moat Walking Tour ?').startsWith('Anyone fancy a Patreon meet up'), true)
  assert.equal(bonusBlurb(''), '')
})

const sp = (id, title, date, extra = {}) => ({ url: `https://open.spotify.com/episode/${id}`, title, date, duration: 1800, text: '', ...extra })

test('extracts bonus episodes: Patreon titles only, skipping matched ones and re-uploads', () => {
  const list = [
    sp('a', 'The Odyssey (Greek Myths Part 2) | Patreon Exclusive | Fin vs History', '2025-01-31'),
    sp('b', 'The Odyssey (Greek Myths Part 2) | Patreon Exclusive', '2025-03-27'),
    sp('c', 'Trailer', '2025-01-14'),
    sp('d', 'Stalin: Famine (Part 2) | Patreon Exclusive', '2026-10-22'),
    sp('e', 'The Great Emu War of 1932 | Patreon Exclusive', '2025-02-07'),
  ]
  const bonus = extractBonus(list, new Set(['https://open.spotify.com/episode/d']))
  assert.deepEqual(bonus.map((b) => b.guid), ['spotify:e', 'spotify:a'])
  assert.equal(bonus[1].title, 'The Odyssey (Greek Myths Part 2)')
  assert.equal(bonus[1].date, '2025-01-31T12:00:00.000Z')
  assert.equal(bonus[0].bonus, true)
})

test('bonus episodes only match bonus series, get tagged, and link to Spotify and Patreon', () => {
  const bonus = extractBonus([
    sp('e', 'The Great Emu War of 1932 | Patreon Exclusive', '2025-02-07'),
    sp('i', 'The Charlie Supercut | Patreon Exclusive', '2026-06-15'),
  ])
  const cat = buildCatalogue(bonus, SERIES, '2026-11-10T00:00:00Z', {}, BONUS_SERIES)
  const emu = cat.series.find((s) => s.eps.some((e) => e.guid === 'spotify:e'))
  assert.equal(emu.bonus, true)
  assert.equal(emu.eps[0].bonus, true)
  assert.equal(emu.eps[0].tucked, false)
  assert.deepEqual(emu.eps[0].links, { spotify: 'https://open.spotify.com/episode/e', patreon: PATREON_URL })
  // No single period: sorted last, no range
  assert.equal(cat.series.at(-1).id, 'bonus-supercuts')
  assert.equal(cat.series.at(-1).range, null)
  assert.equal(cat.stats.bonus, 2)
  assert.equal(cat.stats.episodes, 0)
})

const feedEp = (guid, title, date) => ({ guid, title, date: `${date}T05:00:00.000Z`, duration: 3600, text: '', blurb: '' })

test('bonus episodes with a parent are filed in that series, after its episodes', () => {
  const main = [
    feedEp('g2', 'The Mad Dog of the Middle East | The Rise and Fall of Colonel Gaddafi (Part 2)', '2025-06-10'),
    feedEp('g1', 'Gaddafi Joins the Army | The Rise and Fall of Colonel Gaddafi (Part 1)', '2025-06-03'),
    feedEp('o1', 'If I Did It | The People vs O.J. Simpson (Part 1)', '2026-02-03'),
  ]
  const bonus = extractBonus([
    sp('g', 'Gaddafi’s Sons | Patreon Exclusive', '2025-06-13'),
    sp('h', 'Killer Athletes: Oscar Pistorius (with Red Richardson) | Patreon Exclusive', '2026-02-13'),
  ])
  const cat = buildCatalogue([...bonus, ...main], SERIES, '2026-11-10T00:00:00Z', {}, BONUS_SERIES)
  const byId = Object.fromEntries(cat.series.map((s) => [s.id, s]))
  assert.equal(byId['bonus-gaddafis-sons'], undefined)
  const gaddafi = byId.gaddafi
  assert.equal(gaddafi.bonus, false)
  assert.deepEqual(gaddafi.eps.map((e) => e.guid), ['g1', 'g2', 'spotify:g'])
  const sons = gaddafi.eps[2]
  assert.equal(sons.bonus, true)
  assert.equal(sons.tucked, true)
  assert.equal(sons.series.id, 'gaddafi')
  assert.deepEqual(sons.links, { spotify: 'https://open.spotify.com/episode/g', patreon: PATREON_URL })
  // Keeps its own per-subject dates inside the parent card
  const oscar = byId['oj-simpson'].eps.at(-1)
  assert.equal(oscar.sub, 'Oscar Pistorius')
  assert.deepEqual(oscar.range, [2013, 2014])
  assert.equal(cat.stats.tucked, 2)
  assert.equal(cat.stats.bonusSeries, 0)
})

test('a parent with no episodes of its own yet shows its bonus episodes as a bonus card', () => {
  const cat = buildCatalogue(extractBonus([sp('g', 'Gaddafi’s Sons | Patreon Exclusive', '2025-06-13')]), SERIES, '2026-11-10T00:00:00Z', {}, BONUS_SERIES)
  assert.equal(cat.series.length, 1)
  assert.equal(cat.series[0].id, 'gaddafi')
  assert.equal(cat.series[0].bonus, true)
  assert.equal(cat.series[0].eps[0].tucked, false)
})

test('every bonus series rule is well formed', () => {
  const ids = new Set(SERIES.map((s) => s.id))
  for (const s of BONUS_SERIES) {
    assert.ok(!ids.has(s.id), `duplicate id ${s.id}`)
    ids.add(s.id)
    assert.ok(s.title instanceof RegExp && !s.title.global, `${s.id} needs a title rule without the g flag`)
    if (s.range) assert.ok(s.range[0] <= s.range[1], `${s.id} range runs backwards`)
    if (s.parent) assert.ok(SERIES.some((m) => m.id === s.parent), `${s.id} has an unknown parent ${s.parent}`)
  }
})
