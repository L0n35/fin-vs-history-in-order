<script setup lang="ts">
import { formatDate, formatYear } from '~~/lib/format.mjs'

type View = 'list' | 'timeline'
type Order = 'series' | 'strict'

const catalogue = useCatalogue()
const { stats } = catalogue
const { buildTime } = useRuntimeConfig().public

const view = ref<View>('list')
const order = ref<Order>('series')
const query = ref('')

function readHash() {
  view.value = window.location.hash === '#timeline' ? 'timeline' : 'list'
}
function setView(v: View) {
  view.value = v
  try {
    history.replaceState(null, '', `#${v}`)
  } catch {
    // Some embedded browsers block this; the view still switches.
  }
}
onMounted(() => {
  readHash()
  window.addEventListener('hashchange', readHash)
})
onBeforeUnmount(() => window.removeEventListener('hashchange', readHash))

const statsLine = computed(() => {
  const parts = [`${stats.episodes} episodes`, `${stats.series} series`]
  if (stats.earliest != null) parts.push(`${formatYear(stats.earliest)} to ${stats.latest}`)
  parts.push(`updated ${formatDate(String(buildTime))}`)
  return parts.join(' · ')
})

const explain = computed(() => {
  const text =
    order.value === 'series'
      ? 'Series stay together, ordered by when they start.'
      : 'Every episode sits at its own date, so series interleave and parts can swap places.'
  return view.value === 'timeline'
    ? `${text} Overlapping stories stack into rows, and recent centuries get more room so prehistory doesn’t squash everything else.`
    : text
})
</script>

<template>
  <div>
    <header class="hero">
      <div class="wrap">
        <p class="eyebrow">Unofficial fan guide</p>
        <h1>Fin vs History, in&nbsp;order</h1>
        <p class="lede">Every series sorted by when it happened, instead of when it came out.</p>
        <p class="stats">{{ statsLine }}</p>
      </div>
    </header>

    <main>
      <div class="wrap wide">
        <div class="controls">
          <div class="ctl">
            <span id="view-label" class="ctl-label">View</span>
            <div class="seg" role="group" aria-labelledby="view-label">
              <button type="button" :aria-pressed="String(view === 'list')" @click="setView('list')">List</button>
              <button type="button" :aria-pressed="String(view === 'timeline')" @click="setView('timeline')">Timeline</button>
            </div>
          </div>
          <div class="ctl">
            <span id="order-label" class="ctl-label">Order</span>
            <div class="seg" role="group" aria-labelledby="order-label">
              <button type="button" :aria-pressed="String(order === 'series')" @click="order = 'series'">By series</button>
              <button type="button" :aria-pressed="String(order === 'strict')" @click="order = 'strict'">Strictly by date</button>
            </div>
          </div>
          <label class="ctl search" for="q">
            <span class="ctl-label">Search</span>
            <input id="q" v-model="query" type="search" placeholder="Napoleon, Stalin, Salem…" autocomplete="off">
          </label>
        </div>
        <p class="explain">{{ explain }}</p>
      </div>

      <div v-show="view === 'list'" class="wrap">
        <ListView :series="catalogue.series" :undated="catalogue.undated" :order="order" :query="query" />
      </div>

      <div v-if="view === 'timeline'" class="wrap wide">
        <ClientOnly>
          <TimelineView :series="catalogue.series" :order="order" :query="query" :undated-count="stats.undated" />
        </ClientOnly>
      </div>
    </main>

    <footer>
      <div class="wrap">
        <p>An unofficial fan project, not affiliated with Fin Taylor, Horatio Gould or Podmasters.</p>
        <p>Episodes come from the show’s public RSS feed and update daily. The historical dates are a fan’s best guess, so some will be off.</p>
      </div>
    </footer>
  </div>
</template>
