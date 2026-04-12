/**
 * Utilidad global para el caché de Promesas (Peticiones HTTP)
 * Permite evitar llamadas repetidas al servidor almacenando
 * la promesa de la petición temporalmente en memoria.
 */

const cache = new Map();
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutos por defecto (en milisegundos)

/**
 * Ejecuta una función que retorna una promesa y la cachea bajo una llave con límite de tiempo.
 * Si la promesa falla, se elimina del caché para permitir reintentos.
 *
 * @param {string} key - Identificador único para el caché (ej: 'departamentos')
 * @param {Function} requestFn - Función que retorna la promesa de Axios
 * @param {number} [ttl] - Tiempo de vida del caché en ms (Default: 15 mins)
 * @returns {Promise} - La promesa cacheada
 */
export const withCache = (key, requestFn, ttl = DEFAULT_TTL) => {
  const now = Date.now();
  const cachedItem = cache.get(key);

  if (cachedItem && cachedItem.expiry > now) {
    return cachedItem.promise;
  }

  const promise = requestFn()
    .then((response) => {
      // Actualizamos el expiry con la hora real de resolución
      const entry = cache.get(key);
      if (entry) {
        entry.expiry = Date.now() + ttl;
      }
      return response;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });

  // Guardamos con expiry temporal para bloquear peticiones duplicadas en vuelo
  cache.set(key, { promise, expiry: now + ttl });
  return promise;
};

/**
 * Limpia el caché. Si recibe una llave, limpia solo esa llave.
 * Si no recibe nada, limpia todo el caché.
 *
 * @param {string} [key] - (Opcional) Llave a limpiar.
 */
export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};
