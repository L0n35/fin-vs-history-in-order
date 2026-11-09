<script setup lang="ts">
import { formatDate, formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  ep: any
  /** Strict order: show the series name, since neighbours can come from different series. */
  strict?: boolean
  highlight?: boolean
}>()

const partLabel = computed(() => {
  const { p, of } = props.ep
  if (p == null) return props.ep.series ? 'Single episode' : ''
  return `Part ${p}${of ? ` of ${of}` : ''}`
})
const minutes = computed(() => (props.ep.duration ? Math.round(props.ep.duration / 60) : null))
const youtube = computed(
  () => 'https://www.youtube.com/@FinvsHistory/search?query=' + encodeURIComponent(props.ep.title.replace(/[“”"]/g, '')),
)
</script>

<template>
  <li class="ep" :class="{ 'is-theme': ep.series?.theme, hl: highlight }">
    <span class="yr">{{ ep.range ? formatRange(ep.range) : 'Undated' }}</span>
    <div class="ep-body">
      <div class="kick">
        <span v-if="strict && ep.series" class="chip">{{ ep.series.name }}</span>
        <span v-if="partLabel" class="k">{{ partLabel }}</span>
        <span v-if="ep.sub" class="k">{{ ep.sub }}</span>
        <span v-if="ep.isNew" class="badge">New</span>
      </div>
      <div class="ep-title">{{ ep.joke }}</div>
      <p v-if="ep.blurb" class="blurb">{{ ep.blurb }}</p>
      <div class="meta">
        <span>Released {{ formatDate(ep.date) }}</span>
        <template v-if="minutes">
          <span class="sep" aria-hidden="true">·</span>
          <span>{{ minutes }} min</span>
        </template>
        <span class="sep" aria-hidden="true">·</span>
        <a :href="youtube" target="_blank" rel="noopener noreferrer">Find on YouTube ↗</a>
      </div>
    </div>
  </li>
</template>
