import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCatalogue } from '../lib/catalogue.mjs'
import { SERIES } from '../lib/series.mjs'

// Real titles from the feed. Series are ordered by their main events, not by backstory,
// so someone's childhood doesn't drag their series decades ahead of where it belongs.
const ep = (guid, title, date) => ({ guid, title, date, text: '' })
const episodes = [
  ep('thatcher-1', 'Smashing The Glass Floor As Well As The Ceiling | Margaret Thatcher & The Falklands (Part 1/6)', '2025-12-01T03:00:00Z'),
  ep('thatcher-4', 'A Duke of Edinburgh Award With Live Ammunition | Margaret Thatcher & The Falklands (Part 4/6)', '2025-12-11T03:00:00Z'),
  ep('attlee-1', 'Britain has a Cuck Dad and a Bitch Mum: Clement Attlee (Part 1) | Post War British Prime Ministers, 1945-1979', '2025-09-01T03:00:00Z'),
  ep('callaghan', 'Britain needs its Mummy: Jim Callaghan | Post War British Prime Ministers, 1945-1979', '2025-10-02T03:00:00Z'),
  ep('claudius-1', 'Not All Roman Emperors Are Visible | Claudius (Part 1)', '2026-06-22T03:00:00Z'),
  ep('caligula-1', 'Foreign Accent P*do Syndrome | Caligula (Part 1)', '2025-10-27T03:00:00Z'),
  ep('stalin-1', 'A Lager Boy In A Sea of Hobgoblins | Stalin: Rise to Power (Part 1)', '2026-10-19T03:00:00Z'),
  ep('rr-1', 'Why is Russia so F*cked in the Head? | The Russian Revolution of 1917 (Part 1/5)', '2025-06-09T03:00:00Z'),
  ep('amin-1', 'A Human Lasagna Left Out In The Sun | Idi Amin (Part 1/4)', '2026-03-09T03:00:00Z'),
  ep('cuba-2', 'The Cold War was an Ugly-Off | The Cuban Missile Crisis (Part 2)', '2025-01-30T03:00:00Z'),
]
const cat = buildCatalogue(episodes, SERIES)
const order = cat.series.map((s) => s.id)
const before = (a, b) => assert.ok(order.indexOf(a) < order.indexOf(b), `${a} should come before ${b}: ${order.join(', ')}`)

test('Thatcher comes after the Post-War Prime Ministers', () => before('prime-ministers', 'thatcher'))
test('Caligula comes before Claudius', () => before('caligula', 'claudius'))
test('the Russian Revolution comes before Stalin', () => before('russian-revolution', 'stalin'))
test('Idi Amin comes after the Cuban Missile Crisis', () => before('cuban-missile-crisis', 'idi-amin'))

test('backstory parts keep their own earlier dates', () => {
  const thatcher = cat.series.find((s) => s.id === 'thatcher')
  assert.deepEqual(thatcher.range, [1979, 1990])
  assert.deepEqual(thatcher.eps.find((e) => e.p === 1).range, [1925, 1979])
  assert.deepEqual(thatcher.eps.find((e) => e.p === 4).range, [1982, 1983])
})
