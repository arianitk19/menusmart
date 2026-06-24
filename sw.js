/* boneMENU — Service Worker: precache shell, runtime cache, offline, auto-update */
const VERSION = "bonemenu-v5.0.0";
const CORE = VERSION + "-core", RT = VERSION + "-rt";
const SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "assets/css/tokens.css", "assets/css/base.css", "assets/css/components.css", "assets/css/menu.css",
  "assets/js/store.js", "assets/js/icons.js", "assets/js/ui.js", "assets/js/app.js",
  "assets/js/views/home.js", "assets/js/views/builder.js", "assets/js/views/qr.js", "assets/js/views/menu.js",
  "assets/icons/icon.svg"
];
const EXTRA = ["https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CORE);
    await c.addAll(SHELL).catch(() => {});
    await Promise.all(EXTRA.map(u => c.add(new Request(u, { mode: "no-cors" })).catch(() => {})));
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const isHTML = req => req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  if (isHTML(req)) { // network-first, fallback to cached shell
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(RT).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))); return;
  }
  // stale-while-revalidate for everything else (css/js/fonts/cdn)
  e.respondWith(caches.match(req).then(cached => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) { const cp = r.clone(); caches.open(RT).then(c => c.put(req, cp)); } return r; }).catch(() => cached);
    return cached || net;
  }));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
