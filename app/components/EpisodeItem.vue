<script setup lang="ts">
import { formatDate, formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  ep: any
  /** The series' own range; the episode's years are only shown when they differ. */
  seriesRange?: [number, number] | null
}>()

const { isWatched, setWatched } = useWatched()
const watched = computed(() => isWatched(props.ep.guid))

const years = computed(() => {
  const r = props.ep.range
  if (!r) return ''
  const s = props.seriesRange
  return s && s[0] === r[0] && s[1] === r[1] ? '' : formatRange(r)
})
const minutes = computed(() => (props.ep.duration ? Math.round(props.ep.duration / 60) : null))
const platforms = computed(() =>
  [
    { key: 'youtube', label: 'YouTube', verb: 'Watch', url: props.ep.links?.youtube },
    { key: 'spotify', label: 'Spotify', verb: 'Listen to', url: props.ep.links?.spotify },
    { key: 'patreon', label: 'Patreon', verb: 'Find', url: props.ep.links?.patreon },
  ].filter((p) => p.url),
)

function onTick(event: Event) {
  setWatched([props.ep.guid], (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <li class="ep" :class="{ watched }">
    <input
      type="checkbox"
      class="tick"
      :checked="watched"
      :aria-label="`Watched “${ep.joke}”`"
      @change="onTick"
    >
    <div class="ep-body">
      <div v-if="ep.p != null || years || ep.sub || ep.bonus || ep.isNew" class="kick">
        <span v-if="ep.p != null" class="k part">Part {{ ep.p }}</span>
        <span v-if="years" class="k">{{ years }}</span>
        <span v-if="ep.sub" class="k">{{ ep.sub }}</span>
        <span v-if="ep.bonus" class="tag tag-bonus">Bonus</span>
        <span v-if="ep.isNew" class="tag tag-new">New</span>
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
