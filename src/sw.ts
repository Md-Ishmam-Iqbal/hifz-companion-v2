/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string }>
}

clientsClaim()
self.skipWaiting()

precacheAndRoute(self.__WB_MANIFEST)

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>You're offline</title>
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
      .wrap { min-height: 100vh; display: grid; place-items: center; padding: 28px; }
      .card { width: min(520px, 100%); border: 1px solid rgba(148,163,184,.35); border-radius: 16px; padding: 18px 18px 16px; background: rgba(255,255,255,.65); backdrop-filter: blur(10px); }
      @media (prefers-color-scheme: dark) { .card { background: rgba(0,0,0,.35); border-color: rgba(148,163,184,.18); } }
      h1 { margin: 0 0 8px; font-size: 18px; letter-spacing: -0.01em; }
      p { margin: 0 0 14px; font-size: 13px; line-height: 1.45; color: rgba(100,116,139,1); }
      @media (prefers-color-scheme: dark) { p { color: rgba(148,163,184,1); } }
      .row { display: flex; gap: 10px; align-items: center; justify-content: space-between; }
      button { appearance: none; border: 1px solid rgba(148,163,184,.35); background: rgba(15,23,42,.06); padding: 10px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer; }
      @media (prefers-color-scheme: dark) { button { background: rgba(148,163,184,.10); border-color: rgba(148,163,184,.18); } }
      button:active { transform: translateY(1px); }
      .hint { font-size: 12px; color: rgba(100,116,139,1); }
      @media (prefers-color-scheme: dark) { .hint { color: rgba(148,163,184,1); } }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>Internet required</h1>
        <p>Hifz Companion needs a connection to load Quran data. Reconnect, then reload.</p>
        <div class="row">
          <button onclick="location.reload()">Reload</button>
          <div class="hint">If you cleared site data, the app will re-download.</div>
        </div>
      </div>
    </div>
  </body>
</html>`

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

const indexHandler = createHandlerBoundToURL('index.html')

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async (options) => {
    const event = options.event as FetchEvent

    // If caches were cleared, serving precache-only index.html would fail even online.
    // Prefer the network when possible, then fall back to the app shell, then to offline HTML.
    try {
      const res = await fetch(event.request)
      if (res && res.ok) return res
    } catch {
      // ignore
    }

    try {
      return await indexHandler(options)
    } catch {
      return offlineResponse()
    }
  },
)

registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/gh/fawazahmed0/quran-api@1/'),
  new StaleWhileRevalidate({
    cacheName: 'quran-api',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
)

setCatchHandler(async (options) => {
  const event = options.event as FetchEvent
  if (event?.request?.destination === 'document') return offlineResponse()
  return Response.error()
})
