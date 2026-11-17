/**
 * src/services/bitacoras.js
 * Llamadas a la colección "bitacora" de MongoDB (base ms_seguimiento), a
 * través del router /api/bitacoras del backend.
 */
import { apiGet, apiEnviar } from "./api";

const BASE = "/api/bitacoras";

/** Historial de bitácoras de un estudiante, más recientes primero. */
export const obtenerBitacorasEstudiante = (idEstudiante) =>
  apiGet(`${BASE}/estudiante/${idEstudiante}`);

/** Registra una nueva bitácora contra una actividad (asignación tipo
 *  Classroom) ya publicada por el docente para el grupo del estudiante. */
export const registrarBitacora = (datos) => apiEnviar(BASE, "POST", datos);

/** Edita y reenvía a revisión una bitácora que está en "requiere_correccion". */
export const corregirBitacora = (id, datos) => apiEnviar(`${BASE}/${id}`, "PUT", datos);

export const aprobarBitacora = (id) => apiEnviar(`${BASE}/${id}/aprobar`, "PUT");
export const solicitarCorreccion = (id, motivo) =>
  apiEnviar(`${BASE}/${id}/correccion`, "PUT", { motivo });

/** Todas las bitácoras reales de los estudiantes a cargo de un docente. */
export const obtenerBitacorasDocente = (idDocente) =>
  apiGet(`${BASE}/docente-real/${idDocente}`);

/** Todas las bitácoras de una asignación de plaza puntual (usado por el
 *  panel del Director en "Horas del estudiante", CU 6). */
export const obtenerBitacorasPorAsignacion = (idAsignacion) =>
  apiGet(`${BASE}/docente/${idAsignacion}`);