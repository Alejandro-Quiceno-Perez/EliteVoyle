
/*
 * Nombre y versión de la caché.
 * Cambiar la versión permite distinguir los recursos de una
 * actualización de los que pertenecían a una versión anterior.
 */
const CACHE_NAME = "alcazares-volley-v1";

/*
 * Lista de archivos esenciales de la aplicación.
 * El Service Worker intentará guardarlos para utilizarlos
 * posteriormente sin conexión.
 */
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/alerts.js",
  "./js/storage.js",
  "./js/dashboard.js",
  "./js/players.js",
  "./js/match.js",
  "./js/actions.js",
  "./js/report.js"
];

/*
 * EVENTO INSTALL
 *
 * Se ejecuta cuando el navegador instala el Service Worker.
 * Abre la caché y trata de guardar cada archivo de la lista.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {

      // Procesa los archivos uno por uno.
      for (const file of APP_FILES) {
        try {
          // Descarga el archivo y guarda su respuesta en caché.
          await cache.add(file);
        } catch (error) {
          // Informa si un archivo no pudo guardarse.
          // El resto de los archivos todavía puede procesarse.
          console.warn("No se pudo guardar en caché:", file);
        }
      }

      // Permite que esta versión pase a la siguiente etapa
      // sin esperar a que desaparezcan otros clientes.
      await self.skipWaiting();
    })
  );
});

/*
 * EVENTO ACTIVATE
 *
 * Se ejecuta cuando el Service Worker se activa.
 * Elimina las cachés de versiones anteriores y permite que
 * esta versión controle las páginas abiertas.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {

      // Elimina las cachés cuyo nombre no corresponde
      // a la versión actual de la aplicación.
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );

      // Hace que el Service Worker controle los clientes
      // de su ámbito sin esperar a una nueva navegación.
      await self.clients.claim();
    })
  );
});

/*
 * EVENTO FETCH
 *
 * Intercepta las solicitudes GET realizadas dentro del
 * mismo origen de la aplicación.
 */
self.addEventListener("fetch", (event) => {

  // No intercepta solicitudes que modifican datos
  // o utilizan otros métodos HTTP.
  if (event.request.method !== "GET") return;

  // Obtiene la dirección del recurso solicitado.
  const url = new URL(event.request.url);

  // Las solicitudes a otros dominios, como los CDN,
  // no se gestionan con esta estrategia.
  if (url.origin !== self.location.origin) return;

  // Busca primero una respuesta guardada en caché.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      // Si existe una respuesta guardada, la devuelve.
      if (cachedResponse) return cachedResponse;

      // Si no existe, intenta obtener el recurso de internet.
      return fetch(event.request);
    })
  );
});
