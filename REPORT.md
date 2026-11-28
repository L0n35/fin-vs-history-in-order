# Latest build

- Result: **success**
- Run: https://github.com/L0n35/fin-vs-history-in-order/actions/runs/46159986596 (schedule)
- Commit: 1acd074
- Finished: 2026-11-28 15:28 UTC

## Fin vs History, in order

**206** episodes in the feed · **201** dated across **73** series · **5** not dated yet

**100** bonus episodes from Spotify · **60** filed with their main series · the rest in **31** bonus series · **3** not dated yet

Links: **206** on YouTube · **206** on Spotify · **0** with neither

### Not dated yet

Add a series for each of these to `lib/series.mjs` (bonus ones to `BONUS_SERIES`):

| Series in title | Bonus? | Episodes | Example title |
| --- | --- | --- | --- |
| Jehovah's Witnesses | Bonus | 1 | Jehovah's Witnesses |
| The Old Testament |  | 3 | Post-Nut Clarity Separates Man From Beast \| The Old Testament (Part 1/3) |
| The Family of Franz Ferdinand | Bonus | 1 | The Family of Franz Ferdinand |
| The Assassination of Franz Ferdinand |  | 2 | Serbs Don’t Control The Weather \| The Assassination of Franz Ferdinand (Part 1) |
| Ned Kelly | Bonus | 1 | Ned Kelly (with Damien Power) |

Template:

```js
{
  id: 'new-series', name: 'Jehovah\'s Witnesses', short: 'Short',
  title: /Jehovah's Witnesses/i, range: [1900, 1950],
  parts: { 1: [1900, 1925], 2: [1925, 1950] },
},
```

## Feed and link log

```
Saved 206 episodes to data/episodes.json
YouTube: also read 1006 uploads from FinTaylor (UCcQdXzWsosXv_e_wpfZHZlw)
YouTube: Fin vs History has 31 playlists; 1110 videos checked, 214 full-length episodes
YouTube: found 214 episodes, matched 206 of 206.
Spotify: found 309 episodes, matched 206 of 206.
Spotify: 100 bonus (Patreon) episodes.
```

## Install and tests (last 40 lines each)

```

> postinstall
> nuxt prepare

◆ Types generated in .nuxt.

added 522 packages, and audited 524 packages in 7s

128 packages are looking for funding
  run `npm fund` for details

10 moderate severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
---
# pass 38
# fail 0
```

## End of the build log

```
Building Nuxt for production...
● Loading Nuxt config
● Nuxt 4.6.4 (with Nitro 2.13.6, Vite 8.3.7 and Vue 3.5.45)
● Setting up modules
● Preparing app
● Nitro preset: static
● Generating types
● Bundling client
[info] Building client...
[info] [36mvite v8.3.7 [32mbuilding client environment for production...[36m[39m
transforming...
✓ 159 modules transformed.
rendering chunks...
computing gzip size...
[info] node_modules/.cache/nuxt/.nuxt/dist/client/manifest.json                   1.23 kB │ gzip:   0.34 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/error-500.CmR4p1fc.css    1.95 kB │ gzip:   0.72 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/error-404.DpKY_dMl.css    2.70 kB │ gzip:   0.92 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/entry.DwYtPXjH.css       10.64 kB │ gzip:   3.27 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/BDNMzG2s.js               0.08 kB │ gzip:   0.09 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/B-YzU-5o.js               2.68 kB │ gzip:   1.18 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/CIq9SQL8.js               9.98 kB │ gzip:   4.02 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/DSANpB3A.js             402.97 kB │ gzip: 118.29 kB

[info] [32m✓ built in 704ms[39m
[success] Client built in 722ms
● Bundling server
[info] Building server...
[info] [36mvite v8.3.7 [32mbuilding ssr environment for production...[36m[39m
transforming...
✓ 88 modules transformed.
rendering chunks...
[info] node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-404-styles.BF-pIkoo.mjs            0.08 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-500-styles.BipnMLxW.mjs            0.08 kB
node_modules/.cache/nuxt/.nuxt/dist/server/styles.mjs                                     0.33 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/_plugin-vue_export-helper-DjkACiAr.js    0.24 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-500-styles-1.mjs-CdLClIq9.js       2.32 kB │ map:   0.09 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-404-styles-1.mjs-rcIgKBzA.js       3.07 kB │ map:   0.09 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-500-Byddyd6y.js                    3.66 kB │ map:   4.73 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-404-B0CHB6xE.js                   18.70 kB │ map:  36.53 kB
node_modules/.cache/nuxt/.nuxt/dist/server/server.mjs                                   328.70 kB │ map: 233.67 kB

[info] [32m✓ built in 374ms[39m
[success] Server built in 388ms
● Building Nitro server
[info] [nitro] Initializing prerenderer
[info] [nitro] Prerendering 3 initial routes with crawler
[log] [nitro] [90m  ├─ /200.html (100ms)[39m
[log] [nitro] [90m  ├─ /404.html (100ms)[39m
[log] [nitro] [90m  ├─ / (108ms)[39m
[log] [nitro] [90m  ├─ /fin-vs-history-in-order/_payload.json?_b=20e2db02-4c1c-4758-9205-910c48675d80 (4ms)[90m (skipped)[90m[39m
[log] [nitro] [90m  ├─ /_payload.json (3ms)[39m
[info] [nitro] Prerendered 4 routes in 1.365 seconds
[success] [nitro] Generated public [36m.output/public[39m
[success] [nitro] You can preview this build using `npx serve .output/public`
config 228ms · modules 45ms · app 368ms · types 375ms · client 1.03s · server 389ms · nitro 1.43s
◆ ✨ You can now deploy .output/public to any static hosting! (3.88s)
```
