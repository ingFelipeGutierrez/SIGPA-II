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