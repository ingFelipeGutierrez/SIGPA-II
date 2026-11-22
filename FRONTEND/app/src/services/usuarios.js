/**
 * src/services/usuarios.js
 *
 * Llamadas al router /api/usuarios del backend (base neondb): personas,
 * con los datos propios de su rol ya resueltos (programa/semestre del
 * estudiante, especialidad del docente). Lo usan el panel del Director
 * (listas de "Gestionar prácticas") y el del Super Admin (gestión de
 * usuarios: listar, crear, editar y eliminar por rol).
 */
import { apiGet, apiEnviar } from "./api";

const BASE = "/api/usuarios";

/** Ruta del backend que gestiona cada rol (usuario + su tabla de rol en una transacción). */
const RUTA_POR_ROL = {
  ESTUDIANTE: "estudiantes-completos",
  DOCENTE: "docentes-completos",
  DIRECTOR: "directores-completos",
  ADMIN_SISTEMA: "admins-completos",
};

/** Todos los usuarios, de cualquier rol (id, nombre, apellido, correo y rol). */
export const obtenerUsuarios = () => apiGet(BASE);

/** Todos los estudiantes (usuario + su fila en la tabla estudiante). */
export const obtenerEstudiantes = () => apiGet(`${BASE}/estudiantes`);

/** Todos los docentes asesores (usuario + su fila en docente_asesor). */
export const obtenerDocentesCompletos = () => apiGet(`${BASE}/docentes-completos`);

/** Crea un usuario del rol indicado. `datos` = nombre, apellido, email + campos propios del rol. */
export const crearUsuario = (rol, datos) => apiEnviar(`${BASE}/${RUTA_POR_ROL[rol]}`, "POST", datos);

/** Actualiza un usuario del rol indicado. */
export const actualizarUsuario = (rol, idUsuario, datos) =>
  apiEnviar(`${BASE}/${RUTA_POR_ROL[rol]}/${idUsuario}`, "PUT", datos);

/** Elimina un usuario del rol indicado (el backend borra primero su fila de rol y luego el usuario). */
export const eliminarUsuario = (rol, idUsuario) =>
  apiEnviar(`${BASE}/${RUTA_POR_ROL[rol]}/${idUsuario}`, "DELETE");
