import { useMemo, useState } from "react";
import { usePracticasDirector } from "../../hooks/usePracticasDirector";
import { formatearFecha, formatearHoras, textoEstadoPractica } from "../../utils/formato";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import ModalResultadoPractica from "../../components/ModalResultadoPractica";

const ESTADOS = ["pendiente", "en_curso", "finalizada", "aprobada", "rechazada"];

/**
 * src/pages/director/DirectorEstado.jsx
 * Página "Estado de las prácticas" (CU 7 — Consultar Estado General de
 * las Prácticas): filtros por institución y docente asesor, tarjetas
 * por estado (clicables, "Todas" por defecto) y la tabla con todas las
 * prácticas. Equivale a #estado / pintarEstado() de director/director.js.
 *
 * La acción "Decidir resultado" de las prácticas "Finalizada" (rama 5b,
 * que remite al paso 21 de "Gestionar Prácticas") abre el mismo modal
 * compartido que usa la página "Decidir resultado de la práctica", para
 * no duplicar la ventana "Resultado de la práctica" en dos lugares.
 */
export default function DirectorEstado() {
  const { practicas, cargando, recargar } = usePracticasDirector();
  const [fInstitucion, setFInstitucion] = useState("");
  const [fDocente, setFDocente] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("Todas");
  const [practicaAbierta, setPracticaAbierta] = useState(null);
  const [practicaPorDecidir, setPracticaPorDecidir] = useState(null);

  const instituciones = useMemo(
    () => [...new Set(practicas.map((p) => p.institucion).filter(Boolean))],
    [practicas]
  );
  const docentes = useMemo(
    () => [...new Set(practicas.map((p) => p.docente_asesor).filter(Boolean))],
    [practicas]
  );

  if (cargando) return <p className="vacio">Cargando…</p>;

  if (practicas.length === 0) {
    return (
      <div className="page">
        <Cabecera />
        <div className="card vacio">No hay información disponible para consultar.</div>
      </div>
    );
  }

  const filtradas = practicas.filter(
    (p) =>
      (!fInstitucion || p.institucion === fInstitucion) &&
      (!fDocente || p.docente_asesor === fDocente)
  );
  const lista = estadoSeleccionado === "Todas" ? filtradas : filtradas.filter((p) => p.estado === estadoSeleccionado);

  function limpiar() {
    setFInstitucion(""); setFDocente(""); setEstadoSeleccionado("Todas");
  }

  return (
    <div className="page">
      <Cabecera />

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
            <label>Docente asesor</label>
            <select value={fDocente} onChange={(e) => setFDocente(e.target.value)}>
              <option value="">Todos</option>
              {docentes.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="button-secondary" onClick={limpiar}>Limpiar</button>
        </div>

        <div className="cards" style={{ marginBottom: 20 }}>
          {["Todas", ...ESTADOS].map((e) => {
            const n = e === "Todas" ? filtradas.length : filtradas.filter((p) => p.estado === e).length;
            const seleccionada = e === estadoSeleccionado;
            return (
              <div
                key={e}
                className="card stat-card tarjeta-accion"
                style={seleccionada ? { boxShadow: "0 2px 14px rgba(23,63,120,0.15)", borderTopWidth: 4 } : undefined}
                onClick={() => setEstadoSeleccionado(e)}
              >
                <div className="stat-title">{e === "Todas" ? "Todas" : textoEstadoPractica(e)}</div>
                <div className="stat-number">{n}</div>
              </div>
            );
          })}
        </div>

        <div className="tabla-scroll">
          <table className="apilable">
            <thead>
              <tr>
                <th>Estudiante</th><th>Institución</th><th>Docente</th><th>Grupo</th>
                <th>Fechas</th><th>Horas</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id_asignacion}>
                  <td data-label="Estudiante">{p.estudiante}</td>
                  <td data-label="Institución">{p.institucion || "—"}</td>
                  <td data-label="Docente">{p.docente_asesor || "—"}</td>
                  <td data-label="Grupo">{p.grupo_nombre || "—"}</td>
                  <td data-label="Fechas">
                    {p.fecha_inicio ? `${formatearFecha(p.fecha_inicio)} a ${formatearFecha(p.fecha_fin)}` : "—"}
                  </td>
                  <td data-label="Horas">{formatearHoras(p.horas_cumplidas)} / {p.horas_requeridas}</td>
                  <td data-label="Estado"><Badge estado={textoEstadoPractica(p.estado)} /></td>
                  <td data-label="Acciones">
                    <button className="button-secondary" onClick={() => setPracticaAbierta(p)}>Ver detalle</button>{" "}
                    {p.estado === "finalizada" && (
                      <button className="button-secondary" onClick={() => setPracticaPorDecidir(p)}>
                        Decidir resultado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lista.length === 0 && (
          <div className="vacio">No hay prácticas que coincidan con los filtros seleccionados.</div>
        )}
      </div>

      {practicaAbierta && (
        <ModalDetallePractica practica={practicaAbierta} onClose={() => setPracticaAbierta(null)} />
      )}

      {practicaPorDecidir && (
        <ModalResultadoPractica
          practica={practicaPorDecidir}
          onClose={() => setPracticaPorDecidir(null)}
          onDecidida={() => {
            setPracticaPorDecidir(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}

function Cabecera() {
  return (
    <div className="page-title">
      <h1>Estado de las prácticas</h1>
      <p>Consulta el panorama de todas las prácticas del programa.</p>
    </div>
  );
}

/** Modal "Detalle de la práctica": toda la información de una fila, sin
 *  acciones de edición (CU 7 es de solo lectura). */
function ModalDetallePractica({ practica: p, onClose }) {
  return (
    <Modal titulo="Detalle de la práctica" onClose={onClose}>
      <p className="dato-linea"><strong>Estudiante:</strong> {p.estudiante}</p>
      <p className="dato-linea"><strong>Programa:</strong> {p.programa || "—"}</p>
      <p className="dato-linea"><strong>Institución:</strong> {p.institucion || "—"}</p>
      <p className="dato-linea"><strong>Jornada:</strong> {p.jornada || "—"}</p>
      <p className="dato-linea"><strong>Docente asesor:</strong> {p.docente_asesor || "—"}</p>
      <p className="dato-linea"><strong>Grupo:</strong> {p.grupo_nombre || "—"}</p>
      <p className="dato-linea">
        <strong>Tipo y nivel:</strong> {p.tipo_practica || "—"} · Nivel {p.nivel_practica || "—"}
      </p>
      <p className="dato-linea">
        <strong>Fechas:</strong> {p.fecha_inicio ? `${formatearFecha(p.fecha_inicio)} a ${formatearFecha(p.fecha_fin)}` : "—"}
      </p>
      <p className="dato-linea"><strong>Horas:</strong> {formatearHoras(p.horas_cumplidas)} / {p.horas_requeridas}</p>
      <p className="dato-linea"><strong>Estado:</strong> <Badge estado={textoEstadoPractica(p.estado)} /></p>
      {p.estado === "rechazada" && p.motivo_rechazo && (
        <div className="bloque-rechazo"><strong>Motivo:</strong> {p.motivo_rechazo}</div>
      )}
    </Modal>
  );
}