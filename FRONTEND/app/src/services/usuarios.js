/**
 * src/services/usuarios.js
 *
 * Llamadas al router /api/usuarios del backend (base neondb): personas,
 * con los datos propios de su rol ya resueltos (programa/semestre del
 * estudiante, especialidad del docente). Usado por el panel del
 * Director para armar las listas de "Gestionar prácticas" (CU 1).
 */
import { apiGet } from "./api";

const BASE = "/api/usuarios";

/** Todos los estudiantes (usuario + su fila en la tabla estudiante). */
export const obtenerEstudiantes = () => apiGet(`${BASE}/estudiantes`);

/** Todos los docentes asesores (usuario + su fila en docente_asesor). */
export const obtenerDocentesCompletos = () => apiGet(`${BASE}/docentes-completos`);