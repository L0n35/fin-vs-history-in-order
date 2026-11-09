<script setup lang="ts">
import { formatDate, formatRange } from '~~/lib/format.mjs'

const props = defineProps<{
  ep: any
  /** The series' own range; the episode's years are only shown when they differ. */
  seriesRange?: [number, number] | null
  /** The card's title; an episode title that just repeats it isn't shown again. */
  seriesName?: string
  /** Tag it Bonus: a bonus episode listed inside a main series. */
  bonusTag?: boolean
}>()

const squash = (s = '') => s.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '')
const showTitle = computed(() => !props.seriesName || squash(props.ep.joke) !== squash(props.seriesName))
// Don't repeat what the title already says, e.g. "History of The SAS [Part 1]" or "Killer Athletes: Oscar Pistorius".
const showPart = computed(
  () => props.ep.p != null && !(showTitle.value && /\bpart\s+(\d|one|two|three|four|five|six)/i.test(props.ep.joke)),
)
const showSub = computed(() => !!props.ep.sub && !(showTitle.value && squash(props.ep.joke).includes(squash(props.ep.sub))))

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
    { key: 'youtube' as const, label: 'YouTube', verb: 'Watch', url: props.ep.links?.youtube },
    { key: 'spotify' as const, label: 'Spotify', verb: 'Listen to', url: props.ep.links?.spotify },
    { key: 'patreon' as const, label: 'Patreon', verb: 'Find', url: props.ep.links?.patreon },
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
      <div v-if="bonusTag || showPart || years || showSub || ep.isNew" class="kick">
        <span v-if="bonusTag" class="tag tag-bonus">Bonus</span>
        <span v-if="showPart" class="k part">Part {{ ep.p }}</span>
        <span v-if="years" class="k">{{ years }}</span>
        <span v-if="showSub" class="k">{{ ep.sub }}</span>
        <span v-if="ep.isNew" class="tag tag-new">New</span>
      </div>
      <div v-if="showTitle" class="ep-title">{{ ep.joke }}</div>
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
        ><PlatformIcon :name="pl.key" />{{ pl.label }} <span class="ext" aria-hidden="true">↗</span></a>
      </div>
    </div>
  </li>
</template>
