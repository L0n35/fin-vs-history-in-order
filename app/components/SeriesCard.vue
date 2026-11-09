<script setup lang="ts">
import { formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  series: any
  /** Episodes to list when open (may be narrowed by a search). Progress always counts the whole series. */
  eps?: any[]
  /** Keep the card open, e.g. while searching or in the timeline's detail panel. */
  forceOpen?: boolean
}>()

const { countWatched, setWatched } = useWatched()

const expanded = ref(false)
const isOpen = computed(() => props.forceOpen || expanded.value)
const shown = computed(() => props.eps ?? props.series.eps)

const guids = computed<string[]>(() => props.series.eps.map((e: any) => e.guid))
const total = computed(() => guids.value.length)
const done = computed(() => countWatched(guids.value))
const allDone = computed(() => total.value > 0 && done.value === total.value)

const status = computed(() => {
  if (allDone.value) return 'Watched'
  if (done.value) return `Watched ${done.value} of ${total.value}`
  return `${total.value} ${total.value === 1 ? 'episode' : 'episodes'}`
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
        <span class="series-years">{{ series.range ? formatRange(series.range) : 'No single period' }}</span>
        <span class="series-name">{{ series.name }}</span>
        <span class="series-foot">
          <span v-if="series.bonus" class="tag tag-bonus">Bonus</span>
          <span v-if="series.theme" class="tag tag-theme">Across the ages</span>
          <span class="series-status" :class="{ started: done > 0 }">
            <span v-if="allDone" class="status-tick" aria-hidden="true">✓</span>{{ status }}
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
      <ol class="eps">
        <EpisodeItem v-for="e in shown" :key="e.guid" :ep="e" :series-range="series.range" />
      </ol>
    </div>
  </article>
</template>
