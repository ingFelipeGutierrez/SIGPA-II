/**
 * src/services/retroalimentacion.js
 * Llamadas a la colección "retroalimentacion" de MongoDB, a través de
 * /api/retroalimentacion.
 */
import { apiGet, apiEnviar } from "./api";

const BASE = "/api/retroalimentacion";

/** Retroalimentaciones escritas por el docente asesor para un estudiante. */
export const obtenerRetroalimentacionEstudiante = (idEstudiante) =>
  apiGet(`${BASE}/estudiante/${idEstudiante}`);

export const obtenerRetroalimentacionDeBitacora = (idBitacora) =>
  apiGet(`${BASE}/bitacora/${idBitacora}`);

export const registrarRetroalimentacion = (datos) => apiEnviar(BASE, "POST", datos);
export const editarRetroalimentacion = (id, texto) =>
  apiEnviar(`${BASE}/${id}`, "PUT", { texto });
