/* Service worker de la app “Profe Luján”.
   - Guarda en el celular la cáscara de la app (pantalla, código e imágenes) para que abra al instante y con aspecto de app.
   - Las librerías externas (fórmulas, Firebase, tipografías) se guardan la primera vez que se usan.
   - Las consultas a la IA y a la base de datos NUNCA se guardan: siempre van a internet.
   - Solo controla la página profe.html (así se registra desde profe-app.js): el portal (index.html) no pasa nunca por acá.
   - Para publicar una versión nueva de la app, cambiá el número de VERSION. */
const VERSION = 'profe-v1';
const SHELL = ['profe.html', 'profe-app.js', 'tutor.js', 'profe.js', 'config.js', 'manifest.webmanifest',
  'img/profe-normal.webp', 'img/profe-festejo.webp', 'img/profe-error.webp', 'img/profe-sorpresa.webp', 'img/profe-pensando.webp',
  'img/profe-risa.webp', 'img/profe-bien.webp', 'img/profe-ok.webp', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png'];
const BASE = new URL('./', self.location.href).href;          // carpeta donde está sw.js
const LIBS = ['cdn.jsdelivr.net', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const rel = url.href.startsWith(BASE) ? url.href.slice(BASE.length).split('?')[0].split('#')[0] : null;
  if(rel !== null && SHELL.includes(rel)){                     // pantalla y código: se muestra lo guardado y se actualiza por detrás
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req, {ignoreSearch: true});
      const red = fetch(req).then(r => { if(r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      return hit || (await red) || Response.error();
    }));
  } else if(LIBS.includes(url.hostname)){                      // librerías y tipografías: guardadas la primera vez
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req); if(hit) return hit;
      try { const r = await fetch(req); if(r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }
      catch(err){ return Response.error(); }
    }));
  }
});
