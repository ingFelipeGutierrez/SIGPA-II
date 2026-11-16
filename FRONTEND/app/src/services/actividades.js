/**
 * src/services/actividades.js
 * Llamadas a la colección "actividad" de MongoDB (modelo tipo Classroom:
 * el docente publica una actividad con fecha límite para su grupo, y los
 * estudiantes registran bitácoras contra esa actividad), a través de
 * /api/actividades.
 */
import { apiGet, apiEnviar } from "./api";

const BASE = "/api/actividades";

/** Actividades publicadas para un grupo de práctica. */
export const obtenerActividadesDeGrupo = (idGrupo) => apiGet(`${BASE}/grupo/${idGrupo}`);

export const crearActividad = (datos) => apiEnviar(BASE, "POST", datos);
export const editarActividad = (id, datos) => apiEnviar(`${BASE}/${id}`, "PUT", datos);
