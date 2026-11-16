/**
 * src/services/practicas.js
 *
 * Llamadas al dominio de negocio en PostgreSQL/Neon (base ms_practicas):
 * convenios, instituciones, plazas, grupos, asignaciones y calificaciones.
 * Usado por el panel de Estudiante (consultar su plaza y sus notas) y,
 * más adelante, por Docente/Director/Admin.
 */
import { apiGet, apiEnviar } from "./api";

const BASE = "/api/practicas";

/**
 * Vista agregada de la práctica asignada a un estudiante: plaza,
 * institución, tipo y nivel, docente asesor y director del programa, en
 * un solo llamado (endpoint agregado añadido en el backend para este
 * caso de uso). Devuelve `null` si el estudiante aún no tiene plaza.
 */
export const obtenerMiPractica = (idEstudiante) =>
  apiGet(`${BASE}/mi-practica/${idEstudiante}`);

/** Notas (nota + observaciones) de las bitácoras de una asignación, con el
 *  nombre del docente evaluador ya incluido. */
export const obtenerCalificacionesPorAsignacion = (idAsignacion) =>
  apiGet(`${BASE}/calificacion-bitacora/asignacion/${idAsignacion}`);

/** Tipos y niveles de práctica (para los modales "ver requisitos"). */
export const obtenerTiposPractica = () => apiGet(`${BASE}/tipos`);
export const obtenerNivelesPractica = () => apiGet(`${BASE}/niveles`);

/** Institución receptora por id, para el modal "ver más detalles". */
export const obtenerInstituciones = () => apiGet(`${BASE}/instituciones`);

/**
 * Vista agregada para el panel del Docente (CU "Consultar estudiantes
 * asignados y avances de horas"): un registro por cada estudiante a
 * cargo del docente, con su plaza/institución más reciente ya resueltas.
 */
export const obtenerEstudiantesDocente = (idDocente) =>
  apiGet(`${BASE}/estudiantes-docente/${idDocente}`);

// --- Las siguientes se usarán desde los paneles de Docente/Director/Admin ---
export const obtenerConvenios = () => apiGet(`${BASE}/convenios`);
export const obtenerGrupos = () => apiGet(`${BASE}/grupos`);
export const obtenerPlazas = () => apiGet(`${BASE}/plazas`);
export const obtenerAsignacionesDocente = () => apiGet(`${BASE}/asignacion-docente`);
export const obtenerAsignacionesPlaza = () => apiGet(`${BASE}/asignacion-plaza`);
export const actualizarAsignacionPlaza = (id, datos) =>
  apiEnviar(`${BASE}/asignacion-plaza/${id}`, "PUT", datos);

/** Crea la nota de una bitácora (solo la primera vez: la tabla tiene una
 *  nota única por bitácora). Para modificarla ya existente, usar
 *  `actualizarCalificacionBitacora`. */
export const crearCalificacionBitacora = (datos) =>
  apiEnviar(`${BASE}/calificacion-bitacora`, "POST", datos);

/** Modifica la nota/observaciones de una calificación ya registrada. */
export const actualizarCalificacionBitacora = (id, datos) =>
  apiEnviar(`${BASE}/calificacion-bitacora/${id}`, "PUT", datos);