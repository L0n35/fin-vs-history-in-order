// On GitHub Pages the site lives under /<repo-name>/; the workflow sets NUXT_APP_BASE_URL for that.
const baseURL = process.env.NUXT_APP_BASE_URL || '/'
// The commit this build came from, so the workflow can confirm the live site has updated.
const build = (process.env.GITHUB_SHA || 'local').slice(0, 7)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Frozen at build time so the "New" badges match between the server render and the browser.
      buildTime: new Date().toISOString(),
    },
  },

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'en-GB' },
      title: 'Fin vs History, in order',
      meta: [
        { name: 'description', content: 'An unofficial fan guide that sorts every Fin vs History episode by when the history happened, not when it came out.' },
        { name: 'theme-color', content: '#E2A52A' },
        { name: 'build', content: build },
        { property: 'og:title', content: 'Fin vs History, in order' },
        { property: 'og:description', content: 'Every series sorted by when it happened, instead of when it came out.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,600..900,0..100&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  nitro: {
    prerender: { routes: ['/'] },
  },
})
