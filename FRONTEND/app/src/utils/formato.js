/**
 * src/utils/formato.js
 *
 * Funciones puras de formato de datos para la interfaz, portadas desde el
 * prototipo original (FRONTEND/js/comun.js). No tocan el DOM ni hacen
 * peticiones: solo reciben un valor y devuelven el texto que se muestra.
 *
 * `escaparHtml` no se porta: React escapa automáticamente todo lo que se
 * renderiza entre llaves, así que ese riesgo (XSS al imprimir texto del
 * usuario) ya no existe en esta versión.
 */

/**
 * Fecha ISO ("2026-05-25" o un datetime completo de Mongo) -> formato local
 * día/mes/año ("25/05/2026"). Devuelve "—" si no hay fecha.
 */
export function formatearFecha(valor) {
  if (!valor) return "—";
  // Si viene de Mongo como datetime completo, nos quedamos solo con la fecha.
  const soloFecha = String(valor).split("T")[0];
  const partes = soloFecha.split("-");
  if (partes.length !== 3) return "—";
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/** Horas: entero sin decimales, con un decimal cuando aplica (ej: 4 ó 4.5). */
export function formatearHoras(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

/** Nota en formato "4.5 / 5.0". Devuelve "—" si no hay nota registrada. */
export function formatearNota(n) {
  if (n === null || n === undefined || n === "") return "—";
  return `${Number(n).toFixed(1)} / 5.0`;
}

/** Tamaño de archivo en bytes -> texto legible (KB o MB). */
export function formatearTamano(bytes) {
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
}

/** Iniciales para el avatar: primera letra de las dos primeras palabras. */
export function iniciales(nombre) {
  const partes = String(nombre || "").trim().split(/\s+/);
  return (((partes[0] || "")[0] || "") + ((partes[1] || "")[0] || "")).toUpperCase();
}

/** Primer nombre de pila, para saludos ("Hola, Felipe"). */
export function primerNombre(nombre) {
  return String(nombre || "").trim().split(/\s+/)[0] || "";
}

/** Fecha de hoy en hora local (no UTC), en formato ISO "YYYY-MM-DD". Se usa
 *  como tope máximo en los selectores de fecha de los formularios. */
export function fechaHoy() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}

/**
 * Mapa único de color por estado: un solo lugar decide qué badge le
 * corresponde a cada texto de estado, igual que en el prototipo original.
 */
const COLORES_ESTADO = {
  Aprobada: "verde",
  aprobada: "verde",
  "En curso": "azul",
  en_curso: "azul",
  Vigente: "verde",
  Alto: "verde",
  Pendiente: "ambar",
  pendiente: "ambar",
  "Próximo a vencer": "ambar",
  Medio: "ambar",
  Rechazada: "rojo",
  rechazada: "rojo",
  Vencido: "rojo",
  Bajo: "rojo",
  "Requiere corrección": "naranja",
  requiere_correccion: "naranja",
  Finalizada: "gris",
  finalizada: "gris",
  Cambiada: "gris",
  cambiada: "gris",
  "Sin convenio": "gris",
};

/** Clase CSS del badge (sin el texto) para un estado dado. */
export function claseBadge(estado) {
  return COLORES_ESTADO[estado] || "ambar";
}

/** Convierte el estado crudo del backend ("en_curso") al texto que ve el
 *  usuario ("En curso"), para los estados de bitácora que vienen en
 *  minúsculas desde Mongo. */
export function textoEstadoBitacora(estado) {
  const mapa = {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    requiere_correccion: "Requiere corrección",
  };
  return mapa[estado] || estado;
}

/** Igual que `textoEstadoBitacora`, pero para el estado de una
 *  asignacion_plaza (la práctica del estudiante): "en_curso" -> "En
 *  curso", etc. Usado en el panel de Docente/Director. */
export function textoEstadoPractica(estado) {
  const mapa = {
    pendiente: "Pendiente",
    en_curso: "En curso",
    finalizada: "Finalizada",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
    cambiada: "Cambiada",
  };
  return mapa[estado] || estado || "Sin asignar";
}

/** Cuenta palabras de un texto (separadas por espacios), para los
 *  contadores en vivo de retroalimentación ("0 / 200 palabras"), igual
 *  que `contarPalabras` del prototipo original. */
export function contarPalabras(texto) {
  const limpio = String(texto || "").trim();
  return limpio ? limpio.split(/\s+/).length : 0;
}

/** Días restantes hasta la fecha de fin de un convenio (negativo si ya
 *  venció). `null` si la institución aún no tiene convenio registrado. */
export function diasRestantesConvenio(fechaFin) {
  if (!fechaFin) return null;
  const hoy = new Date();
  const fin = new Date(fechaFin);
  return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
}

/** Estado de vigencia de un convenio a partir de su fecha de fin, con el
 *  mismo umbral (60 días) que usa el reporte de convenios del backend
 *  (BACKEND/routes/reportes.js, GET /convenios), para que el panel del
 *  Director y el reporte siempre muestren el mismo estado. */
export function estadoConvenio(fechaFin) {
  if (!fechaFin) return "Sin convenio";
  const dias = diasRestantesConvenio(fechaFin);
  if (dias < 0) return "Vencido";
  if (dias <= 60) return "Próximo a vencer";
  return "Vigente";
}

/** Primera letra en mayúscula y el resto en minúscula: el tipo de
 *  institución llega del backend en mayúsculas ("OFICIAL") y se muestra
 *  como "Oficial". */
export function capitalizar(texto) {
  const t = String(texto || "");
  return t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : "";
}
/**
 * Estado de una práctica según la regla del Documento Maestro (una sola
 * función para todos los paneles, así Director, Docente y Estudiante
 * siempre ven el mismo estado):
 *
 *  1. Si hay un resultado guardado (aprobada / rechazada) manda ese; lo
 *     mismo "cambiada".
 *  2. Si no hay grupo, o no hay docente asesor, o hoy es antes del inicio
 *     -> "pendiente".
 *  3. Si hoy <= fecha de fin -> "en_curso".
 *  4. Si hoy > fecha de fin -> "finalizada".
 *
 * Si la asignación no trae fechas, se respeta el estado guardado.
 *
 * @param {{estado?: string, id_grupo?: number, fecha_inicio?: string,
 *          fecha_fin?: string, docente_asesor?: string, docente?: string,
 *          tiene_docente?: boolean}} p  Fila de asignacion_plaza (con docente).
 * @returns {string} "pendiente" | "en_curso" | "finalizada" | "aprobada" | "rechazada" | "cambiada"
 */
export function estadoPractica(p) {
  if (!p) return "pendiente";
  if (["aprobada", "rechazada", "cambiada"].includes(p.estado)) return p.estado;
  const tieneDocente = p.tiene_docente ?? Boolean(p.docente_asesor || p.docente);
  const inicio = p.fecha_inicio ? String(p.fecha_inicio).split("T")[0] : null;
  const fin = p.fecha_fin ? String(p.fecha_fin).split("T")[0] : null;
  if (!inicio || !fin) return p.estado || "pendiente";
  const hoy = fechaHoy();
  if (!p.id_grupo || !tieneDocente || hoy < inicio) return "pendiente";
  return hoy <= fin ? "en_curso" : "finalizada";
}

/** Devuelve la práctica con `estado` recalculado por `estadoPractica`
 *  (el valor guardado queda en `estado_bd`). Los hooks lo aplican apenas
 *  llegan los datos para que ninguna pantalla use el estado crudo. */
export function conEstadoPractica(p) {
  return p ? { ...p, estado_bd: p.estado, estado: estadoPractica(p) } : p;
}

/**
 * Fecha de la "Última actualización" del estado de una práctica (Mi
 * práctica del Estudiante). La base no guarda la fecha en que se decidió
 * el resultado, así que se aproxima como en el prototipo: en curso -> su
 * inicio; finalizada, aprobada o rechazada -> su fin; si no, el inicio.
 */
export function fechaUltimoEstado(pr) {
  if (!pr) return null;
  if (["finalizada", "aprobada", "rechazada"].includes(pr.estado)) return pr.fecha_fin;
  return pr.fecha_inicio;
}
