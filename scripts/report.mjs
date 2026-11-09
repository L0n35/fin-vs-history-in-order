// Prints a Markdown summary of what's dated and what isn't.
// The GitHub Action appends this to the run's summary page, so new series are easy to spot.
import { readFile } from 'node:fs/promises'
import { buildCatalogue } from '../lib/catalogue.mjs'
import { SERIES } from '../lib/series.mjs'

const raw = await readFile(new URL('../data/episodes.json', import.meta.url), 'utf8').catch(() => '[]')
const { stats, undated } = buildCatalogue(JSON.parse(raw), SERIES)

const lines = [
  '## Fin vs History, in order',
  '',
  `**${stats.episodes}** episodes in the feed · **${stats.dated}** dated across **${stats.series}** series · **${stats.undated}** not dated yet`,
  '',
]

if (undated.length) {
  lines.push(
    '### Not dated yet',
    '',
    'Add a series for each of these to `lib/series.mjs`:',
    '',
    '| Series in title | Episodes | Example title |',
    '| --- | --- | --- |',
    ...undated.map((g) => `| ${g.label.replace(/\|/g, '\\|')} | ${g.eps.length} | ${g.eps[0].title.replace(/\|/g, '\\|')} |`),
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
