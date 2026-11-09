import { PRESENT } from './format.mjs'

// ─────────────────────────────────────────────────────────────────────────────
// The series-to-dates mapping. This is the only file you edit by hand.
//
// Each series says how to recognise its episodes and when it happened:
//   title   Regex tested against the series half of the title (after the "|"),
//           e.g. "Stalin: Barbarossa (Part 4)". The joke half is ignored.
//   text    Optional regex tested against the description before the chapters,
//           for episodes whose title doesn't name the series
//           (e.g. "The Great Northern War (Part One)").
//   range   [start, end] in years. Negative = BC. PRESENT = still going.
//   parts   Optional per-part ranges, keyed by part number.
//   theme   true for series that sweep across the ages. They get their own
//           section instead of being pinned to a start date.
//
// The first series whose rule matches wins. Episodes nothing matches show up
// under "Not dated yet" on the site and in the GitHub Action's summary.
//
// All dates here are a first draft. Fix them as you listen.
// ─────────────────────────────────────────────────────────────────────────────

/** @typedef {[number, number]} Range */
/**
 * @typedef {object} Series
 * @property {string} id
 * @property {string} name
 * @property {string} short   Short label for timeline bars.
 * @property {Range} range
 * @property {RegExp} title
 * @property {RegExp} [text]
 * @property {Record<number, Range>} [parts]
 * @property {boolean} [theme]
 */

/** @type {Series[]} */
export const SERIES = [
  // ── Across the ages ────────────────────────────────────────────────────────
  {
    id: 'medicine', name: 'The History of Medicine', short: 'Medicine', theme: true,
    title: /History of Medicine/i, range: [-7000, PRESENT],
    parts: { 1: [-7000, 1800], 2: [1780, PRESENT] },
  },
  {
    id: 'beauty', name: 'The History of Beauty Standards', short: 'Beauty', theme: true,
    title: /Beauty Standards/i, range: [-3000, PRESENT],
    parts: { 1: [-3000, 1700], 2: [1700, PRESENT] },
  },
  {
    id: 'sex-work', name: 'The History of Sex Work', short: 'Sex work', theme: true,
    title: /History of Sex Work/i, range: [-2000, PRESENT],
    parts: { 1: [-2000, 1850], 2: [1850, PRESENT] },
  },

  // ── Prehistory and the ancient world ───────────────────────────────────────
  {
    id: 'prehistoric-man', name: 'Prehistoric Man', short: 'Prehistoric',
    title: /Prehistoric Man/i, range: [-2000000, -3000],
    parts: { 1: [-2000000, -40000], 2: [-40000, -3000] },
  },
  {
    id: 'claudius', name: 'Claudius', short: 'Claudius',
    title: /Claudius/i, range: [-10, 54],
    parts: { 1: [-10, 41], 2: [41, 54] },
  },

  // ── Medieval ───────────────────────────────────────────────────────────────
  {
    id: 'genghis-khan', name: 'Genghis Khan', short: 'Genghis',
    title: /Genghis Khan/i, range: [1162, 1227],
    parts: { 1: [1162, 1206], 2: [1206, 1227] },
  },
  {
    id: 'william-wallace', name: 'William Wallace', short: 'Wallace',
    title: /William Wallace/i, range: [1270, 1305],
    parts: { 1: [1270, 1297], 2: [1297, 1305] },
  },
  {
    id: 'agincourt', name: 'Agincourt', short: 'Agincourt',
    title: /Agincourt/i, range: [1337, 1415],
    parts: { 2: [1415, 1415] },
  },

  // ── Early modern ───────────────────────────────────────────────────────────
  {
    id: 'renaissance', name: 'The Renaissance', short: 'Renaissance',
    title: /Renaissance/i, range: [1400, 1600],
    parts: { 1: [1400, 1550] },
  },
  {
    id: 'cortes', name: 'Hernán Cortés', short: 'Cortés',
    title: /Cort[eé]s|Aztec/i, range: [1485, 1547],
  },
  {
    id: 'henry-viii', name: 'Henry VIII', short: 'Henry VIII',
    title: /Henry VIII/i, range: [1491, 1547],
    parts: { 1: [1491, 1527], 2: [1526, 1536], 3: [1536, 1540], 4: [1540, 1547] },
  },
  {
    id: 'english-civil-war', name: 'The English Civil War', short: 'Civil War',
    title: /English Civil War/i, range: [1625, 1658],
    parts: { 1: [1625, 1645], 2: [1645, 1658] },
  },
  {
    id: 'great-northern-war', name: 'The Great Northern War', short: 'Great N. War',
    title: /Great Northern War|Peter The Great/i, text: /Great Northern War \(Part/i, range: [1672, 1721],
    parts: { 1: [1672, 1700], 2: [1700, 1721] },
  },
  {
    id: 'salem', name: 'The Salem Witch Trials', short: 'Salem',
    title: /Salem/i, range: [1692, 1693],
  },
  {
    id: 'mozart', name: 'Mozart', short: 'Mozart',
    title: /Mozart/i, range: [1756, 1791],
  },
  {
    id: 'napoleonic-wars', name: 'The Napoleonic Wars', short: 'Napoleon',
    title: /Napoleonic Wars|Napoleon[’']s Final Exile|Napoleon Invades Russia|Battle of Waterloo|Battle of Trafalgar|Battle of The Nile|Austerlitz|Horatio Nelson/i,
    text: /Napoleonic Wars \(Part/i,
    range: [1769, 1821],
    parts: {
      1: [1769, 1796], 2: [1758, 1797], 3: [1798, 1798], 4: [1798, 1804], 5: [1805, 1805],
      6: [1805, 1810], 7: [1812, 1812], 8: [1808, 1814], 9: [1815, 1815], 10: [1815, 1821],
    },
  },
  {
    id: 'prohibition', name: 'Prohibition', short: 'Prohibition',
    title: /Prohibition/i, range: [1776, 1933],
    parts: { 1: [1776, 1920], 2: [1920, 1933] },
  },

  // ── Modern ─────────────────────────────────────────────────────────────────
  {
    id: 'darwin', name: 'Charles Darwin & The Birth of Eugenics', short: 'Darwin',
    title: /Darwin/i, range: [1809, 1945],
    parts: { 1: [1809, 1882], 2: [1883, 1945] },
  },
  {
    id: 'gordon', name: 'Gordon of Khartoum', short: 'Gordon',
    title: /Gordon of Khartoum/i, text: /General Gordon \(Part/i, range: [1833, 1885],
    parts: { 1: [1833, 1884], 2: [1884, 1885] },
  },
  {
    id: 'van-gogh', name: 'Great Artists: Van Gogh', short: 'Van Gogh',
    title: /Van Gogh/i, range: [1853, 1890],
  },
  {
    id: 'stalin', name: 'Stalin', short: 'Stalin',
    title: /Stalin:/i, range: [1878, 1953],
    parts: { 1: [1878, 1924], 2: [1928, 1933], 3: [1936, 1940], 4: [1939, 1943], 5: [1945, 1953] },
  },
  {
    id: 'monty-vs-rommel', name: 'Monty vs Rommel', short: 'Monty v Rommel',
    title: /Monty (?:vs|&|and) Rommel/i, text: /Monty (?:vs|&|and) Rommel \(Part/i, range: [1887, 1944],
    parts: { 1: [1887, 1940], 2: [1940, 1941], 3: [1942, 1942], 4: [1943, 1944] },
  },
  {
    id: 'mao', name: 'The Life of Chairman Mao', short: 'Mao',
    title: /Chairman Mao/i, range: [1893, 1976],
    parts: { 1: [1893, 1949], 2: [1949, 1976] },
  },
  {
    id: 'suffragettes', name: 'The Suffragettes', short: 'Suffragettes',
    title: /Suffragette/i, range: [1903, 1928],
    parts: { 1: [1903, 1909], 2: [1909, 1928] },
  },
  {
    id: 'russian-revolution', name: 'The Russian Revolution', short: 'Russian Rev.',
    title: /Russian Revolution/i, range: [1905, 1922],
  },
  {
    id: 'eichmann', name: 'The Eichmann Trial', short: 'Eichmann',
    title: /Eichmann/i, range: [1906, 1962],
    parts: { 1: [1932, 1945], 2: [1945, 1957], 3: [1957, 1960], 4: [1961, 1962] },
  },
  {
    id: 'titanic', name: 'The Titanic', short: 'Titanic',
    title: /Titanic/i, range: [1912, 1912],
  },
  {
    id: 'thatcher', name: 'Margaret Thatcher & The Falklands', short: 'Thatcher',
    title: /Thatcher/i, range: [1925, 1990],
    parts: { 1: [1925, 1979], 2: [1979, 1982], 3: [1982, 1982], 4: [1982, 1984], 5: [1984, 1987], 6: [1987, 1990] },
  },
  {
    id: 'world-cup', name: 'The History of The World Cup', short: 'World Cup',
    title: /World Cup/i, range: [1930, 2022],
    parts: { 1: [1930, 1950], 2: [1950, 1970], 3: [1970, 1994], 4: [1994, 2022] },
  },
  {
    id: 'dunkirk', name: 'Dunkirk', short: 'Dunkirk',
    title: /Dunkirk/i, range: [1940, 1940],
  },

  // ── Post-war ───────────────────────────────────────────────────────────────
  {
    id: 'east-germany', name: 'East Germany & The Stasi', short: 'GDR',
    title: /East Germany|\bGDR\b|Stasi/i, text: /The GDR \(Part/i, range: [1945, 1990],
    parts: { 1: [1945, 1961], 2: [1961, 1990] },
  },
  {
    id: 'cuban-missile-crisis', name: 'The Cuban Missile Crisis', short: 'Cuba',
    title: /Cuban Missile Crisis/i, range: [1945, 1962],
    parts: { 1: [1945, 1961], 2: [1962, 1962] },
  },
  {
    id: 'iranian-revolution', name: 'The Iranian Revolution, 1979', short: 'Iran',
    title: /Iranian Revolution/i, range: [1951, 1979],
    parts: { 1: [1951, 1953], 2: [1953, 1978], 3: [1978, 1979] },
  },
  {
    id: 'the-troubles', name: 'The Troubles', short: 'Troubles',
    title: /The Troubles/i, range: [1968, 1998],
  },
  {
    id: 'pol-pot', name: 'Pol Pot & The Khmer Rouge', short: 'Pol Pot',
    title: /Pol Pot|Khmer Rouge/i, range: [1975, 1979],
  },
  {
    id: 'dingo', name: '“A Dingo Ate My Baby!”', short: 'Dingo',
    title: /Dingo Ate My Baby/i, range: [1980, 2012],
    parts: { 1: [1980, 1982], 2: [1982, 2012] },
  },
  {
    id: 'oj-simpson', name: 'The People vs O.J. Simpson', short: 'O.J.',
    title: /O\.?\s?J\.? Simpson/i, range: [1994, 1997],
  },
]
