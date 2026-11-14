const API_URL = import.meta.env.VITE_API_URL;

// Devuelve { status, data } sin lanzar error en 4xx,
// porque el login usa 202/404 como respuestas normales.
export async function apiFetch(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  const data = await respuesta.json().catch(() => null);
  return { status: respuesta.status, data };
}