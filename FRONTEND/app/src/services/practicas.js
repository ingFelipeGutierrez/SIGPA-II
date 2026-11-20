/**
 * src/services/practicas.js
 *
 * Llamadas al dominio de negocio en PostgreSQL/Neon (base ms_practicas):
 * convenios, instituciones, plazas, grupos, asignaciones y calificaciones.
 * Usado por el panel de Estudiante (consultar su plaza y sus notas) y,
 * más adelante, por Docente/Director/Admin.
 */
import { conEstadoPractica } from "../utils/formato";
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

/** Filas de la tabla grupo_estudiante (qué estudiante está en qué grupo).
 *  Usado para saber qué estudiantes ya tienen grupo y para resolver el
 *  "resumen" de un grupo existente junto con asignacion_plaza. */
export const obtenerGrupoEstudiante = () => apiGet(`${BASE}/grupo-estudiante`);
export const actualizarAsignacionPlaza = (id, datos) =>
  apiEnviar(`${BASE}/asignacion-plaza/${id}`, "PUT", datos);

/** TODAS las calificaciones de bitácora de TODAS las asignaciones, para
 *  calcular en el cliente la nota promedio de cada práctica en la
 *  página "Decidir resultado de la práctica" (CU 1). Para una sola
 *  asignación, usar `obtenerCalificacionesPorAsignacion`. */
export const obtenerCalificacionesBitacora = () => apiGet(`${BASE}/calificacion-bitacora`);

/** Crea la nota de una bitácora (solo la primera vez: la tabla tiene una
 *  nota única por bitácora). Para modificarla ya existente, usar
 *  `actualizarCalificacionBitacora`. */
export const crearCalificacionBitacora = (datos) =>
  apiEnviar(`${BASE}/calificacion-bitacora`, "POST", datos);

/** Modifica la nota/observaciones de una calificación ya registrada. */
export const actualizarCalificacionBitacora = (id, datos) =>
  apiEnviar(`${BASE}/calificacion-bitacora/${id}`, "PUT", datos);

// --- Panel del Director: Gestionar convenios institucionales (CU 3) ---

/** Instituciones receptoras con su convenio más reciente ya resuelto en
 *  el backend (LEFT JOIN LATERAL por institución). `fecha_fin` viene
 *  `null` si la institución todavía no tiene convenio registrado. */
export const obtenerInstitucionesCompletas = () => apiGet(`${BASE}/instituciones-completas`);

/** Crea una institución receptora junto con su convenio inicial, en un
 *  solo paso (transacción en el backend). */
export const registrarInstitucion = (datos) =>
  apiEnviar(`${BASE}/instituciones-completas`, "POST", datos);

/** Renueva el convenio más reciente de una institución, cambiando su
 *  fecha de finalización. */
export const renovarConvenio = (idInstitucion, nuevaFin) =>
  apiEnviar(`${BASE}/instituciones-completas/${idInstitucion}/convenio`, "PUT", { nuevaFin });

// --- Panel del Director: Estado general y supervisión (CU 6 y CU 7) ---

/** TODAS las prácticas (asignacion_plaza) con institución, grupo, tipo,
 *  nivel, estudiante, docente asesor y horas cumplidas ya resueltos en
 *  el backend, para la página "Estado de las prácticas".
 *  El estado ya viene recalculado con la regla del maestro (estadoPractica). */
export const obtenerPracticasCompletas = async () => (await apiGet(`${BASE}/practicas-completas`)).map(conEstadoPractica);

// --- Panel del Director: Gestionar prácticas (CU 1 y CU 2) ---

/** Cupo máximo de estudiantes de cada docente asesor (tabla docente_cupo). */
export const obtenerDocenteCupo = () => apiGet(`${BASE}/docente-cupo`);

/** Registra una asignación docente-estudiante (una llamada por estudiante
 *  marcado: el backend crea una fila por estudiante). */
export const asignarDocente = (idEstudiante, idDocente) =>
  apiEnviar(`${BASE}/asignacion-docente`, "POST", { id_estudiante: idEstudiante, id_docente: idDocente });

/** Crea un grupo de práctica nuevo. */
export const crearGrupo = (datos) => apiEnviar(`${BASE}/grupos`, "POST", datos);

/** Agrega un estudiante a un grupo (la tabla grupo_estudiante). */
export const agregarEstudianteAGrupo = (idGrupo, idEstudiante) =>
  apiEnviar(`${BASE}/grupo-estudiante`, "POST", { id_grupo: idGrupo, id_estudiante: idEstudiante });

/** Crea la asignacion_plaza del estudiante (plaza, fechas y horas del
 *  grupo), paso final de "Asignar estudiantes a grupo de práctica". */
export const crearAsignacionPlaza = (datos) => apiEnviar(`${BASE}/asignacion-plaza`, "POST", datos);

/** Registra una plaza de práctica nueva (queda en estado "pendiente"). */
export const registrarPlaza = (datos) => apiEnviar(`${BASE}/plazas`, "POST", datos);

/** Aprueba o rechaza una plaza (con el motivo, cuando se rechaza). */
export const actualizarPlaza = (idPlaza, datos) => apiEnviar(`${BASE}/plazas/${idPlaza}`, "PUT", datos);

/** Decide el resultado de una práctica: "aprobada" o "rechazada" (con el
 *  motivo, cuando se rechaza). Reutiliza el mismo PUT de asignacion-plaza. */
export const decidirResultadoPractica = (idAsignacion, datos) =>
  apiEnviar(`${BASE}/asignacion-plaza/${idAsignacion}`, "PUT", datos);