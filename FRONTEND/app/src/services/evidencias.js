/**
 * src/services/evidencias.js
 * Llamadas a la colección "evidencia" de MongoDB, a través de
 * /api/evidencias. Nota importante: el backend (v1) solo guarda
 * evidencias como ENLACE (tipo "link_drive"), no archivos binarios
 * subidos directamente. Por eso en el formulario de nueva bitácora el
 * estudiante pega un enlace (ej. de Google Drive) en vez de adjuntar el
 * archivo desde su equipo.
 */
import { apiGet, apiEnviar } from "./api";

const BASE = "/api/evidencias";

/** Evidencias (enlaces) asociadas a una bitácora. */
export const obtenerEvidenciasDeBitacora = (idBitacora) =>
  apiGet(`${BASE}/bitacora/${idBitacora}`);

/** Registra una evidencia como enlace para una bitácora ya creada. */
export const registrarEvidencia = (datos) => apiEnviar(BASE, "POST", datos);

export const eliminarEvidencia = (id) => apiEnviar(`${BASE}/${id}`, "DELETE");
