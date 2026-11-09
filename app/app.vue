<script setup lang="ts">
import { formatDate, formatYear } from '~~/lib/format.mjs'

type View = 'list' | 'timeline'

const catalogue = useCatalogue()
const { stats } = catalogue
const { buildTime } = useRuntimeConfig().public
const watched = useWatched()

const view = ref<View>('list')
const showBonus = ref(true)
const query = ref('')

const BONUS_KEY = 'fvh-show-bonus'

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
function setShowBonus(on: boolean) {
  showBonus.value = on
  try {
    localStorage.setItem(BONUS_KEY, on ? '1' : '0')
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
}

onMounted(() => {
  readHash()
  window.addEventListener('hashchange', readHash)
  watched.load()
  try {
    if (localStorage.getItem(BONUS_KEY) === '0') showBonus.value = false
  } catch {
    // Storage blocked: keep the default.
  }
})
onBeforeUnmount(() => window.removeEventListener('hashchange', readHash))

const statsLine = computed(() => {
  const parts = [`${stats.episodes} episodes`, `${stats.bonus} bonus`, `${stats.series} series`]
  if (stats.earliest != null) parts.push(`${formatYear(stats.earliest)} to ${stats.latest}`)
  parts.push(`updated ${formatDate(String(buildTime))}`)
  return parts.join(' · ')
})

const explain = computed(() =>
  view.value === 'timeline'
    ? 'Each bar is a series. Overlapping stories stack into rows, and recent centuries get more room so prehistory doesn’t squash everything else.'
    : 'Tap a series to see its episodes and tick off what you’ve watched. Your ticks are saved in this browser.',
)
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
            <span id="bonus-label" class="ctl-label">Bonus episodes</span>
            <div class="seg" role="group" aria-labelledby="bonus-label">
              <button type="button" :aria-pressed="String(showBonus)" @click="setShowBonus(true)">Show</button>
              <button type="button" :aria-pressed="String(!showBonus)" @click="setShowBonus(false)">Hide</button>
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
        <ListView :series="catalogue.series" :undated="catalogue.undated" :query="query" :show-bonus="showBonus" />
      </div>

      <div v-if="view === 'timeline'" class="wrap wide">
        <ClientOnly>
          <TimelineView :series="catalogue.series" :query="query" :show-bonus="showBonus" :undated-count="stats.undated" />
        </ClientOnly>
      </div>
    </main>

    <footer>
      <div class="wrap">
        <p>An unofficial fan project, not affiliated with Fin Taylor, Horatio Gould or Podmasters.</p>
        <p>
          Episodes come from the show’s public RSS feed and update daily. Bonus episodes are Patreon exclusives
          listed on Spotify; the full versions are on the <a href="https://www.patreon.com/fintaylor" target="_blank" rel="noopener noreferrer">Fin vs History Patreon</a>.
          The historical dates are a fan’s best guess, so some will be off.
        </p>
      </div>
    </footer>
  </div>
</template>
