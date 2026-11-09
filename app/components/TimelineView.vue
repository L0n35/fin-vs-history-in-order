<script setup lang="ts">
import { ERAS, formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  series: any[]
  query: string
  showBonus: boolean
  undatedCount: number
}>()

const { countWatched } = useWatched()

const WIDTH = 1680
const ROW = 32
const END = new Date().getUTCFullYear() + 1

/** Year → x position. Each era gets a fixed share of the width, so recent centuries get more room. */
function x(year: number) {
  let acc = 0
  for (let i = 0; i < ERAS.length; i++) {
    const era = ERAS[i]!
    const to = Math.min(era.to, END)
    const width = era.w * WIDTH
    if (year <= to || i === ERAS.length - 1) {
      const f = Math.max(0, Math.min(1, (Math.min(year, END) - era.from) / (to - era.from)))
      return acc + f * width
    }
    acc += width
  }
  return acc
}

const bands = (() => {
  let left = 0
  return ERAS.map((era, i) => {
    const width = era.w * WIDTH
    const band = { name: era.name, left, width, alt: i % 2 === 1 }
    left += width
    return band
  })
})()

const TICKS = [
  { y: -2000000, l: '2 million BC', c: 'start' }, { y: -3000, l: '3000 BC' }, { y: -1000, l: '1000 BC' },
  { y: 500, l: 'AD 500' }, { y: 1000, l: '1000' }, { y: 1500, l: '1500' }, { y: 1600, l: '1600' },
  { y: 1700, l: '1700' }, { y: 1800, l: '1800' }, { y: 1850, l: '1850' }, { y: 1900, l: '1900' },
  { y: 1945, l: '1945' }, { y: 1980, l: '1980' }, { y: 2000, l: '2000' }, { y: END, l: 'Now', c: 'end' },
]
const gridTicks = TICKS.filter((t) => !t.c)

// Label widths are measured with the real font, so re-pack once the web font has loaded.
const fontsLoaded = ref(0)
let ctx: CanvasRenderingContext2D | null = null
function measure(text: string) {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * 7
  ctx.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'
  return Math.ceil(ctx.measureText(text).width)
}
onMounted(() => {
  document.fonts?.ready.then(() => fontsLoaded.value++)
})

const needle = computed(() => props.query.trim().toLowerCase())
function matches(e: any) {
  if (!needle.value) return true
  return [e.series?.name, e.title, e.sub, e.blurb].filter(Boolean).join(' ').toLowerCase().includes(needle.value)
}

type Item = {
  sid: string; label: string; range: [number, number]; theme: boolean; bonus: boolean; tip: string
  side?: 'in' | 'right' | 'left'; barW?: number; l?: number; r?: number; lane?: number
}

function itemsFor(theme: boolean): Item[] {
  return props.series
    .filter((s) => s.range && s.theme === theme && (props.showBonus || !s.bonus) && s.eps.some(matches))
    .map((s) => {
      const guids = s.eps.map((e: any) => e.guid)
      const watched = countWatched(guids) === guids.length
      const name = s.name.replace(/[“”]/g, '')
      return {
        sid: s.id,
        label: watched ? `✓ ${name}` : name,
        range: s.range,
        theme,
        bonus: s.bonus,
        tip: `${s.name}, ${formatRange(s.range)}${s.bonus ? ' (bonus)' : ''}${watched ? ', watched' : ''}`,
      }
    })
}

/** Greedy lane packing: each bar takes the first row that's free where it starts, like clashing events in a calendar. */
function pack(items: Item[]) {
  for (const it of items) {
    const x1 = x(it.range[0])
    const x2 = x(it.range[1])
    const barW = Math.max(x2 - x1, 6)
    const labelW = measure(it.label) + 4 // a little slack for font rendering differences
    it.barW = barW
    if (barW >= labelW + 18) Object.assign(it, { side: 'in', l: x1, r: x1 + barW })
    else if (x1 + barW + 6 + labelW <= WIDTH - 8) Object.assign(it, { side: 'right', l: x1, r: x1 + barW + 6 + labelW })
    else Object.assign(it, { side: 'left', l: x1 - 6 - labelW, r: x1 + barW })
  }
  items.sort((a, b) => a.l! - b.l! || a.r! - b.r!)
  const lanes: number[] = []
  for (const it of items) {
    let k = lanes.findIndex((end) => end + 14 <= it.l!)
    if (k < 0) {
      k = lanes.length
      lanes.push(0)
    }
    lanes[k] = it.r!
    it.lane = k
  }
  return { items, height: Math.max(lanes.length, 1) * ROW + 16 }
}

const groups = computed(() => {
  void fontsLoaded.value
  return [
    { key: 'main', label: '', ...pack(itemsFor(false)) },
    { key: 'themes', label: 'Across the ages', ...pack(itemsFor(true)) },
  ]
})

const selected = ref<string>(props.series.find((s) => s.id === 'napoleonic-wars')?.id ?? props.series[0]?.id ?? '')
const selectedSeries = computed(() => props.series.find((s) => s.id === selected.value))
</script>

<template>
  <div>
    <div class="tl-scroll">
      <div class="tl" :style="{ width: `${WIDTH}px` }">
        <div
          v-for="b in bands"
          :key="b.name"
          class="tl-band"
          :class="{ alt: b.alt }"
          :style="{ left: `${b.left}px`, width: `${b.width}px` }"
        >
          <span class="tl-band-name">{{ b.name }}</span>
        </div>
        <div v-for="t in gridTicks" :key="`grid-${t.y}`" class="tl-grid" :style="{ left: `${x(t.y)}px` }" />
        <div class="tl-axis">
          <span v-for="t in TICKS" :key="t.y" class="tl-tick" :class="t.c" :style="{ left: `${x(t.y)}px` }">{{ t.l }}</span>
        </div>

        <template v-for="g in groups" :key="g.key">
          <div v-if="g.label" class="tl-group"><span class="tl-group-lab">{{ g.label }}</span></div>
          <div class="tl-lanes" :style="{ height: `${g.height}px` }">
            <button
              v-for="it in g.items"
              :key="it.sid"
              type="button"
              class="tl-item"
              :class="{ theme: it.theme, bonus: it.bonus }"
              :style="{ left: `${it.l}px`, top: `${8 + it.lane! * ROW}px`, width: `${it.r! - it.l!}px` }"
              :aria-pressed="String(it.sid === selected)"
              :title="it.tip"
              @click="selected = it.sid"
            >
              <span v-if="it.side === 'left'" class="tl-lab">{{ it.label }}</span>
              <span class="tl-bar" :style="{ width: `${it.barW}px` }">{{ it.side === 'in' ? it.label : '' }}</span>
              <span v-if="it.side === 'right'" class="tl-lab">{{ it.label }}</span>
            </button>
          </div>
        </template>
      </div>
    </div>
    <p class="tl-hint">
      Scroll sideways to move through time. Tap a bar to see its episodes.
      <template v-if="showBonus"> Outlined bars are bonus episodes.</template>
      <template v-if="undatedCount">{{ undatedCount }} {{ undatedCount === 1 ? 'episode isn’t' : 'episodes aren’t' }} dated yet, so {{ undatedCount === 1 ? 'it’s' : 'they’re' }} only in the list.</template>
    </p>
    <div class="tl-detail">
      <SeriesCard v-if="selectedSeries" :key="selectedSeries.id" :series="selectedSeries" force-open />
    </div>
  </div>
</template>
