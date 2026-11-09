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
const platforms = computed(() =>
  [
    { key: 'youtube', label: 'YouTube', verb: 'Watch', url: props.ep.links?.youtube },
    { key: 'spotify', label: 'Spotify', verb: 'Listen', url: props.ep.links?.spotify },
  ].filter((p) => p.url),
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
      </div>
      <div v-if="platforms.length" class="listen">
        <a
          v-for="pl in platforms"
          :key="pl.key"
          class="listen-link"
          :class="pl.key"
          :href="pl.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${pl.verb} “${ep.joke}” on ${pl.label}`"
        >{{ pl.label }} <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </li>
</template>
