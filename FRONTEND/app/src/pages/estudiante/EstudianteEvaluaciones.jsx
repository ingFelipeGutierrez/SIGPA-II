import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import { obtenerMiPractica, obtenerCalificacionesPorAsignacion } from "../../services/practicas";
import { obtenerBitacorasEstudiante } from "../../services/bitacoras";
import { obtenerRetroalimentacionEstudiante } from "../../services/retroalimentacion";
import { formatearFecha, formatearNota } from "../../utils/formato";
import Modal from "../../components/Modal";

/**
 * src/pages/estudiante/EstudianteEvaluaciones.jsx
 * Página "Evaluaciones" (CU 2 — Consultar retroalimentación y
 * observaciones del docente): tabla de notas por bitácora + bloque de
 * retroalimentación, con filtro por rango de fechas. Equivale a
 * #evaluaciones / pintarEvaluaciones() del prototipo original.
 */
export default function EstudianteEvaluaciones() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();

  const [notas, setNotas] = useState([]);
  const [retros, setRetros] = useState([]);
  const [tituloPorBitacora, setTituloPorBitacora] = useState({});
  const [cargando, setCargando] = useState(true);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [modalNota, setModalNota] = useState(null);

  useEffect(() => {
    (async () => {
      const pr = await obtenerMiPractica(usuario.id_usuario);
      const [bits, retroList] = await Promise.all([
        obtenerBitacorasEstudiante(usuario.id_usuario),
        obtenerRetroalimentacionEstudiante(usuario.id_usuario),
      ]);
      setRetros(retroList);

      // Cada bitácora ya trae su propio título (campo obligatorio en el
      // esquema de MongoDB), así que basta con mapear por su _id.
      const mapa = {};
      bits.forEach((b) => { mapa[b._id] = b.titulo || "Bitácora"; });
      setTituloPorBitacora(mapa);

      if (pr?.id_asignacion) {
        const notasList = await obtenerCalificacionesPorAsignacion(pr.id_asignacion);
        setNotas(notasList);
      }
      setCargando(false);
    })();
  }, [usuario.id_usuario]);

  const hayFiltro = Boolean(desde || hasta);

  /** true si la fecha dada cae dentro del rango [desde, hasta] elegido. */
  const enRango = useMemo(() => (fecha) => {
    const f = String(fecha).split("T")[0];
    return (!desde || f >= desde) && (!hasta || f <= hasta);
  }, [desde, hasta]);

  const notasFiltradas = useMemo(() => notas.filter((n) => enRango(n.fecha_calificacion || n.fecha)), [notas, enRango]);
  const retrosFiltradas = useMemo(() => retros.filter((r) => enRango(r.fecha)), [retros, enRango]);

  function filtrar() {
    if (desde && hasta && desde > hasta) {
      mostrarToast("La fecha inicial no puede ser posterior a la fecha final.", "error");
      return;
    }
  }

  function limpiarFiltro() { setDesde(""); setHasta(""); }

  if (cargando) return <p className="vacio">Cargando…</p>;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Evaluaciones</h1>
        <p>Consulta la nota y las observaciones de tu docente asesor por cada bitácora, y su retroalimentación.</p>
      </div>

      <div className="table-container" style={{ marginBottom: 20 }}>
        <div className="filtros">
          <div className="campo"><label>Desde</label><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div className="campo"><label>Hasta</label><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          <button className="button-primary" onClick={filtrar}>Filtrar</button>
          <button className="button-secondary" onClick={limpiarFiltro}>Limpiar</button>
        </div>

        <h3 style={{ marginBottom: 12 }}>Nota y observaciones por bitácora</h3>
        <table className="apilable">
          <thead><tr><th>Fecha</th><th>Bitácora</th><th>Evaluador</th><th>Nota</th><th>Observaciones</th><th>Acciones</th></tr></thead>
          <tbody>
            {notasFiltradas.map((n) => (
              <tr key={n.id_calificacion}>
                <td data-label="Fecha">{formatearFecha(n.fecha_calificacion || n.fecha)}</td>
                <td data-label="Bitácora">{tituloPorBitacora[n.bitacora_id] || "—"}</td>
                <td data-label="Evaluador">{n.docente_nombre}</td>
                <td data-label="Nota"><strong>{formatearNota(n.nota)}</strong></td>
                <td data-label="Observaciones">{n.observaciones || "—"}</td>
                <td data-label="Acciones"><button className="button-secondary" onClick={() => setModalNota(n)}>👁️ Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {notasFiltradas.length === 0 && (
          <div className="vacio">
            {!notas.length ? "Aún no hay retroalimentación ni evaluaciones disponibles para consultar."
              : hayFiltro ? "No hay notas en el periodo seleccionado." : "Aún no tienes notas registradas por tu docente asesor."}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Retroalimentación del docente asesor</h3>
        {retrosFiltradas.length ? (
          retrosFiltradas.map((r) => (
            <div className="retro-item" key={r._id}>
              <small>{formatearFecha(r.fecha)} · {tituloPorBitacora[r.bitacora_id] || ""}</small>
              {r.texto}
            </div>
          ))
        ) : (
          <div className="vacio">
            {hayFiltro && retros.length ? "No hay retroalimentaciones en el periodo seleccionado." : "Tu docente asesor aún no ha registrado retroalimentaciones."}
          </div>
        )}
      </div>

      {modalNota && (
        <Modal titulo="Evaluación de la bitácora" onClose={() => setModalNota(null)}>
          <p className="dato-linea"><strong>Evaluador:</strong> {modalNota.docente_nombre}</p>
          <p className="dato-linea"><strong>Bitácora:</strong> {tituloPorBitacora[modalNota.bitacora_id] || "—"}</p>
          <p className="dato-linea"><strong>Fecha de la evaluación:</strong> {formatearFecha(modalNota.fecha_calificacion || modalNota.fecha)}</p>
          <p className="dato-linea"><strong>Nota:</strong> {formatearNota(modalNota.nota)}</p>
          <p className="dato-linea"><strong>Observaciones:</strong><br />{modalNota.observaciones || "—"}</p>
        </Modal>
      )}
    </div>
  );
}
