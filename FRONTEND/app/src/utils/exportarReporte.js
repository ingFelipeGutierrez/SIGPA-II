/**
 * src/utils/exportarReporte.js
 *
 * Exportación de un reporte a PDF y/o Excel (CU 5 — Exportar reporte).
 * Todo se genera en el navegador, sin servidor (Documento Maestro §13).
 * Las librerías (jsPDF, jspdf-autotable y SheetJS) se cargan con import()
 * dinámico solo cuando el director exporta, para no engordar la carga
 * inicial de la aplicación.
 *
 * El reporte recibido tiene la forma de construirReporte() en
 * utils/reportes.js, más las fechas del periodo: { titulo, columnas,
 * filas, indicadores, desde, hasta }.
 */
import { formatearFecha, fechaHoy } from "./formato";

/** Color de acento del Director (dorado) para el encabezado de la tabla del PDF. */
const COLOR_ACENTO = [201, 130, 15];

/** "Reporte_{tipo-en-minusculas-con-guiones}_{aaaa-mm-dd}.{ext}" */
function nombreArchivo(titulo, ext) {
  const tipo = titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Reporte_${tipo}_${fechaHoy()}.${ext}`;
}

/**
 * Guarda el archivo. En Chrome/Edge de escritorio abre "Guardar como" para
 * que el director elija la carpeta; si el navegador no lo permite (o no hay
 * una interacción reciente, como en el segundo archivo de "Ambos"), lo
 * descarga directo. Si el director cancela, se propaga el AbortError.
 */
async function guardarArchivo(blob, nombre, descripcion, mime, ext) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: nombre,
        types: [{ description: descripcion, accept: { [mime]: [`.${ext}`] } }],
      });
      const escritura = await handle.createWritable();
      await escritura.write(blob);
      await escritura.close();
      return;
    } catch (e) {
      if (e && e.name === "AbortError") throw e; // el director canceló
      // cualquier otro motivo: se cae a la descarga directa
    }
  }
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

/** PDF: horizontal si la tabla tiene más de 6 columnas; encabezado, periodo,
 *  generado por, indicadores en una fila, tabla y número de página al pie. */
async function exportarPDF(reporte, nombreDirector) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: reporte.columnas.length > 6 ? "landscape" : "portrait" });
  const ahora = new Date();
  const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

  doc.setFontSize(14);
  doc.text(`SIGPA · ${reporte.titulo}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Periodo: ${formatearFecha(reporte.desde)} a ${formatearFecha(reporte.hasta)}`, 14, 23);
  doc.text(`Generado el ${formatearFecha(fechaHoy())} ${hora} por ${nombreDirector}`, 14, 29);
  doc.text(reporte.indicadores.map(([nombre, valor]) => `${nombre}: ${valor}`).join("   |   "), 14, 37);

  autoTable(doc, {
    head: [reporte.columnas],
    body: reporte.filas.map((fila) => fila.map(String)),
    startY: 43,
    headStyles: { fillColor: COLOR_ACENTO },
    styles: { fontSize: 9 },
    didDrawPage: (datos) => {
      doc.setFontSize(8);
      doc.text(`Página ${doc.getNumberOfPages()}`, datos.settings.margin.left, doc.internal.pageSize.height - 8);
    },
  });

  await guardarArchivo(doc.output("blob"), nombreArchivo(reporte.titulo, "pdf"), "Documento PDF", "application/pdf", "pdf");
}

/** Excel: libro con hoja "Indicadores" (indicador y valor) y hoja "Detalle"
 *  (la tabla, con anchos razonables y encabezado en negrita). */
async function exportarExcel(reporte) {
  const XLSX = await import("xlsx");

  const libro = XLSX.utils.book_new();
  const hojaIndicadores = XLSX.utils.aoa_to_sheet([["Indicador", "Valor"], ...reporte.indicadores]);
  hojaIndicadores["!cols"] = [{ wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(libro, hojaIndicadores, "Indicadores");

  const hojaDetalle = XLSX.utils.aoa_to_sheet([reporte.columnas, ...reporte.filas]);
  hojaDetalle["!cols"] = reporte.columnas.map((columna, i) => ({
    wch: Math.min(40, Math.max(String(columna).length, ...reporte.filas.map((f) => String(f[i] ?? "").length)) + 2),
  }));
  XLSX.utils.book_append_sheet(libro, hojaDetalle, "Detalle");

  // La edición community de SheetJS no aplica estilos de celda: el encabezado
  // queda como primera fila de la hoja; la "negrita" la da el propio Excel al
  // convertirla en tabla. Se deja la fila de encabezado separada y con anchos.
  const bytes = XLSX.write(libro, { bookType: "xlsx", type: "array" });
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  await guardarArchivo(blob, nombreArchivo(reporte.titulo, "xlsx"), "Libro de Excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");
}

/**
 * @param {"pdf"|"excel"|"ambos"} formato
 * @param {object} reporte  reporte generado + { desde, hasta }
 * @param {string} nombreDirector  quien genera el reporte (va en el PDF)
 * @throws AbortError si el director cancela el cuadro "Guardar como".
 */
export async function exportarReporte(formato, reporte, nombreDirector) {
  if (formato === "pdf" || formato === "ambos") await exportarPDF(reporte, nombreDirector);
  if (formato === "excel" || formato === "ambos") await exportarExcel(reporte);
}
