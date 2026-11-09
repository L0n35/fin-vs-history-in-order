// Prints a Markdown summary of what's dated and what isn't.
// The GitHub Action appends this to the run's summary page, so new series are easy to spot.
import { readFile } from 'node:fs/promises'
import { buildCatalogue } from '../lib/catalogue.mjs'
import { BONUS_SERIES, SERIES } from '../lib/series.mjs'

const read = (name, fallback) => readFile(new URL(`../data/${name}`, import.meta.url), 'utf8').then(JSON.parse, () => fallback)
const episodes = await read('episodes.json', [])
const bonus = await read('bonus.json', [])
const links = await read('links.json', {})
const { stats, undated } = buildCatalogue([...episodes, ...bonus], SERIES, Date.now(), links, BONUS_SERIES)

const onYouTube = episodes.filter((e) => links[e.guid]?.youtube).length
const onSpotify = episodes.filter((e) => links[e.guid]?.spotify).length
const noLink = episodes.filter((e) => !links[e.guid]?.youtube && !links[e.guid]?.spotify)

const lines = [
  '## Fin vs History, in order',
  '',
  `**${stats.episodes}** episodes in the feed · **${stats.dated}** dated across **${stats.series}** series · **${stats.undated}** not dated yet`,
  '',
  `**${stats.bonus}** bonus episodes from Spotify in **${stats.bonusSeries}** series · **${stats.undatedBonus}** not dated yet`,
  '',
  `Links: **${onYouTube}** on YouTube · **${onSpotify}** on Spotify · **${noLink.length}** with neither`,
  '',
]

if (noLink.length && noLink.length < episodes.length) {
  lines.push(
    '<details><summary>Episodes with no YouTube or Spotify link</summary>',
    '',
    ...noLink.slice(0, 40).map((e) => `- ${e.title} (${e.date.slice(0, 10)})`),
    '',
    '</details>',
    '',
  )
}

if (undated.length) {
  lines.push(
    '### Not dated yet',
    '',
    'Add a series for each of these to `lib/series.mjs` (bonus ones to `BONUS_SERIES`):',
    '',
    '| Series in title | Bonus? | Episodes | Example title |',
    '| --- | --- | --- | --- |',
    ...undated.map((g) => `| ${g.label.replace(/\|/g, '\\|')} | ${g.bonus ? 'Bonus' : ''} | ${g.eps.length} | ${g.eps[0].title.replace(/\|/g, '\\|')} |`),
    '',
    'Template:',
    '',
    '```js',
    `{\n  id: 'new-series', name: '${undated[0].label.replace(/'/g, "\\'")}', short: 'Short',\n  title: /${undated[0].label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}/i, range: [1900, 1950],\n  parts: { 1: [1900, 1925], 2: [1925, 1950] },\n},`,
    '```',
  )
} else {
  lines.push('Every episode is dated. Nice.')
}

console.log(lines.join('\n'))
