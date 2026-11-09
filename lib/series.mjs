import { PRESENT } from './format.mjs'

// ─────────────────────────────────────────────────────────────────────────────
// The series-to-dates mapping. This is the only file you edit by hand.
//
// Each series says how to recognise its episodes and when it happened:
//   title     Regex tested against the series half of the title (after the "|"),
//             e.g. "Stalin: Barbarossa (Part 4)". The joke half is ignored.
//   text      Optional regex tested against the description before the chapters,
//             for episodes whose title doesn't name the series
//             (e.g. "The Great Northern War (Part One)").
//   range     [start, end] in years. Negative = BC. PRESENT = still going.
//   parts     Optional per-part ranges, keyed by part number.
//   subjects  Optional ranges per subject, for series where each episode covers a
//             different person (e.g. each Prime Minister). Keyed by the name in the
//             title; the value is a range, or per-part ranges for that subject.
//   theme     true for series that sweep across the ages. They get their own
//             section instead of being pinned to a start date.
//
// The first series whose rule matches wins. Episodes nothing matches show up
// under "Not dated yet" on the site and in the GitHub Action's summary.
//
// All dates here are a fan's best guess from the titles and descriptions.
// Fix them as you listen.
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
 * @property {Record<string, Range | Record<number, Range>>} [subjects]
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
  {
    id: 'wine', name: 'The History of Wine', short: 'Wine', theme: true,
    title: /History of Wine/i, range: [-6000, PRESENT],
  },
  {
    id: 'flight', name: 'The History of Flight', short: 'Flight', theme: true,
    title: /History of Flight/i, range: [1000, 1945],
    parts: { 1: [1000, 1914], 2: [1914, 1945] },
  },
  {
    id: 'cricket', name: 'The History of Cricket', short: 'Cricket', theme: true,
    title: /History of Cricket|History of The Ashes/i, range: [1597, PRESENT],
    parts: { 1: [1597, 1900], 2: [1877, PRESENT] },
  },

  // ── Prehistory and the ancient world ───────────────────────────────────────
  {
    id: 'prehistoric-man', name: 'Prehistoric Man', short: 'Prehistoric',
    title: /Prehistoric Man/i, range: [-2000000, -3000],
    parts: { 1: [-2000000, -40000], 2: [-40000, -3000] },
  },
  {
    id: 'dionysus', name: 'Dionysus & The Ancient Gods of Wine', short: 'Dionysus',
    title: /Dionysus|Gods of Wine/i, range: [-1500, 400],
  },
  {
    id: 'athens', name: 'The Golden Age of Athens', short: 'Athens',
    title: /Golden Age of Athens/i, range: [-510, -399],
    parts: { 1: [-510, -450], 2: [-450, -399] },
  },
  {
    id: 'cleopatra', name: 'Cleopatra', short: 'Cleopatra',
    title: /Cleopatra/i, range: [-69, -30],
    parts: { 1: [-69, -44], 2: [-44, -30] },
  },
  {
    id: 'claudius', name: 'Claudius', short: 'Claudius',
    title: /Claudius/i, range: [-10, 54],
    parts: { 1: [-10, 41], 2: [41, 54] },
  },
  {
    id: 'caligula', name: 'Caligula', short: 'Caligula',
    title: /Caligula/i, range: [12, 41],
    parts: { 1: [12, 37], 2: [37, 41] },
  },
  {
    id: 'nero', name: 'Nero & The Emperors of Rome', short: 'Nero',
    title: /\bNero\b/i, range: [14, 68],
    parts: { 1: [14, 59], 2: [59, 68] },
  },

  // ── Medieval ───────────────────────────────────────────────────────────────
  {
    id: 'medieval-women', name: 'Medieval Women', short: 'Medieval women',
    title: /Medieval Women/i, range: [500, 1500],
  },
  {
    id: 'vikings', name: 'Vikings', short: 'Vikings',
    title: /\bVikings\b/i, range: [793, 1066],
    parts: { 1: [793, 900], 2: [900, 1066] },
  },
  {
    id: 'first-crusade', name: 'The First Crusade', short: '1st Crusade',
    title: /First Crusade/i, range: [1095, 1099],
    parts: { 1: [1095, 1097], 2: [1097, 1099] },
  },
  {
    id: 'saladin', name: 'Saladin & The Third Crusade', short: 'Saladin',
    title: /Saladin|Third Crusade/i, range: [1137, 1192],
    parts: { 1: [1137, 1187], 2: [1187, 1192] },
  },
  {
    id: 'genghis-khan', name: 'Genghis Khan', short: 'Genghis',
    title: /Genghis Khan/i, range: [1162, 1227],
    parts: { 1: [1162, 1206], 2: [1206, 1227] },
  },
  {
    id: 'feudal-japan', name: 'Feudal Japan', short: 'Feudal Japan',
    title: /Feudal Japan/i, range: [1185, 1868],
    parts: { 1: [1185, 1467], 2: [1467, 1603], 3: [1603, 1853], 4: [1853, 1868] },
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
  {
    id: 'joan-of-arc', name: 'Joan of Arc', short: 'Joan of Arc',
    title: /Joan of Arc/i, range: [1412, 1431],
  },
  {
    id: 'richard-iii', name: 'Richard III and The Princes in The Tower', short: 'Richard III',
    title: /Richard III/i, range: [1452, 1485],
    parts: { 1: [1452, 1483], 2: [1483, 1485] },
  },

  // ── Early modern ───────────────────────────────────────────────────────────
  {
    id: 'renaissance', name: 'The Renaissance', short: 'Renaissance',
    title: /Renaissance/i, range: [1400, 1600],
    parts: { 1: [1400, 1550], 2: [1420, 1600] },
  },
  {
    id: 'witch-hunts', name: 'Witch Hunts in Early Modern Europe', short: 'Witch hunts',
    title: /Witch Hunts/i, range: [1450, 1750],
  },
  {
    id: 'reformation', name: 'The Reformation', short: 'Reformation',
    title: /Reformation/i, range: [1483, 1648],
    parts: { 1: [1483, 1521], 2: [1521, 1546], 3: [1536, 1564], 4: [1546, 1648] },
  },
  {
    id: 'aztecs', name: 'The Aztecs', short: 'Aztecs',
    title: /Cort[eé]s|Aztec/i, range: [1325, 1547],
    parts: { 1: [1325, 1500], 2: [1492, 1519], 3: [1519, 1520], 4: [1520, 1521], 5: [1521, 1547] },
  },
  {
    id: 'henry-viii', name: 'Henry VIII', short: 'Henry VIII',
    title: /Henry VIII/i, range: [1491, 1547],
    parts: { 1: [1491, 1527], 2: [1526, 1536], 3: [1536, 1540], 4: [1540, 1547] },
  },
  {
    id: 'white-slave-trade', name: 'The White Slave Trade', short: 'White slavery',
    title: /White Slave Trade/i, range: [1500, 1830],
    parts: { 1: [1500, 1700], 2: [1700, 1830] },
  },
  {
    id: 'english-civil-war', name: 'The English Civil War', short: 'Civil War',
    title: /English Civil War/i, range: [1625, 1658],
    parts: { 1: [1625, 1645], 2: [1645, 1658] },
  },
  {
    id: 'piracy', name: 'The Golden Age of Piracy', short: 'Piracy',
    title: /Golden Age of Piracy/i, range: [1650, 1730],
    parts: { 1: [1650, 1700], 2: [1700, 1730] },
  },
  {
    id: 'dick-turpin', name: 'Dick Turpin & Highwaymen', short: 'Highwaymen',
    title: /Dick Turpin|Highwaymen/i, range: [1650, 1815],
    parts: { 1: [1650, 1739], 2: [1700, 1815] },
  },
  {
    id: 'great-northern-war', name: 'The Great Northern War', short: 'Great N. War',
    title: /Great Northern War|Peter The Great/i, text: /Great Northern War \(Part/i, range: [1672, 1721],
    parts: { 1: [1672, 1700], 2: [1700, 1721] },
  },
  {
    id: 'salem', name: 'The Salem Witch Trials', short: 'Salem',
    title: /\bSalem\b/i, range: [1692, 1693],
  },
  {
    id: 'captain-cook', name: 'Captain Cook & The First Fleet', short: 'Cook',
    title: /Captain Cook|First Fleet/i, range: [1728, 1788],
    parts: { 1: [1728, 1779], 2: [1775, 1788] },
  },
  {
    id: 'great-composers', name: 'The Great Composers', short: 'Composers',
    title: /Great Composers|Mozart|Beethoven/i, range: [1756, 1827],
    parts: { 1: [1756, 1791], 2: [1770, 1827] },
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
    id: 'little-bighorn', name: 'The Battle of Little Bighorn', short: 'Little Bighorn',
    title: /Little Big ?Horn/i, range: [1839, 1876],
    parts: { 1: [1839, 1866], 2: [1866, 1874], 3: [1874, 1876], 4: [1876, 1876] },
  },
  {
    id: 'great-artists', name: 'Great Artists', short: 'Artists',
    title: /Great Artists|Van Gogh|Picasso/i, range: [1853, 1973],
    parts: { 1: [1853, 1890], 2: [1881, 1973] },
  },
  {
    id: 'freud', name: 'Sigmund Freud & The Birth of Psychology', short: 'Freud',
    title: /Freud/i, range: [1856, 1939],
    parts: { 1: [1856, 1900], 2: [1900, 1939] },
  },
  {
    id: 'mafia', name: 'The Mafia', short: 'Mafia',
    title: /\bMafia\b/i, range: [1860, 1992],
    parts: { 1: [1860, 1920], 2: [1920, 1992] },
  },
  {
    id: 'gandhi', name: 'Mahatma Gandhi', short: 'Gandhi',
    title: /Gandhi/i, range: [1869, 1948],
    parts: { 1: [1869, 1915], 2: [1915, 1930], 3: [1930, 1942], 4: [1942, 1948] },
  },
  {
    id: 'stalin', name: 'Stalin', short: 'Stalin',
    title: /Stalin:/i, range: [1878, 1953],
    parts: { 1: [1878, 1924], 2: [1928, 1933], 3: [1936, 1940], 4: [1939, 1943], 5: [1945, 1953] },
  },
  {
    id: 'jack-the-ripper', name: 'Jack the Ripper', short: 'Ripper',
    title: /Jack the Ripper/i, range: [1888, 1888],
  },
  {
    id: 'monty-vs-rommel', name: 'Monty vs Rommel', short: 'Monty v Rommel',
    title: /Monty (?:vs|&|and) Rommel/i, text: /Monty (?:vs|&|and) Rommel \(Part/i, range: [1887, 1944],
    parts: { 1: [1887, 1940], 2: [1940, 1941], 3: [1942, 1942], 4: [1943, 1944] },
  },
  {
    id: 'luftwaffe', name: 'Göring, The Battle of Britain & The Blitz', short: 'Luftwaffe',
    title: /G[oö]ring|Luftwaffe|Battle of Britain|\bThe Blitz\b/i, range: [1893, 1941],
    parts: { 1: [1893, 1939], 2: [1940, 1940], 3: [1940, 1941] },
  },
  {
    id: 'mao', name: 'The Life of Chairman Mao', short: 'Mao',
    title: /Chairman Mao/i, range: [1893, 1976],
    parts: { 1: [1893, 1949], 2: [1949, 1962], 3: [1962, 1976] },
  },
  {
    id: 'suffragettes', name: 'The Suffragettes', short: 'Suffragettes',
    title: /Suffragette/i, range: [1903, 1928],
    parts: { 1: [1903, 1909], 2: [1909, 1928] },
  },
  {
    id: 'russian-revolution', name: 'The Russian Revolution of 1917', short: 'Russian Rev.',
    title: /Russian Revolution/i, range: [1861, 1918],
    parts: { 1: [1861, 1905], 2: [1905, 1916], 3: [1917, 1917], 4: [1917, 1918], 5: [1918, 1918] },
  },
  {
    id: 'eichmann', name: 'The Eichmann Trial', short: 'Eichmann',
    title: /Eichmann/i, range: [1906, 1962],
    parts: { 1: [1932, 1945], 2: [1945, 1957], 3: [1957, 1960], 4: [1961, 1962] },
  },
  {
    id: 'papa-doc', name: 'Papa Doc: Haitian Dictator', short: 'Papa Doc',
    title: /Papa Doc/i, range: [1907, 1971],
    parts: { 1: [1907, 1964], 2: [1964, 1971] },
  },
  {
    id: 'titanic', name: 'The Titanic', short: 'Titanic',
    title: /Titanic/i, range: [1907, 1912],
    parts: { 1: [1907, 1912], 2: [1912, 1912], 3: [1912, 1912] },
  },
  {
    id: 'thatcher', name: 'Margaret Thatcher & The Falklands', short: 'Thatcher',
    title: /Thatcher/i, range: [1925, 1990],
    parts: { 1: [1925, 1979], 2: [1979, 1982], 3: [1982, 1982], 4: [1982, 1984], 5: [1984, 1987], 6: [1987, 1990] },
  },
  {
    id: 'idi-amin', name: 'Idi Amin', short: 'Idi Amin',
    title: /Idi Amin/i, range: [1925, 2003],
    parts: { 1: [1925, 1971], 2: [1971, 1973], 3: [1974, 1976], 4: [1976, 2003] },
  },
  {
    id: 'world-cup', name: 'The History of The World Cup', short: 'World Cup',
    title: /World Cup/i, range: [1930, 2022],
    parts: { 1: [1930, 1950], 2: [1950, 1970], 3: [1970, 1994], 4: [1994, 2022] },
  },
  {
    id: 'dunkirk', name: 'Dunkirk', short: 'Dunkirk',
    title: /Dunkirk/i, range: [1939, 1940],
    parts: { 1: [1939, 1940], 2: [1940, 1940], 3: [1940, 1940], 4: [1940, 1940] },
  },
  {
    id: 'gaddafi', name: 'The Rise and Fall of Colonel Gaddafi', short: 'Gaddafi',
    title: /Gaddafi|Gadaffi/i, range: [1942, 2011],
    parts: { 1: [1942, 1969], 2: [1969, 1980], 3: [1980, 1989], 4: [1989, 2011] },
  },
  {
    id: 'space-race', name: 'The Space Race', short: 'Space Race',
    title: /Space Race/i, range: [1942, 1972],
    parts: { 1: [1942, 1961], 2: [1961, 1972] },
  },
  {
    id: 'cia', name: 'The CIA', short: 'CIA',
    title: /\bCIA\b/i, range: [1942, 1961],
    subjects: { 'The Origins of the CIA': [1942, 1953], 'The CIA Under Allen Dulles': [1953, 1961] },
  },

  // ── Post-war ───────────────────────────────────────────────────────────────
  {
    id: 'east-germany', name: 'East Germany & The Stasi', short: 'GDR',
    title: /East Germany|\bGDR\b|Stasi|Berlin Wall/i, text: /The GDR \(Part/i, range: [1945, 1990],
    parts: { 1: [1945, 1961], 2: [1961, 1990] },
  },
  {
    id: 'cuban-missile-crisis', name: 'The Cuban Missile Crisis', short: 'Cuba',
    title: /Cuban Missile Crisis/i, range: [1945, 1962],
    parts: { 1: [1945, 1961], 2: [1962, 1962] },
  },
  {
    id: 'prime-ministers', name: 'Post-War British Prime Ministers, 1945–1979', short: 'PMs',
    title: /Post[- ]War British Prime Ministers/i, range: [1945, 1979],
    subjects: {
      'Clement Attlee': { 1: [1945, 1947], 2: [1947, 1951] },
      'Winston Churchill': [1951, 1955],
      'Anthony Eden': [1955, 1957],
      'Antony Eden': [1955, 1957],
      'Harold Macmillan': [1957, 1963],
      'Alec Douglas-Home': [1963, 1964],
      'Harold Wilson': { 1: [1964, 1970], 2: [1974, 1976] },
      'Ted Heath': [1970, 1974],
      'Edward Heath': [1970, 1974],
      'Jim Callaghan': [1976, 1979],
      'James Callaghan': [1976, 1979],
    },
  },
  {
    id: 'iranian-revolution', name: 'The Iranian Revolution, 1979', short: 'Iran',
    title: /Iranian Revolution/i, range: [1951, 1979],
    parts: { 1: [1951, 1953], 2: [1953, 1978], 3: [1978, 1979] },
  },
  {
    id: 'the-troubles', name: 'The Troubles', short: 'Troubles',
    title: /The Troubles/i, range: [1921, 1998],
    parts: { 1: [1921, 1971], 2: [1972, 1998] },
  },
  {
    id: 'chernobyl', name: 'Chernobyl', short: 'Chernobyl',
    title: /Chernobyl/i, range: [1970, 2000],
    parts: { 1: [1970, 1986], 2: [1986, 1986], 3: [1986, 2000] },
  },
  {
    id: 'pol-pot', name: 'Pol Pot & The Khmer Rouge', short: 'Pol Pot',
    title: /Pol Pot|Khmer Rouge/i, range: [1975, 1979],
  },
  {
    id: 'hunger-strikes', name: 'IRA Hunger Strikes', short: 'Hunger strikes',
    title: /Hunger Strike/i, range: [1976, 1981],
    parts: { 1: [1976, 1980], 2: [1980, 1981] },
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
  {
    id: 'thai-cave', name: 'The Thai Cave Rescue', short: 'Thai cave',
    title: /Thai Cave/i, range: [2018, 2018],
  },
]
