<script setup lang="ts">
import { ERAS, compare, eraIndex, formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  series: any[]
  undated: { label: string; eps: any[] }[]
  order: 'series' | 'strict'
  query: string
}>()

const needle = computed(() => props.query.trim().toLowerCase())
function matches(e: any) {
  if (!needle.value) return true
  return [e.series?.name, e.title, e.sub, e.blurb].filter(Boolean).join(' ').toLowerCase().includes(needle.value)
}
const byDate = (a: any, b: any) => compare([a.range[0], a.range[1], a.p ?? 0, a.date], [b.range[0], b.range[1], b.p ?? 0, b.date])

type Section = { era: number; cards: { s: any; eps: any[] }[]; eps: any[] }

/** Era sections in order. Headings only ever move forward, so a broad story never sends the list backwards. */
const sections = computed<Section[]>(() => {
  const out: Section[] = []
  let current = -1
  const sectionFor = (range: [number, number]) => {
    const i = Math.max(current, eraIndex(range))
    if (i !== current) {
      out.push({ era: i, cards: [], eps: [] })
      current = i
    }
    return out[out.length - 1]!
  }
  const main = props.series.filter((s) => !s.theme)
  if (props.order === 'series') {
    for (const s of main) {
      const eps = s.eps.filter(matches)
      if (eps.length) sectionFor(s.range).cards.push({ s, eps })
    }
  } else {
    for (const e of main.flatMap((s) => s.eps).filter(matches).sort(byDate)) sectionFor(e.range).eps.push(e)
  }
  return out
})

const thematicCards = computed(() =>
  props.series.filter((s) => s.theme).map((s) => ({ s, eps: s.eps.filter(matches) })).filter((c) => c.eps.length),
)
const thematicEps = computed(() => thematicCards.value.flatMap((c) => c.eps).sort(byDate))

const undatedGroups = computed(() =>
  props.undated.map((g) => ({ label: g.label, eps: g.eps.filter(matches) })).filter((g) => g.eps.length),
)

const isEmpty = computed(() => !sections.value.length && !thematicCards.value.length && !undatedGroups.value.length)
</script>

<template>
  <div>
    <section v-for="sec in sections" :key="sec.era" class="era">
      <header class="era-head">
        <h2>{{ ERAS[sec.era]!.name }}</h2>
        <span class="era-years">{{ formatRange([ERAS[sec.era]!.from, ERAS[sec.era]!.to]) }}</span>
      </header>
      <template v-if="order === 'series'">
        <SeriesCard v-for="c in sec.cards" :key="c.s.id" :series="c.s" :eps="c.eps" />
      </template>
      <ol v-else class="eps strict">
        <EpisodeItem v-for="e in sec.eps" :key="e.guid" :ep="e" strict />
      </ol>
    </section>

    <section v-if="thematicCards.length" class="era">
      <header class="era-head">
        <h2>Across the ages</h2>
        <span class="era-years">Thematic series</span>
      </header>
      <p class="era-note">
        These sweep through thousands of years. Pinning them to a start date would put a story about modern medicine
        next to the Neanderthals, so they sit here instead.
      </p>
      <template v-if="order === 'series'">
        <SeriesCard v-for="c in thematicCards" :key="c.s.id" :series="c.s" :eps="c.eps" />
      </template>
      <ol v-else class="eps strict">
        <EpisodeItem v-for="e in thematicEps" :key="e.guid" :ep="e" strict />
      </ol>
    </section>

    <section v-if="undatedGroups.length" class="era undated">
      <header class="era-head">
        <h2>Not dated yet</h2>
        <span class="era-years">Newest first</span>
      </header>
      <p class="era-note">These are in the feed but their series doesn’t have dates yet. They’ll move into place once it does.</p>
      <article v-for="g in undatedGroups" :key="g.label" class="series">
        <div class="series-head">
          <span class="yr">Undated</span>
          <div>
            <h3>{{ g.label }}</h3>
            <div class="series-sub">{{ g.eps.length }} {{ g.eps.length === 1 ? 'episode' : 'episodes' }}</div>
          </div>
        </div>
        <ol class="eps">
          <EpisodeItem v-for="e in g.eps" :key="e.guid" :ep="e" />
        </ol>
      </article>
    </section>

    <p v-if="isEmpty" class="empty">No episodes match “{{ query }}”. Try a person, a war or a word from a title.</p>
  </div>
</template>
