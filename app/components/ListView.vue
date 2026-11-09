<script setup lang="ts">
import { ERAS, eraIndex, formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  series: any[]
  undated: { label: string; bonus?: boolean; eps: any[] }[]
  query: string
  showBonus: boolean
}>()

const needle = computed(() => props.query.trim().toLowerCase())
function matches(e: any) {
  if (!needle.value) return true
  return [e.series?.name, e.title, e.sub, e.blurb].filter(Boolean).join(' ').toLowerCase().includes(needle.value)
}

type Card = { s: any; eps: any[] }

/** Series that pass the bonus toggle and the search, each with the episodes the search matched. */
const cards = computed<Card[]>(() =>
  props.series
    .filter((s) => props.showBonus || !s.bonus)
    .map((s) => ({ s, eps: s.eps.filter(matches) }))
    .filter((c) => c.eps.length),
)

/** Era sections in order. Headings only ever move forward, so a broad story never sends the list backwards. */
const sections = computed(() => {
  const out: { era: number; cards: Card[] }[] = []
  let current = -1
  for (const c of cards.value) {
    if (!c.s.range || c.s.theme) continue
    const i = Math.max(current, eraIndex(c.s.range))
    if (i !== current) {
      out.push({ era: i, cards: [] })
      current = i
    }
    out[out.length - 1]!.cards.push(c)
  }
  return out
})
const thematic = computed(() => cards.value.filter((c) => c.s.range && c.s.theme))
const oddsAndEnds = computed(() => cards.value.filter((c) => !c.s.range))

const undatedCards = computed<Card[]>(() =>
  props.undated
    .filter((g) => props.showBonus || !g.bonus)
    .map((g, i) => ({ s: { id: `undated-${i}`, name: g.label, range: null, bonus: g.bonus, eps: g.eps }, eps: g.eps.filter(matches) }))
    .filter((c) => c.eps.length),
)

const searching = computed(() => !!needle.value)
const isEmpty = computed(() => !cards.value.length && !undatedCards.value.length)
</script>

<template>
  <div>
    <section v-for="sec in sections" :key="sec.era" class="era">
      <header class="era-head">
        <h2>{{ ERAS[sec.era]!.name }}</h2>
        <span class="era-years">{{ formatRange([ERAS[sec.era]!.from, ERAS[sec.era]!.to]) }}</span>
      </header>
      <div class="cards">
        <SeriesCard v-for="c in sec.cards" :key="c.s.id" :series="c.s" :eps="c.eps" :force-open="searching" />
      </div>
    </section>

    <section v-if="thematic.length" class="era">
      <header class="era-head">
        <h2>Across the ages</h2>
        <span class="era-years">Thematic series</span>
      </header>
      <p class="era-note">
        These sweep through thousands of years. Pinning them to a start date would put a story about modern medicine
        next to the Neanderthals, so they sit here instead.
      </p>
      <div class="cards">
        <SeriesCard v-for="c in thematic" :key="c.s.id" :series="c.s" :eps="c.eps" :force-open="searching" />
      </div>
    </section>

    <section v-if="oddsAndEnds.length" class="era">
      <header class="era-head">
        <h2>Odds and ends</h2>
        <span class="era-years">Bonus</span>
      </header>
      <p class="era-note">Supercuts and specials that aren’t about one period.</p>
      <div class="cards">
        <SeriesCard v-for="c in oddsAndEnds" :key="c.s.id" :series="c.s" :eps="c.eps" :force-open="searching" />
      </div>
    </section>

    <section v-if="undatedCards.length" class="era undated">
      <header class="era-head">
        <h2>Not dated yet</h2>
        <span class="era-years">Newest first</span>
      </header>
      <p class="era-note">These are new and their series doesn’t have dates yet. They’ll move into place once it does.</p>
      <div class="cards">
        <SeriesCard v-for="c in undatedCards" :key="c.s.id" :series="c.s" :eps="c.eps" :force-open="searching" />
      </div>
    </section>

    <p v-if="isEmpty" class="empty">No episodes match “{{ query }}”. Try a person, a war or a word from a title.</p>
  </div>
</template>
