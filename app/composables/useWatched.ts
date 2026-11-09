// Which episodes the viewer has ticked off. Saved in this browser only (localStorage), no sign-in.

const KEY = 'fvh-watched-v1'

export function useWatched() {
  const list = useState<string[]>('watched', () => [])
  const loaded = useState('watched-loaded', () => false)
  const set = computed(() => new Set(list.value))

  /** Read saved progress. Call once on the client, after the page has hydrated. */
  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
      if (Array.isArray(saved)) list.value = saved.filter((g) => typeof g === 'string')
    } catch {
      // Storage blocked (private browsing, embedded view): ticks still work for this visit.
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.value))
    } catch {
      // See load().
    }
  }

  const isWatched = (guid: string) => set.value.has(guid)
  const countWatched = (guids: string[]) => guids.reduce((n, g) => n + (set.value.has(g) ? 1 : 0), 0)

  function setWatched(guids: string[], watched: boolean) {
    const next = new Set(list.value)
    for (const g of guids) {
      if (watched) next.add(g)
      else next.delete(g)
    }
    list.value = [...next]
    save()
  }

  return { load, isWatched, countWatched, setWatched }
}
