import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMiPractica } from "../../hooks/useMiPractica";
import { formatearFecha, formatearHoras } from "../../utils/formato";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";

/**
 * src/pages/estudiante/EstudiantePractica.jsx
 * Página "Mi práctica" (CU 1 — Consultar plaza asignada y estado de
 * aprobación): plaza, tipo y nivel, estado y avance de horas, todo en una
 * sola vista. Equivale a #practica / pintarPractica() del prototipo.
 */
export default function EstudiantePractica() {
  const { usuario } = useAuth();
  const { practica: pr, bitacoras: bits, cargando, horasCumplidas, porcentajeHoras } =
    useMiPractica(usuario.id_usuario);
  const [modal, setModal] = useState(null); // { titulo, cuerpo } | null
  const [mostrarDetalleHoras, setMostrarDetalleHoras] = useState(false);

  if (cargando) return <p className="vacio">Cargando…</p>;

  if (!pr) {
    return (
      <div className="page">
        <Cabecera />
        <div className="card vacio">
          Aún no tienes una plaza de práctica asignada. Cuando el director de programa te la asigne, la
          verás aquí.
        </div>
      </div>
    );
  }

  const aprobadas = bits.filter((b) => b.estado === "aprobada");
  const horasPendientes = Math.max(0, pr.horas_requeridas - horasCumplidas);

  return (
    <div className="page">
      <Cabecera />

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">Plaza asignada</div>
          <h3>{pr.institucion}</h3>
          <br />
          <Linea k="Programa" v={pr.grupo_nombre} />
          <Linea k="Docente asesor" v={pr.docente || "Sin asignar"} />
          <Linea k="Director de programa" v={pr.director || "Sin asignar"} />
          <Linea k="Fecha de inicio" v={formatearFecha(pr.fecha_inicio)} />
          <Linea k="Fecha de finalización" v={formatearFecha(pr.fecha_fin)} />
          <br />
          <button
            className="enlace-detalle"
            onClick={() =>
              setModal({
                titulo: pr.institucion,
                cuerpo: (
                  <>
                    <Linea k="Dirección" v={pr.direccion || "No registrada"} />
                    <Linea k="Contacto" v={pr.contacto || "No registrado"} />
                    <Linea k="Tipo de institución" v={pr.institucion_tipo} />
                  </>
                ),
              })
            }
          >
            Ver más detalles
          </button>
        </div>

        <div className="card">
          <div className="section-title">Tipo y nivel de práctica</div>
          <Linea k="Tipo" v={pr.tipo_practica} />
          <Linea k="Nivel" v={`Nivel ${pr.nivel_numero ?? "—"} · ${pr.nivel_practica}`} />
          <p className="dato-linea" style={{ color: "var(--gris-texto)" }}>{pr.tipo_descripcion || ""}</p>
          <br />
          <button
            className="enlace-detalle"
            onClick={() =>
              setModal({
                titulo: `Nivel ${pr.nivel_numero ?? ""} · ${pr.nivel_practica}`,
                cuerpo: <p>{pr.tipo_descripcion || "Sin requisitos adicionales registrados."}</p>,
              })
            }
          >
            Ver requisitos del nivel
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Estado de la práctica</div>
          <Badge estado={pr.estado} />
          {pr.estado === "rechazada" && (
            <>
              <br />
              <button
                className="enlace-detalle"
                onClick={() =>
                  setModal({
                    titulo: "Motivo del rechazo",
                    cuerpo: (
                      <div className="bloque-rechazo" style={{ marginTop: 0 }}>
                        {pr.motivo_rechazo || "No se registraron observaciones."}
                      </div>
                    ),
                  })
                }
              >
                Ver detalle
              </button>
            </>
          )}
        </div>

        <div className="card">
          <div className="section-title">Avance de horas</div>
          {aprobadas.length === 0 ? (
            <>
              <div className="hours-number">0</div>
              <p>de {pr.horas_requeridas} horas requeridas</p>
              <div className="progress"><div className="progress-bar" style={{ width: "0%" }} /></div>
              <p className="dato-linea" style={{ marginTop: 12 }}>Aún no hay horas registradas.</p>
            </>
          ) : (
            <>
              <div className="hours-number">{formatearHoras(horasCumplidas)}</div>
              <p>de {pr.horas_requeridas} horas requeridas</p>
              <div className="progress"><div className="progress-bar" style={{ width: `${porcentajeHoras}%` }} /></div>
              <p className="dato-linea" style={{ marginTop: 12 }}>
                Avance: <strong>{porcentajeHoras}%</strong> · Pendientes: <strong>{formatearHoras(horasPendientes)} h</strong>
              </p>
              <button className="enlace-detalle" onClick={() => setMostrarDetalleHoras((v) => !v)}>
                {mostrarDetalleHoras ? "Ocultar detalle" : "Ver detalle"}
              </button>
            </>
          )}
        </div>
      </div>

      {mostrarDetalleHoras && (
        <div className="table-container" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Horas por bitácora aprobada</h3>
          <table className="apilable">
            <thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th><th>Estado</th></tr></thead>
            <tbody>
              {aprobadas.map((b) => (
                <tr key={b._id}>
                  <td data-label="Fecha">{formatearFecha(b.fecha)}</td>
                  <td data-label="Actividad">{b.titulo}</td>
                  <td data-label="Horas">{formatearHoras(b.horas_registradas)}</td>
                  <td data-label="Estado"><Badge estado={b.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal titulo={modal.titulo} onClose={() => setModal(null)}>
          {modal.cuerpo}
        </Modal>
      )}
    </div>
  );
}

function Cabecera() {
  return (
    <div className="page-title">
      <h1>Mi práctica</h1>
      <p>Consulta en una sola vista tu plaza, el tipo y nivel de práctica, su estado y tu avance de horas.</p>
    </div>
  );
}

function Linea({ k, v }) {
  return <p className="dato-linea"><strong>{k}:</strong> {v}</p>;
}
