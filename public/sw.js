/*
 * Service worker mínimo: lo exigen algunas versiones de Chrome y Edge para
 * ofrecer "Instalar". No guarda nada en caché: siempre usa la red, así cada
 * despliegue en Netlify se ve de inmediato.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") e.respondWith(fetch(e.request));
});
