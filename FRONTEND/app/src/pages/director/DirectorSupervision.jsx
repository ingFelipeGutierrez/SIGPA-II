import { useEffect, useState } from "react";
import { useSupervisionHoras } from "../../hooks/useSupervisionHoras";
import { obtenerBitacorasPorAsignacion } from "../../services/bitacoras";
import { formatearFecha, formatearHoras } from "../../utils/formato";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import Cargando from "../../components/Cargando";

const CLASE_NIVEL = { Bajo: "nivel-bajo", Medio: "nivel-medio", Alto: "nivel-alto" };

/**
 * src/pages/director/DirectorSupervision.jsx
 * Página "Supervisión de horas" (CU 6 — Supervisar Cumplimiento de
 * Horas): tarjetas de resumen, filtro por nivel de cumplimiento y la
 * tabla de estudiantes con práctica "en curso" o "finalizada", ordenada
 * de menor a mayor cumplimiento (ya así en el reporte del backend).
 * Equivale a #supervision / pintarSupervision() de director/director.js.
 */
export default function DirectorSupervision() {
  const { estudiantes, indicadores, cargando } = useSupervisionHoras();
  const [filtroNivel, setFiltroNivel] = useState("");
  const [seleccionado, setSeleccionado] = useState(null); // fila con "Ver detalle" abierto

  if (cargando) return <Cargando />;

  if (estudiantes.length === 0) {
    return (
      <div className="page">
        <Cabecera />
        <div className="cards" style={{ marginBottom: 20 }}>
          <TarjetaKpi titulo="Estudiantes en práctica" numero={0} />
          <TarjetaKpi titulo="Cumplimiento promedio" numero="0%" />
          <TarjetaKpi titulo="Con bajo cumplimiento" numero={0} />
        </div>
        <div className="card vacio">No hay estudiantes en práctica para supervisar.</div>
      </div>
    );
  }

  const lista = filtroNivel ? estudiantes.filter((e) => e.nivel === filtroNivel) : estudiantes;

  return (
    <div className="page">
      <Cabecera />

      <div className="cards" style={{ marginBottom: 20 }}>
        <TarjetaKpi titulo="Estudiantes en práctica" numero={indicadores.estudiantes_en_practica} />
        <TarjetaKpi titulo="Cumplimiento promedio" numero={`${indicadores.cumplimiento_promedio}%`} />
        <TarjetaKpi titulo="Con bajo cumplimiento" numero={indicadores.con_bajo_cumplimiento} />
      </div>

      <div className="table-container">
        <div className="filtros">
          <div className="campo">
            <label>Nivel de cumplimiento</label>
            <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
              <option value="">Todos</option>
              <option value="Bajo">Bajo</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>
          <button className="button-secondary" onClick={() => setFiltroNivel("")}>Limpiar</button>
        </div>

        <div className="tabla-scroll">
          <table className="apilable">
            <thead>
              <tr><th>Estudiante</th><th>Institución</th><th>Docente</th><th>Horas</th><th>Cumplimiento</th><th>Nivel</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id_asignacion}>
                  <td data-label="Estudiante">{e.estudiante}</td>
                  <td data-label="Institución">{e.institucion || "—"}</td>
                  <td data-label="Docente">{e.docente_asesor || "—"}</td>
                  <td data-label="Horas">{formatearHoras(e.horas_cumplidas)} / {e.horas_requeridas}</td>
                  <td data-label="Cumplimiento">
                    <div style={{ minWidth: 120 }}>
                      <div className="progress">
                        <div className={`progress-bar ${CLASE_NIVEL[e.nivel]}`} style={{ width: `${e.porcentaje}%` }} />
                      </div>
                      <small>{e.porcentaje}%</small>
                    </div>
                  </td>
                  <td data-label="Nivel"><Badge estado={e.nivel} /></td>
                  <td data-label="Acciones">
                    <button className="button-secondary" onClick={() => setSeleccionado(e)}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lista.length === 0 && <div className="vacio">No hay estudiantes en este nivel de cumplimiento.</div>}
      </div>

      {seleccionado && (
        <ModalHorasEstudiante estudiante={seleccionado} onClose={() => setSeleccionado(null)} />
      )}
    </div>
  );
}

function Cabecera() {
  return (
    <div className="page-title">
      <h1>Supervisión de horas</h1>
      <p>Supervisa el cumplimiento de horas de los estudiantes en práctica.</p>
    </div>
  );
}

function TarjetaKpi({ titulo, numero }) {
  return (
    <div className="card stat-card">
      <div className="stat-title">{titulo}</div>
      <div className="stat-number">{numero}</div>
    </div>
  );
}

/** Modal "Horas del estudiante": horas cumplidas/requeridas, porcentaje,
 *  horas de bitácoras pendientes de aprobación (informativo) y la tabla
 *  de bitácoras ya aprobadas. Las bitácoras se cargan al abrir el modal
 *  (el reporte de horas no las trae, solo el total ya sumado). */
function ModalHorasEstudiante({ estudiante: e, onClose }) {
  const [bitacoras, setBitacoras] = useState(null); // null mientras carga

  useEffect(() => {
    let activo = true;
    obtenerBitacorasPorAsignacion(e.id_asignacion).then((datos) => {
      if (activo) setBitacoras(datos);
    });
    return () => { activo = false; };
  }, [e.id_asignacion]);

  const aprobadas = bitacoras ? bitacoras.filter((b) => b.estado === "aprobada") : [];
  const horasPendientes = bitacoras
    ? bitacoras.filter((b) => b.estado === "pendiente").reduce((s, b) => s + (b.horas_registradas || 0), 0)
    : 0;

  return (
    <Modal titulo={`Horas del estudiante · ${e.estudiante}`} onClose={onClose}>
      <p className="dato-linea"><strong>Horas cumplidas:</strong> {formatearHoras(e.horas_cumplidas)} / {e.horas_requeridas}</p>
      <p className="dato-linea"><strong>Porcentaje:</strong> {e.porcentaje}%</p>
      <p className="dato-linea"><strong>Nivel:</strong> <Badge estado={e.nivel} /></p>
      <p className="dato-linea"><strong>Horas de bitácoras pendientes de aprobación:</strong> {formatearHoras(horasPendientes)}</p>

      <div className="section-title" style={{ marginTop: 14 }}>Bitácoras aprobadas</div>
      {bitacoras === null ? (
        <Cargando />
      ) : aprobadas.length ? (
        <table className="apilable">
          <thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th></tr></thead>
          <tbody>
            {aprobadas.map((b) => (
              <tr key={b._id}>
                <td data-label="Fecha">{formatearFecha(b.fecha)}</td>
                <td data-label="Actividad">{b.titulo}</td>
                <td data-label="Horas">{formatearHoras(b.horas_registradas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="dato-linea">Aún no hay bitácoras aprobadas para este estudiante.</p>
      )}
    </Modal>
  );
}