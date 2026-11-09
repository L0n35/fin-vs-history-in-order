<script setup lang="ts">
import { formatRange } from '~~/lib/format.mjs'

const props = withDefaults(
  defineProps<{
    series: any
    /** Episodes to list when open (may be narrowed by a search). Progress always counts the whole series. */
    eps?: any[]
    /** Keep the card open, e.g. while searching or in the timeline's detail panel. */
    forceOpen?: boolean
    /** Shown instead of the series name, e.g. "Medicine" under the "The History Of…" heading. */
    title?: string
    /** Whether the bonus episodes filed in this series are listed and counted. */
    showBonus?: boolean
  }>(),
  { showBonus: true },
)

const { countWatched, setWatched } = useWatched()

const expanded = ref(false)
const isOpen = computed(() => props.forceOpen || expanded.value)
const shown = computed<any[]>(() => props.eps ?? props.series.eps)
const shownMain = computed(() => shown.value.filter((e) => !e.tucked))
const shownBonus = computed(() => (props.showBonus ? shown.value.filter((e) => e.tucked) : []))

// "Watched" means the series itself. Bonus episodes filed with it are counted separately.
const guids = computed<string[]>(() => props.series.eps.filter((e: any) => !e.tucked).map((e: any) => e.guid))
const total = computed(() => guids.value.length)
const done = computed(() => countWatched(guids.value))
const allDone = computed(() => total.value > 0 && done.value === total.value)

const bonusGuids = computed<string[]>(() =>
  props.showBonus ? props.series.eps.filter((e: any) => e.tucked).map((e: any) => e.guid) : [],
)
const bonusTotal = computed(() => bonusGuids.value.length)
const bonusDone = computed(() => countWatched(bonusGuids.value))

const status = computed(() => {
  if (allDone.value) return 'Watched'
  if (done.value) return `Watched ${done.value} of ${total.value}`
  return `${total.value} ${total.value === 1 ? 'episode' : 'episodes'}`
})
const bonusStatus = computed(() => {
  if (!bonusTotal.value) return ''
  return bonusDone.value ? `${bonusDone.value} of ${bonusTotal.value} bonus` : `+${bonusTotal.value} bonus`
})
const bodyId = computed(() => `series-${props.series.id}`)

function onTickAll(event: Event) {
  setWatched(guids.value, (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <article class="series" :class="{ theme: series.theme, bonus: series.bonus, open: isOpen, done: allDone }">
    <h3 class="series-heading">
      <button
        type="button"
        class="series-toggle"
        :aria-expanded="String(isOpen)"
        :aria-controls="bodyId"
        @click="expanded = !isOpen"
      >
        <span class="series-years">{{ series.range ? formatRange(series.range) : series.undated ? 'New' : 'Various' }}</span>
        <span class="series-name">{{ title || series.name }}</span>
        <span class="series-foot">
          <span v-if="series.bonus" class="tag tag-bonus">Bonus</span>
          <span class="status-line">
            <span class="series-status" :class="{ started: done > 0 }">
              <span v-if="allDone" class="status-tick" aria-hidden="true">✓</span>{{ status }}
            </span>
            <template v-if="bonusStatus">
              <span class="sep" aria-hidden="true">·</span>
              <span class="status-bonus" :class="{ started: bonusDone > 0 }">{{ bonusStatus }}</span>
            </template>
          </span>
          <span v-if="total > 1" class="progress" aria-hidden="true">
            <span :style="{ width: `${(done / total) * 100}%` }" />
          </span>
        </span>
        <span class="chevron" aria-hidden="true" />
      </button>
    </h3>

    <div v-if="isOpen" :id="bodyId" class="series-body">
      <label v-if="total > 1" class="series-check">
        <input
          type="checkbox"
          class="tick"
          :checked="allDone"
          :indeterminate.prop="done > 0 && !allDone"
          @change="onTickAll"
        >
        <span>I’ve watched the whole series</span>
      </label>
      <ol v-if="shownMain.length" class="eps">
        <EpisodeItem v-for="e in shownMain" :key="e.guid" :ep="e" :series-range="series.range" :series-name="series.name" />
      </ol>
      <template v-if="shownBonus.length">
        <h4 class="eps-sub">Bonus episodes</h4>
        <ol class="eps eps-bonus">
          <EpisodeItem
            v-for="e in shownBonus"
            :key="e.guid"
            :ep="e"
            :series-range="series.range"
            :series-name="series.name"
            bonus-tag
          />
        </ol>
      </template>
    </div>
  </article>
</template>
