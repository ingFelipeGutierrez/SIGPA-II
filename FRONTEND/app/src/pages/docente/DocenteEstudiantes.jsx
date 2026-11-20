import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDatosDocente } from "../../hooks/useDatosDocente";
import { formatearFecha, formatearHoras, textoEstadoPractica } from "../../utils/formato";
import Badge from "../../components/Badge";
import Cargando from "../../components/Cargando";

const ESTADOS_PRACTICA = ["pendiente", "en_curso", "finalizada", "aprobada", "rechazada"];

/**
 * src/pages/docente/DocenteEstudiantes.jsx
 * Página "Mis estudiantes" (CU 1 — Consultar estudiantes asignados y
 * avances de horas): tabla filtrable por institución y estado, con
 * acceso al detalle de avance de horas de cada estudiante y acceso
 * directo a sus bitácoras. Equivale a #estudiantes / pintarEstudiantes()
 * de docente/docente.js.
 */
export default function DocenteEstudiantes() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { estudiantes, bitacoras: bits, cargando } = useDatosDocente(usuario.id_usuario);
  const [fInstitucion, setFInstitucion] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [seleccionado, setSeleccionado] = useState(null); // id_estudiante con "Ver avance" abierto

  const instituciones = useMemo(
    () => [...new Set(estudiantes.map((e) => e.institucion).filter(Boolean))],
    [estudiantes]
  );

  if (cargando) return <Cargando />;

  const lista = estudiantes.filter(
    (e) => (!fInstitucion || e.institucion === fInstitucion) && (!fEstado || e.estado === fEstado)
  );

  function limpiarFiltros() {
    setFInstitucion(""); setFEstado(""); setSeleccionado(null);
  }

  function verBitacorasDe(idEstudiante) {
    navigate("/docente/bitacoras", { state: { estudianteId: idEstudiante } });
  }

  const estudianteSeleccionado = estudiantes.find((e) => e.id_estudiante === seleccionado);
  const bitacorasAprobadasSel = estudianteSeleccionado
    ? bits.filter((b) => b.estudiante_id === seleccionado && b.estado === "aprobada")
    : [];

  return (
    <div className="page">
      <div className="page-title">
        <h1>Mis estudiantes</h1>
        <p>Consulta tus estudiantes asignados y su avance de horas.</p>
      </div>

      <div className="table-container">
        <div className="filtros">
          <div className="campo">
            <label>Institución receptora</label>
            <select value={fInstitucion} onChange={(e) => setFInstitucion(e.target.value)}>
              <option value="">Todas</option>
              {instituciones.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Estado de la práctica</label>
            <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS_PRACTICA.map((e) => <option key={e} value={e}>{textoEstadoPractica(e)}</option>)}
            </select>
          </div>
          <button className="button-secondary" onClick={limpiarFiltros}>Limpiar</button>
        </div>

        <table className="apilable">
          <thead>
            <tr><th>Estudiante</th><th>Institución</th><th>Horas</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id_estudiante} className={seleccionado === e.id_estudiante ? "seleccionada" : ""}>
                <td data-label="Estudiante">{e.estudiante}</td>
                <td data-label="Institución">{e.institucion || "Sin asignar"}</td>
                <td data-label="Horas">{formatearHoras(e.horasCumplidas)} / {e.horas_requeridas || 0}</td>
                <td data-label="Estado">
                  {e.estado ? <Badge estado={textoEstadoPractica(e.estado)} /> : "Sin asignar"}
                </td>
                <td data-label="Acciones">
                  <button className="button-secondary" onClick={() => setSeleccionado(e.id_estudiante)}>Ver avance</button>{" "}
                  <button className="button-secondary" onClick={() => verBitacorasDe(e.id_estudiante)}>Ver bitácoras</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {lista.length === 0 && (
          <div className="vacio">
            {estudiantes.length ? "No hay estudiantes que coincidan con los filtros seleccionados." : "No tienes estudiantes asignados."}
          </div>
        )}
      </div>

      {estudianteSeleccionado && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title">Avance de horas · {estudianteSeleccionado.estudiante}</div>
          <p className="dato-linea">
            Cumplidas: <strong>{formatearHoras(estudianteSeleccionado.horasCumplidas)}</strong> de{" "}
            {estudianteSeleccionado.horas_requeridas || 0} · Pendientes:{" "}
            <strong>{formatearHoras(Math.max(0, (estudianteSeleccionado.horas_requeridas || 0) - estudianteSeleccionado.horasCumplidas))}</strong>{" "}
            · Avance: <strong>{estudianteSeleccionado.porcentaje}%</strong>
          </p>
          <div className="progress" style={{ margin: "10px 0 16px" }}>
            <div className="progress-bar" style={{ width: `${estudianteSeleccionado.porcentaje}%` }} />
          </div>
          {bitacorasAprobadasSel.length ? (
            <table className="apilable">
              <thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th></tr></thead>
              <tbody>
                {bitacorasAprobadasSel.map((b) => (
                  <tr key={b._id}>
                    <td data-label="Fecha">{formatearFecha(b.fecha)}</td>
                    <td data-label="Actividad">{b.titulo}</td>
                    <td data-label="Horas">{formatearHoras(b.horas_registradas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="dato-linea">Aún no hay horas registradas para este estudiante.</p>
          )}
        </div>
      )}
    </div>
  );
}
