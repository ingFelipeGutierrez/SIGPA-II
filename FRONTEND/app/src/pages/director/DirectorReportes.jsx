import { useState } from "react";
import { obtenerPracticasCompletas, obtenerCalificacionesBitacora } from "../../services/practicas";
import { obtenerTodasLasBitacoras } from "../../services/bitacoras";
import { obtenerReporteConvenios } from "../../services/reportes";
import { construirReporte, TIPOS_REPORTE } from "../../utils/reportes";
import { exportarReporte } from "../../utils/exportarReporte";
import { formatearFecha } from "../../utils/formato";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import Modal from "../../components/Modal";
import Cargando from "../../components/Cargando";

/**
 * src/pages/director/DirectorReportes.jsx
 * Página "Reportes" (CU 4 — Generar reportes e indicadores y CU 5 —
 * Exportar reporte a PDF/Excel): formulario con
 * tipo de reporte y periodo, validación del rango de fechas y, debajo, el
 * reporte generado (título, tarjetas de indicadores y tabla de detalle).
 * No hay historial de reportes (igual que el prototipo). Equivale a
 * #reportes / generarReporte() de director/director.js.
 *
 * Los datos se consultan en el momento de generar (así el reporte siempre
 * refleja lo último) y los cálculos viven en utils/reportes.js.
 */
export default function DirectorReportes() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const [tipo, setTipo] = useState(TIPOS_REPORTE[0]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [error, setError] = useState("");
  const [generando, setGenerando] = useState(false);
  const [reporte, setReporte] = useState(null); // { ...reporte, desde, hasta }
  const [exportando, setExportando] = useState(false); // ventana "Exportar reporte" abierta
  const [formato, setFormato] = useState("pdf");

  /** Valida el periodo, trae los datos y construye el reporte. */
  const generar = async () => {
    setError("");
    if (!desde || !hasta) return setError("Selecciona el periodo del reporte.");
    if (hasta < desde) return setError("La fecha final no puede ser anterior a la inicial.");

    setGenerando(true);
    try {
      const [practicas, bitacoras, calificaciones, convenios] = await Promise.all([
        obtenerPracticasCompletas(),
        obtenerTodasLasBitacoras(),
        obtenerCalificacionesBitacora(),
        obtenerReporteConvenios(),
      ]);
      const r = construirReporte(tipo, desde, hasta, {
        practicas, bitacoras, calificaciones, convenios: convenios.convenios,
      });
      setReporte({ ...r, desde, hasta });
    } catch (e) {
      setReporte(null);
      setError(e.message || "No se pudo generar el reporte. Intenta nuevamente.");
    } finally {
      setGenerando(false);
    }
  };

  /** CU 5: genera el/los archivos; cancelar el cuadro "Guardar como" no es un error. */
  const exportar = async () => {
    setExportando(false);
    try {
      await exportarReporte(formato, reporte, `${usuario.nombre} ${usuario.apellido}`);
      mostrarToast("Reporte exportado correctamente.", "ok");
    } catch (e) {
      if (e && e.name === "AbortError") mostrarToast("Exportación cancelada.", "info");
      else mostrarToast("No se pudo generar el archivo. Intenta nuevamente.", "error");
    }
  };

  return (
    <div className="page">
      <div className="page-title">
        <h1>Reportes</h1>
        <p>Genera reportes e indicadores del estado de las prácticas.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filtros">
          <div className="campo">
            <label htmlFor="r-tipo">Tipo de reporte</label>
            <select id="r-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_REPORTE.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="r-desde">Fecha inicial</label>
            <input type="date" id="r-desde" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="r-hasta">Fecha final</label>
            <input type="date" id="r-hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <button className="button-primary" onClick={generar} disabled={generando}>📄 Generar reporte</button>
        </div>
        {error && <div className="campo-error" style={{ display: "block" }}>{error}</div>}
      </div>

      {generando && <Cargando />}

      {!generando && reporte && (reporte.filas.length === 0 ? (
        <div className="card vacio">No hay datos disponibles para los criterios definidos.</div>
      ) : (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <h3>{reporte.titulo} · {formatearFecha(reporte.desde)} a {formatearFecha(reporte.hasta)}</h3>
            <button className="button-primary" onClick={() => setExportando(true)}>Exportar</button>
          </div>
          <div className="cards">
            {reporte.indicadores.map(([titulo, valor]) => (
              <div className="card stat-card" key={titulo}>
                <div className="stat-title">{titulo}</div>
                <div className="stat-number">{valor}</div>
              </div>
            ))}
          </div>
          <div className="tabla-scroll" style={{ marginTop: 16 }}>
            <table className="apilable">
              <thead><tr>{reporte.columnas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {reporte.filas.map((fila, i) => (
                  <tr key={i}>
                    {fila.map((celda, j) => <td key={j} data-label={reporte.columnas[j]}>{celda}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {exportando && (
        <Modal
          titulo="Exportar reporte"
          onClose={() => setExportando(false)}
          pie={
            <>
              <button className="button-secondary" data-cerrar>Cancelar</button>
              <button className="button-primary" onClick={exportar}>Exportar</button>
            </>
          }
        >
          <div className="form-group">
            <label htmlFor="exp-formato">Formato</label>
            <select id="exp-formato" value={formato} onChange={(e) => setFormato(e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}
