# Fin vs History, in order

An unofficial fan site that lists every [Fin vs History](https://www.youtube.com/@FinvsHistory) episode in the order the history happened, instead of the order it came out.

Live at **https://l0n35.github.io/fin-vs-history-in-order/** once GitHub Pages is switched on (see [Setup](#setup)).

- **List** view grouped into eras, with a toggle between keeping each series together and sorting every episode strictly by its own dates.
- **Timeline** view where overlapping series stack into rows, on an axis that gives recent centuries more room than prehistory.
- **Across the ages** section for series like The History of Medicine that sweep through thousands of years.
- **Not dated yet** section for new series that haven't been given dates.
- **YouTube and Spotify links** straight to each episode, wherever it's been found.

Not affiliated with Fin Taylor, Horatio Gould or Podmasters.

## How it works

```
RSS feed ──► scripts/fetch-feed.mjs ──► data/episodes.json ─┐
                                                            ├─► lib/catalogue.mjs ──► Nuxt site
                       lib/series.mjs (hand-maintained) ────┘
```

1. A GitHub Action runs every day (and on every push to `main`).
2. It downloads the podcast's RSS feed into `data/episodes.json`.
3. Each episode is matched to a series in `lib/series.mjs` by its title, e.g. `… | Stalin: Barbarossa (Part 4)`. The part number comes from the title, or from the description when the title doesn't have one.
4. The series (or the specific part) supplies the historical date range. Anything that doesn't match goes in **Not dated yet**.
5. `scripts/fetch-links.mjs` lists the channel's YouTube uploads and the show's Spotify episodes, and matches them to the feed by title, then by series and part, then by description, and finally by release date when only one candidate is within a day. Results go to `data/links.json`.
6. Nuxt generates a static site and the Action deploys it to GitHub Pages.

New parts of a series you've already dated slot in by themselves. A brand new series is the only thing that needs you.

## Dating a new series

Each run's summary page (Actions → latest run) lists the series that aren't dated yet, with a template to copy. Add an entry to `lib/series.mjs`:

```js
{
  id: 'spanish-armada', name: 'The Spanish Armada', short: 'Armada',
  title: /Spanish Armada/i,          // tested against the series half of the title, after the "|"
  range: [1585, 1604],               // negative years are BC; PRESENT means still going
  parts: { 1: [1585, 1588], 2: [1588, 1604] },   // optional, per part
},
```

- `title` only looks at the part after the `|`, so jokes in the episode title can't cause false matches.
- `text` (optional) is tested against the description, for episodes whose title doesn't name the series. Example: `/Napoleonic Wars \(Part/i` catches "The Battle of Trafalgar".
- `theme: true` puts a series in **Across the ages** instead of pinning it to a start date.
- The first matching series wins, so put more specific rules first.

Push to `main` and the site rebuilds.

## Setup

1. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Go to **Actions → Build and deploy → Run workflow** (or push any change).

The first run deploys to `https://<user>.github.io/<repo>/`. GitHub pauses scheduled workflows after 60 days without any commits, so push something occasionally or re-enable it from the Actions tab.

### YouTube and Spotify links

Episode links need API credentials, saved as repository secrets under **Settings → Secrets and variables → Actions**. Without them the site still builds, just without those links.

| Secret | Where to get it |
| --- | --- |
| `YOUTUBE_API_KEY` | [Google Cloud console](https://console.cloud.google.com/apis/library/youtube.googleapis.com): create a project, enable **YouTube Data API v3**, then **Credentials → Create credentials → API key**. Restrict it to the YouTube Data API. A daily run uses well under 100 of the 10,000 free quota units. |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | [Spotify developer dashboard](https://developer.spotify.com/dashboard): create an app with the **Web API** ticked. It asks for a redirect URI; `http://127.0.0.1:3000/callback` is fine since it's never used. Spotify requires the app owner to have Premium for development-mode apps. |

The first Spotify run logs the show's ID. Saving it as a repository **variable** called `SPOTIFY_SHOW_ID` skips the search on later runs.

Each run's summary shows how many episodes got each link and lists the ones that got neither.

### Build reports

Every run also writes its report, the link-matching log and the end of the build log to `REPORT.md` on the `status` branch. It's overwritten each run and contains no secrets, so you can check the latest build with `git fetch origin status && git show origin/status:REPORT.md`.

## Local development

Needs Node 20.19 or newer.

```sh
npm install
cp .env.example .env   # optional: add API keys for YouTube/Spotify links
npm run dev        # downloads the feed and links, then starts Nuxt at http://localhost:3000
npm test           # tests for the feed parser and series matching
npm run report     # what's dated and what isn't
npm run build      # fetch + static build into .output/public
```

After your first `npm install`, commit the generated `package-lock.json` so CI installs the same versions every time.

## Project layout

| Path | What it is |
| --- | --- |
| `lib/series.mjs` | The series-to-dates mapping. The only file you edit routinely. |
| `lib/catalogue.mjs` | Matches episodes to series, parses part numbers, groups undated episodes. |
| `lib/feed.mjs` | Dependency-free RSS parser. |
| `lib/links.mjs` | Matches feed episodes to YouTube videos and Spotify episodes. |
| `lib/format.mjs` | Eras, BC/AD year formatting, sorting helpers. |
| `scripts/` | Feed download, link matching and the run report used by CI. |
| `app/` | The Nuxt app: `ListView`, `TimelineView`, `SeriesCard`, `EpisodeItem`. |
| `test/` | `node --test` suite with real feed items as fixtures. |
