<script setup lang="ts">
import { formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  series: any
  eps: any[]
  highlightPart?: number | null
}>()

const count = computed(() => `${props.eps.length} ${props.eps.length === 1 ? 'episode' : 'episodes'}`)
</script>

<template>
  <article class="series" :class="{ theme: series.theme }">
    <div class="series-head">
      <span class="yr">{{ formatRange(series.range) }}</span>
      <div>
        <h3>{{ series.name }}</h3>
        <div class="series-sub">{{ count }}</div>
      </div>
    </div>
    <ol class="eps">
      <EpisodeItem
        v-for="e in eps"
        :key="e.guid"
        :ep="e"
        :highlight="highlightPart != null && e.p === highlightPart"
      />
    </ol>
  </article>
</template>
