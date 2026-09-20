// Service worker de "Mi Control Financiero".
// Objetivo único: permitir abrir la interfaz sin conexión (app shell) y usar localStorage normalmente.
// NUNCA cachea nada de Supabase (autenticación ni datos financieros), ni peticiones que no sean GET.

const CACHE_NAME = "mcf-shell-v2";

// Recursos propios de la app (deben existir en el mismo directorio que este archivo).
// Librería pública de Supabase (código abierto, sin datos privados): se precachea igual que el
// resto del app shell para que la interfaz cargue completa sin conexión desde la primera instalación.
// Esta es la URL EXACTA que usa index.html — si cambias la versión en index.html, actualízala aquí también.
const SUPABASE_SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  SUPABASE_SDK_URL
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        // Se cachea cada recurso por separado (no con addAll) para que, si uno solo falla
        // (por ejemplo el SDK, si no hay red en ese instante), el resto del app shell sí quede
        // instalado y la app pueda abrir sin conexión igualmente.
        Promise.all(APP_SHELL.map((url) => cache.add(url).catch((err) => console.warn("No se pudo precachear:", url, err))))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Lista blanca explícita de recursos del propio origen que pueden cachearse.
// Cualquier otra petición al mismo origen (incluida cualquier llamada futura a una API propia)
// pasa siempre directo a la red, sin pasar por la caché.
const OWN_ORIGIN_ALLOWLIST = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
].map((p) => new URL(p, self.location).href);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo se manejan peticiones GET. Nunca se intercepta ni cachea POST/PATCH/DELETE
  // (así viajan siempre directo a la red las operaciones de login, inserciones, updates, etc.)
  if (req.method !== "GET") return;

  // Cualquier dominio de Supabase (auth y datos) se deja pasar directo a la red,
  // sin pasar por este service worker: nunca se guarda una respuesta suya en caché.
  if (url.hostname.endsWith("supabase.co")) return;

  // Del propio origen, solo se permite cachear los recursos exactos del app shell (lista blanca).
  // Del CDN jsDelivr solo se permite cachear la URL EXACTA del SDK de Supabase que usa index.html.
  // Todo lo demás (cualquier otro recurso propio, cualquier otro origen externo) pasa sin cachear.
  const isAllowedOwnOrigin = url.origin === self.location.origin && OWN_ORIGIN_ALLOWLIST.includes(req.url);
  const isSupabaseSdk = req.url === SUPABASE_SDK_URL;
  if (!isAllowedOwnOrigin && !isSupabaseSdk) return;

  // App shell propio (y el SDK público): network-first, con la copia en caché como respaldo sin conexión.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || (isAllowedOwnOrigin ? caches.match("./index.html") : undefined))
      )
  );
});
