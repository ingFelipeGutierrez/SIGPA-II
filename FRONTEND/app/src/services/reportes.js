/**
 * src/services/reportes.js
 *
 * Llamadas al router /api/reportes del backend (BACKEND/routes/reportes.js):
 * 5 endpoints de solo lectura, ya construidos y probados antes de empezar
 * el panel del Director, que cruzan ms_practicas y MongoDB (ms_seguimiento)
 * del lado del servidor. Usados por "Supervisión de horas" (CU 6) y,
 * más adelante, por "Reportes" (CU 4 y 5).
 */
import { apiGet } from "./api";

const BASE = "/api/reportes";

/** Cumplimiento de horas de cada estudiante con práctica en curso o
 *  finalizada: { indicadores, estudiantes }. Usado en CU 6. */
export const obtenerReporteHoras = () => apiGet(`${BASE}/horas`);

/** Estado de vigencia de los convenios, con sus cupos. Usado en CU 4. */
export const obtenerReporteConvenios = () => apiGet(`${BASE}/convenios`);

/** Cumplimiento de horas agrupado por institución, en un periodo
 *  (fechaInicial/fechaFinal en formato "YYYY-MM-DD"). Usado en CU 4. */
export const obtenerReporteHorasPorInstitucion = (fechaInicial, fechaFinal) =>
  apiGet(`${BASE}/horas-institucion?fecha_inicial=${fechaInicial}&fecha_final=${fechaFinal}`);

/** Bitácoras por docente asesor en un periodo. Usado en CU 4. */
export const obtenerReporteBitacorasDocente = (fechaInicial, fechaFinal) =>
  apiGet(`${BASE}/bitacoras-docente?fecha_inicial=${fechaInicial}&fecha_final=${fechaFinal}`);

/** Desempeño y resultado de las prácticas en un periodo. Usado en CU 4. */
export const obtenerReporteDesempeno = (fechaInicial, fechaFinal) =>
  apiGet(`${BASE}/desempeno?fecha_inicial=${fechaInicial}&fecha_final=${fechaFinal}`);