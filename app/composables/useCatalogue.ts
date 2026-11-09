import episodes from '~~/data/episodes.json'
import { SERIES } from '~~/lib/series.mjs'
import { buildCatalogue } from '~~/lib/catalogue.mjs'

let cached: ReturnType<typeof buildCatalogue> | null = null

/** Episodes from the feed joined with the series dates in lib/series.mjs. Built once per build. */
export function useCatalogue() {
  if (!cached) {
    const { buildTime } = useRuntimeConfig().public
    cached = buildCatalogue(episodes as never, SERIES, String(buildTime))
  }
  return cached
}
