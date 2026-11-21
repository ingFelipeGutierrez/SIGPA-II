/**
 * src/utils/reportes.js
 *
 * Construcción de los 4 reportes del Director (CU 4 — Generar reportes e
 * indicadores). Funciones puras: reciben los datos ya cargados y devuelven
 * { titulo, columnas, filas, indicadores }, el mismo formato que
 * construirReporte() del prototipo (js/datos.js), para que la pantalla y
 * la exportación a PDF/Excel (CU 5) usen exactamente la misma estructura.
 *
 * Reglas de cálculo: Documento Maestro §12.6. Las fechas se comparan como
 * texto "YYYY-MM-DD" (basta con quedarse con la parte de fecha de los
 * datetime que devuelve el backend).
 */
import { formatearFecha, formatearHoras } from "./formato";

/** Tipos de reporte, en el orden y con el texto exacto del prototipo. */
export const TIPOS_REPORTE = [
  "Cumplimiento de horas por institución",
  "Bitácoras por docente asesor",
  "Desempeño y resultado de las prácticas",
  "Estado de los convenios",
];

const soloFecha = (valor) => (valor ? String(valor).split("T")[0] : "");
const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);
const ETIQUETA_ESTADO = {
  en_curso: "En curso", finalizada: "Finalizada", aprobada: "Aprobada", rechazada: "Rechazada",
};
const ETIQUETA_VIGENCIA = (estado) => estado; // el backend ya manda "Vigente" / "Próximo a vencer" / "Vencido"

/**
 * @param {string} tipo   uno de TIPOS_REPORTE
 * @param {string} desde  fecha inicial "YYYY-MM-DD"
 * @param {string} hasta  fecha final "YYYY-MM-DD"
 * @param {{practicas: object[], bitacoras: object[], calificaciones: object[], convenios: object[]}} datos
 *   practicas: GET /practicas-completas (con `estado` ya derivado por conEstadoPractica)
 *   bitacoras: GET /bitacoras · calificaciones: GET /calificacion-bitacora
 *   convenios: `convenios` de GET /reportes/convenios
 * @returns {{titulo: string, columnas: string[], filas: Array<Array<string|number>>, indicadores: Array<[string, string|number]>}}
 */
export function construirReporte(tipo, desde, hasta, datos) {
  const enRango = (f) => Boolean(f) && f >= desde && f <= hasta;
  // Una práctica "cambiada" fue reemplazada por otra: no cuenta (evita duplicar al estudiante).
  const iniciadas = datos.practicas.filter((p) => p.estado !== "pendiente" && p.estado !== "cambiada");
  const aprobadasDe = (idAsignacion) =>
    datos.bitacoras.filter((b) => b.id_asignacion === idAsignacion && b.estado === "aprobada");

  if (tipo === TIPOS_REPORTE[0]) {
    const porInstitucion = new Map();
    iniciadas.forEach((p) => {
      const clave = p.institucion || "—";
      if (!porInstitucion.has(clave)) porInstitucion.set(clave, []);
      porInstitucion.get(clave).push(p);
    });
    const filas = [];
    porInstitucion.forEach((prs, nombre) => {
      const requeridas = prs.reduce((s, p) => s + (p.horas_requeridas || 160), 0);
      let periodo = 0;
      let acumuladas = 0;
      prs.forEach((p) => aprobadasDe(p.id_asignacion).forEach((b) => {
        const f = soloFecha(b.fecha);
        if (enRango(f)) periodo += b.horas_registradas || 0;
        if (f <= hasta) acumuladas += b.horas_registradas || 0;
      }));
      filas.push([nombre, prs.length, formatearHoras(periodo), formatearHoras(acumuladas), requeridas, `${porcentaje(acumuladas, requeridas)}%`]);
    });
    filas.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    // Totales recalculados desde las prácticas (no desde las filas ya formateadas)
    const totalEst = iniciadas.length;
    const totalReq = iniciadas.reduce((s, p) => s + (p.horas_requeridas || 160), 0);
    const totalAcum = iniciadas.reduce((s, p) => s + aprobadasDe(p.id_asignacion)
      .filter((b) => soloFecha(b.fecha) <= hasta).reduce((x, b) => x + (b.horas_registradas || 0), 0), 0);
    return {
      titulo: tipo,
      columnas: ["Institución", "Estudiantes", "Horas del periodo", "Horas acumuladas", "Horas requeridas", "Cumplimiento"],
      filas,
      indicadores: [["Estudiantes en práctica", totalEst], ["Horas acumuladas", formatearHoras(totalAcum)], ["Cumplimiento promedio", `${porcentaje(totalAcum, totalReq)}%`]],
    };
  }

  if (tipo === TIPOS_REPORTE[1]) {
    const porDocente = new Map();
    datos.practicas.filter((p) => p.docente_asesor && p.estado !== "cambiada").forEach((p) => {
      if (!porDocente.has(p.docente_asesor)) porDocente.set(p.docente_asesor, new Set());
      porDocente.get(p.docente_asesor).add(p.id_estudiante);
    });
    const filas = [];
    let totalBit = 0;
    let totalPend = 0;
    porDocente.forEach((estudiantes, nombre) => {
      const mias = datos.bitacoras.filter((b) => estudiantes.has(b.estudiante_id) && enRango(soloFecha(b.fecha)));
      const pend = mias.filter((b) => b.estado === "pendiente").length;
      const aprob = mias.filter((b) => b.estado === "aprobada").length;
      const corr = mias.filter((b) => b.estado === "requiere_correccion").length;
      totalBit += mias.length;
      totalPend += pend;
      filas.push([nombre, estudiantes.size, pend, aprob, corr]);
    });
    filas.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    return {
      titulo: tipo,
      columnas: ["Docente asesor", "Estudiantes", "Pendientes", "Aprobadas", "Requieren corrección"],
      filas,
      indicadores: [["Total de bitácoras", totalBit], ["Pendientes de revisión", totalPend]],
    };
  }

  if (tipo === TIPOS_REPORTE[2]) {
    let aprobadas = 0;
    let rechazadas = 0;
    let porDecidir = 0;
    let sumaNotas = 0;
    let cuentaNotas = 0;
    const filas = iniciadas.map((p) => {
      const requeridas = p.horas_requeridas || 160;
      const horas = aprobadasDe(p.id_asignacion).filter((b) => soloFecha(b.fecha) <= hasta)
        .reduce((s, b) => s + (b.horas_registradas || 0), 0);
      const notas = datos.calificaciones.filter((c) => c.id_asignacion === p.id_asignacion && enRango(soloFecha(c.fecha_registro)));
      const promedio = notas.length
        ? Math.round((notas.reduce((s, c) => s + parseFloat(c.nota), 0) / notas.length) * 10) / 10
        : null;
      if (p.estado === "aprobada") aprobadas += 1;
      if (p.estado === "rechazada") rechazadas += 1;
      if (p.estado === "finalizada") porDecidir += 1;
      if (promedio !== null) { sumaNotas += promedio; cuentaNotas += 1; }
      return [
        p.estudiante || "—", p.institucion || "—", p.docente_asesor || "—",
        `${formatearHoras(horas)} / ${requeridas}`, notas.length,
        promedio !== null ? promedio.toFixed(1) : "—", ETIQUETA_ESTADO[p.estado] || p.estado,
      ];
    });
    return {
      titulo: tipo,
      columnas: ["Estudiante", "Institución", "Docente asesor", "Horas", "Bitácoras calificadas", "Nota promedio", "Estado"],
      filas,
      indicadores: [["Aprobadas", aprobadas], ["Rechazadas", rechazadas], ["Finalizadas por decidir", porDecidir], ["Nota promedio general", cuentaNotas ? (sumaNotas / cuentaNotas).toFixed(1) : "—"]],
    };
  }

  // Estado de los convenios: los que se solapan con el periodo.
  const solapan = datos.convenios.filter((c) => soloFecha(c.fecha_inicio) <= hasta && soloFecha(c.fecha_fin) >= desde);
  const cuenta = (estado) => solapan.filter((c) => c.estado_vigencia === estado).length;
  return {
    titulo: tipo,
    columnas: ["Institución", "Inicio", "Fin", "Estado", "Plazas"],
    filas: solapan.map((c) => [c.institucion, formatearFecha(c.fecha_inicio), formatearFecha(c.fecha_fin), ETIQUETA_VIGENCIA(c.estado_vigencia), `${c.cupos_ocupados} / ${c.cupos_totales}`]),
    indicadores: [["Vigentes", cuenta("Vigente")], ["Próximos a vencer", cuenta("Próximo a vencer")], ["Vencidos", cuenta("Vencido")]],
  };
}
