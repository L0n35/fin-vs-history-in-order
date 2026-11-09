import episodes from '~~/data/episodes.json'
import bonus from '~~/data/bonus.json'
import links from '~~/data/links.json'
import { BONUS_SERIES, SERIES } from '~~/lib/series.mjs'
import { buildCatalogue } from '~~/lib/catalogue.mjs'

let cached: ReturnType<typeof buildCatalogue> | null = null

/**
 * Feed episodes plus Patreon bonus episodes, joined with the series dates in lib/series.mjs
 * and the YouTube/Spotify links. Built once per build.
 */
export function useCatalogue() {
  if (!cached) {
    const { buildTime } = useRuntimeConfig().public
    cached = buildCatalogue([...(episodes as never[]), ...(bonus as never[])], SERIES, String(buildTime), links as never, BONUS_SERIES)
  }
  return cached
}
