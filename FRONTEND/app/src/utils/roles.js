/**
 * src/utils/roles.js
 *
 * Textos legibles para los valores crudos que guarda la base de datos
 * (rol "ADMIN_SISTEMA", estado de solicitud "PENDIENTE", etc.). Los usa
 * el panel del Super Admin para no repetir estos mapas en cada pantalla.
 */

/** Roles del sistema: `valor` es lo que guarda la base, `etiqueta` lo que ve la persona. */
export const ROLES_USUARIO = [
  { valor: "ESTUDIANTE", etiqueta: "Estudiante" },
  { valor: "DOCENTE", etiqueta: "Docente asesor" },
  { valor: "DIRECTOR", etiqueta: "Director de programa" },
  { valor: "ADMIN_SISTEMA", etiqueta: "Super Admin" },
];

/** Color del badge de cada rol (reutiliza las clases badge-* de comun.css). */
const COLOR_ROL = {
  ESTUDIANTE: "azul",
  DOCENTE: "verde",
  DIRECTOR: "ambar",
  ADMIN_SISTEMA: "gris",
};

/** "DOCENTE" -> "Docente asesor". Si el rol no se conoce, lo devuelve tal cual. */
export function textoRol(rol) {
  return ROLES_USUARIO.find((r) => r.valor === rol)?.etiqueta ?? rol ?? "—";
}

/** Clase de color del badge para un rol. */
export function colorRol(rol) {
  return COLOR_ROL[rol] || "gris";
}

/** "PENDIENTE" -> "Pendiente" (así coincide con los colores de Badge). */
export function textoEstadoSolicitud(estado) {
  const mapa = { PENDIENTE: "Pendiente", APROBADA: "Aprobada", RECHAZADA: "Rechazada" };
  return mapa[estado] || estado;
}

/** Datos propios del rol que la persona escribió al pedir acceso (datos_rol). */
export function textoDatosRol(rol, datos) {
  if (!datos) return "—";
  if (rol === "ESTUDIANTE") return `${datos.programa || "—"} · Semestre ${datos.semestre || "—"}`;
  if (rol === "DOCENTE") return datos.especialidad || "—";
  return "—";
}

/** Dato propio del rol de un usuario ya registrado (programa y semestre / especialidad). */
export function textoDetalleUsuario(u) {
  if (u.rol === "ESTUDIANTE") return u.programa ? `${u.programa} · Semestre ${u.semestre || "—"}` : "—";
  if (u.rol === "DOCENTE") return u.especialidad || "—";
  return "—";
}

/** Las cuentas de prueba de los calificadores no se editan ni se eliminan. */
export function esCuentaDePrueba(usuario) {
  return String(usuario?.email || "").toLowerCase().startsWith("prueba.");
}
