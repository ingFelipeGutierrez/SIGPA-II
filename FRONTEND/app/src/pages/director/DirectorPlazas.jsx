import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePlazasDirector } from "../../hooks/usePlazasDirector";
import { registrarPlaza, actualizarPlaza } from "../../services/practicas";
import { useToast } from "../../components/ToastContext";
import { capitalizar, formatearFecha, estadoConvenio, diasRestantesConvenio } from "../../utils/formato";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import Cargando from "../../components/Cargando";

const JORNADAS = ["MAÑANA", "TARDE", "ÚNICA"];
const ESTADOS = ["pendiente", "aprobada", "rechazada"];

/**
 * src/pages/director/DirectorPlazas.jsx
 * Página "Plazas de práctica" (CU 2 — Registrar Plaza de Práctica):
 * listado filtrable por estado, registro de una plaza nueva y, apenas
 * se guarda, el modal "Revisión de plaza" para aprobarla, rechazarla o
 * decidir después. Equivale a #plazas / pintarPlazas() de
 * director/director.js.
 */
export default function DirectorPlazas() {
  const { plazas, instituciones, cargando, recargar } = usePlazasDirector();
  // El Inicio del Director puede abrir esta página ya filtrada (pendientes / aprobadas).
  const location = useLocation();
  const [fEstado, setFEstado] = useState(location.state?.estado || "");
  const [formAbierto, setFormAbierto] = useState(false);
  const [plazaEnRevision, setPlazaEnRevision] = useState(null);
  const { mostrarToast } = useToast();

  const institucionPorId = useMemo(() => {
    const mapa = {};
    instituciones.forEach((i) => { mapa[i.id_institucion] = i; });
    return mapa;
  }, [instituciones]);

  if (cargando) return <Cargando />;

  const lista = fEstado ? plazas.filter((p) => p.estado === fEstado) : plazas;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Plazas de práctica</h1>
        <p>Registra y decide las plazas ofrecidas por las instituciones receptoras.</p>
      </div>

      <div className="table-container">
        <div className="filtros">
          <div className="campo">
            <label>Estado</label>
            <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{capitalizar(e)}</option>)}
            </select>
          </div>
          <button className="button-primary" style={{ marginLeft: "auto" }} onClick={() => {
            // Igual que el prototipo: sin instituciones no se puede registrar una plaza.
            if (!formAbierto && instituciones.length === 0) {
              mostrarToast("Primero registra una institución receptora con su convenio.", "error");
              return;
            }
            setFormAbierto((v) => !v);
          }}>
            + Registrar plaza
          </button>
        </div>

        {formAbierto && (
          <FormPlaza
            instituciones={instituciones}
            onCancelar={() => setFormAbierto(false)}
            onRegistrada={(plazaCreada) => {
              setFormAbierto(false);
              recargar();
              const inst = institucionPorId[plazaCreada.institucion_id];
              setPlazaEnRevision({
                ...plazaCreada,
                institucion_nombre: inst?.nombre || "—",
                convenio_fecha_inicio: inst?.fecha_inicio || null,
                convenio_fecha_fin: inst?.fecha_fin || null,
                institucion_direccion: inst?.direccion || null,
                institucion_contacto: inst?.contacto || null,
                institucion_tipo: inst?.tipo || null,
                estadoConvenio: inst ? estadoConvenio(inst.fecha_fin) : "Sin convenio",
                diasRestantesConvenio: inst ? diasRestantesConvenio(inst.fecha_fin) : null,
                ocupadas: 0,
              });
            }}
          />
        )}

        <div className="tabla-scroll">
          <table className="apilable">
            <thead>
              <tr>
                <th>Institución</th><th>Jornada</th><th>Cupos</th><th>Convenio</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id_plaza}>
                  <td data-label="Institución">{p.institucion_nombre}</td>
                  <td data-label="Jornada">{capitalizar(p.jornada)}</td>
                  <td data-label="Cupos">{p.ocupadas} / {p.capacidad}</td>
                  <td data-label="Convenio"><Badge estado={p.estadoConvenio} /></td>
                  <td data-label="Estado"><Badge estado={capitalizar(p.estado)} /></td>
                  <td data-label="Acciones">
                    <button className="button-secondary" onClick={() => setPlazaEnRevision(p)}>
                      {p.estado === "pendiente" ? "Revisar" : "Ver detalle"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lista.length === 0 && (
          <div className="vacio">No hay plazas que coincidan con el filtro seleccionado.</div>
        )}
      </div>

      {plazaEnRevision && (
        <ModalRevisionPlaza
          plaza={plazaEnRevision}
          onClose={() => setPlazaEnRevision(null)}
          onDecidida={() => {
            setPlazaEnRevision(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}

/** Formulario "Registrar plaza": institución, su convenio asociado
 *  (solo lectura, se completa solo al elegir la institución), cupos,
 *  jornada y una descripción opcional de las funciones. */
function FormPlaza({ instituciones, onCancelar, onRegistrada }) {
  const [institucionId, setInstitucionId] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [jornada, setJornada] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const institucion = instituciones.find((i) => String(i.id_institucion) === String(institucionId));

  async function guardar() {
    if (!institucionId || !capacidad || !jornada) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (Number(capacidad) <= 0) {
      setError("Los cupos deben ser un número mayor a cero.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      const plazaCreada = await registrarPlaza({
        institucion_id: Number(institucionId),
        capacidad: Number(capacidad),
        jornada,
        descripcion: descripcion || null,
      });
      onRegistrada(plazaCreada);
    } catch (e) {
      setError(e.message || "Ocurrió un error al registrar la plaza.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="form-grid">
        <div className="form-group">
          <label>Institución receptora</label>
          <select value={institucionId} onChange={(e) => setInstitucionId(e.target.value)}>
            <option value="">Selecciona…</option>
            {instituciones.map((i) => (
              <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Convenio asociado</label>
          <input
            type="text"
            readOnly
            placeholder="Selecciona una institución"
            value={
              institucion
                ? `${formatearFecha(institucion.fecha_inicio)} a ${formatearFecha(institucion.fecha_fin)} (${estadoConvenio(institucion.fecha_fin)})`
                : ""
            }
          />
        </div>
        <div className="form-group">
          <label>Cupos</label>
          <input type="number" min="1" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Jornada</label>
          <select value={jornada} onChange={(e) => setJornada(e.target.value)}>
            <option value="">Selecciona…</option>
            {JORNADAS.map((j) => <option key={j} value={j}>{capitalizar(j)}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label>Descripción de las funciones (opcional)</label>
          <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
      </div>
      {error && <div className="campo-error" style={{ display: "block" }}>{error}</div>}
      <div style={{ textAlign: "right" }}>
        <button className="button-secondary" onClick={onCancelar}>Cancelar</button>{" "}
        <button className="button-primary" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar plaza"}
        </button>
      </div>
    </div>
  );
}

/** Modal "Revisión de plaza": Aprobar / Rechazar / Decidir después.
 *  Rechazar revela un cuadro de motivo (mismo patrón de dos clics que
 *  "Renovar convenio" en Instituciones receptoras). Aprobar se bloquea
 *  si el convenio de la institución está vencido. */
function ModalRevisionPlaza({ plaza: p, onClose, onDecidida }) {
  const { mostrarToast } = useToast();
  const [rechazarAbierto, setRechazarAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const convenioVencido = p.estadoConvenio === "Vencido";
  const soloLectura = p.estado !== "pendiente";

  async function aprobar() {
    setGuardando(true);
    try {
      await actualizarPlaza(p.id_plaza, { estado: "aprobada", motivo_rechazo: null });
      mostrarToast("Plaza aprobada. Ya está disponible para asignar estudiantes.", "ok");
      onDecidida();
    } catch (e) {
      mostrarToast(e.message || "Ocurrió un error al aprobar la plaza.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function alPulsarRechazar() {
    if (!rechazarAbierto) {
      setRechazarAbierto(true);
      return;
    }
    if (!motivo.trim()) {
      setError("Escribe el motivo del rechazo.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      await actualizarPlaza(p.id_plaza, { estado: "rechazada", motivo_rechazo: motivo.trim() });
      mostrarToast("Plaza rechazada. Se registró el motivo.", "ok");
      onDecidida();
    } catch (e) {
      setError(e.message || "Ocurrió un error al rechazar la plaza.");
    } finally {
      setGuardando(false);
    }
  }

  const alerta = convenioVencido ? (
    <div className="aviso aviso-rojo">
      ⛔ El convenio de la institución está vencido. No puedes aprobar la plaza hasta renovarlo.{" "}
      <Link to="/director/instituciones" onClick={onClose} className="enlace-accion">Renovar convenio</Link>
    </div>
  ) : p.estadoConvenio === "Próximo a vencer" ? (
    <div className="aviso aviso-ambar">
      ⚠️ El convenio vence el {formatearFecha(p.convenio_fecha_fin)}.
    </div>
  ) : null;

  return (
    <Modal
      titulo="Revisión de plaza"
      onClose={onClose}
      pie={
        soloLectura ? (
          <button className="button-secondary" data-cerrar="">Cerrar</button>
        ) : (
          <>
            <button className="button-secondary" data-cerrar="">Decidir después</button>
            <button className="button-danger" onClick={alPulsarRechazar} disabled={guardando}>
              Rechazar plaza
            </button>
            <button className="button-primary" onClick={aprobar} disabled={guardando || convenioVencido}>
              {guardando ? "Guardando…" : "Aprobar plaza"}
            </button>
          </>
        )
      }
    >
      {alerta}
      <p className="dato-linea"><strong>Institución:</strong> {p.institucion_nombre}</p>
      <p className="dato-linea"><strong>Jornada:</strong> {capitalizar(p.jornada)}</p>
      <p className="dato-linea"><strong>Cupos:</strong> {p.capacidad}</p>
      <p className="dato-linea">
        <strong>Convenio:</strong> {formatearFecha(p.convenio_fecha_inicio)} a {formatearFecha(p.convenio_fecha_fin)}
      </p>
      <p className="dato-linea"><strong>Dirección:</strong> {p.institucion_direccion || "—"}</p>
      <p className="dato-linea"><strong>Contacto:</strong> {p.institucion_contacto || "—"}</p>
      <p className="dato-linea"><strong>Tipo:</strong> {capitalizar(p.institucion_tipo) || "—"}</p>
      {p.descripcion && (
        <p className="dato-linea"><strong>Funciones:</strong><br />{p.descripcion}</p>
      )}
      {p.estado === "rechazada" && p.motivo_rechazo && (
        <div className="bloque-rechazo"><strong>Motivo:</strong> {p.motivo_rechazo}</div>
      )}

      {rechazarAbierto && (
        <div style={{ marginTop: 14 }}>
          <div className={`form-group ${error ? "con-error" : ""}`}>
            <label>Motivo del rechazo</label>
            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="campo-error">{error}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}