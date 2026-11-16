/**
 * src/services/api.js
 *
 * Envoltorio único sobre `fetch` para hablar con el backend REST de SIGPA
 * (Express, desplegado en Vercel / corriendo en localhost:4000 según
 * VITE_API_URL). Todos los demás servicios (practicas.js, bitacoras.js,
 * etc.) llaman a `apiFetch` en vez de usar `fetch` directamente, así:
 *   - la URL base y el header Content-Type quedan en un solo lugar.
 *   - los códigos 4xx no lanzan excepción (el login usa 202/404 como
 *     respuestas normales, no como errores de red).
 */

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Hace una petición HTTP contra el backend y devuelve siempre
 * { status, data }, nunca lanza por un 4xx/5xx (solo por error de red).
 * @param {string} ruta - ruta relativa, ej. "/api/practicas/plazas"
 * @param {RequestInit} [opciones] - mismas opciones de fetch (method, body...)
 */
export async function apiFetch(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  const data = await respuesta.json().catch(() => null);
  return { status: respuesta.status, data };
}

/** Atajo para GET: devuelve directamente los datos (lanza si status >= 400). */
export async function apiGet(ruta) {
  const { status, data } = await apiFetch(ruta);
  if (status >= 400) throw new Error(data?.error || `Error ${status} al consultar ${ruta}`);
  return data;
}

/** Atajo para POST/PUT/DELETE con body JSON: devuelve los datos o lanza. */
export async function apiEnviar(ruta, metodo, cuerpo) {
  const { status, data } = await apiFetch(ruta, {
    method: metodo,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  if (status >= 400) throw new Error(data?.error || `Error ${status} al enviar a ${ruta}`);
  return data;
}
