<script setup lang="ts">
import { formatDate } from '~~/lib/format.mjs'

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

const statsLine = [
  `${stats.episodes + stats.bonus} episodes`,
  `${stats.series + stats.bonusSeries} series`,
  `updated ${formatDate(String(buildTime))}`,
].join(' · ')
</script>

<template>
  <div>
    <header class="hero">
      <div class="wrap">
        <h1>Fin vs History, in&nbsp;order</h1>
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
            <input id="q" v-model="query" type="search" placeholder="Napoleon, Stalin, Charlie’s lizard…" autocomplete="off">
          </label>
        </div>
      </div>

      <div v-show="view === 'list'" class="wrap">
        <ListView :series="catalogue.series" :undated="catalogue.undated" :query="query" :show-bonus="showBonus" />
      </div>

      <div v-if="view === 'timeline'" class="wrap wide">
        <ClientOnly>
          <TimelineView :series="catalogue.series" :query="query" :show-bonus="showBonus" />
        </ClientOnly>
      </div>
    </main>

    <footer>
      <div class="wrap">
        <p>
          Unofficial fan site, not affiliated with Fin vs History.
          <a href="https://www.patreon.com/fintaylor" target="_blank" rel="noopener noreferrer">Support the show on Patreon ↗</a>
        </p>
      </div>
    </footer>
  </div>
</template>
