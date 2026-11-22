import { useMemo, useRef, useState } from "react";
import { useAdminSolicitudes } from "../../hooks/useAdminSolicitudes";
import { useAparecer } from "../../hooks/useAparecer";
import { aprobarSolicitud, rechazarSolicitud } from "../../services/solicitudes";
import { useToast } from "../../components/ToastContext";
import { formatearFecha } from "../../utils/formato";
import { textoRol, textoEstadoSolicitud, textoDatosRol } from "../../utils/roles";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import Cargando from "../../components/Cargando";

const FILTROS = [
  { valor: "PENDIENTE", etiqueta: "Pendientes" },
  { valor: "APROBADA", etiqueta: "Aprobadas" },
  { valor: "RECHAZADA", etiqueta: "Rechazadas" },
  { valor: "TODAS", etiqueta: "Todas" },
];

/**
 * src/pages/admin/AdminSolicitudes.jsx
 * Página "Solicitudes de registro" del Super Admin: quienes entran con
 * Google y no tienen cuenta piden acceso con un rol; aquí se aprueban
 * (el backend crea el usuario con su rol) o se rechazan con un motivo.
 * Por defecto muestra las pendientes.
 */
export default function AdminSolicitudes() {
  const { solicitudes, cargando, error, recargar } = useAdminSolicitudes();
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [modal, setModal] = useState(null); // { tipo: "aprobar" | "rechazar", solicitud }
  const tablaRef = useRef(null);

  const conteos = useMemo(() => {
    const c = { TODAS: solicitudes.length, PENDIENTE: 0, APROBADA: 0, RECHAZADA: 0 };
    solicitudes.forEach((s) => {
      c[s.estado] = (c[s.estado] || 0) + 1;
    });
    return c;
  }, [solicitudes]);

  const visibles = useMemo(
    () => (filtro === "TODAS" ? solicitudes : solicitudes.filter((s) => s.estado === filtro)),
    [solicitudes, filtro]
  );

  useAparecer(tablaRef, "tbody tr", `${filtro}-${visibles.length}`);

  if (cargando) return <Cargando />;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Solicitudes de registro</h1>
        <p>Aprueba o rechaza las solicitudes de acceso de estudiantes y docentes.</p>
      </div>

      <div className="table-container" ref={tablaRef}>
        <div className="filtros">
          <div className="campo">
            <label htmlFor="filtro-estado">Estado</label>
            <select id="filtro-estado" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              {FILTROS.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.etiqueta} ({conteos[f.valor] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="campo-error" style={{ display: "block", marginBottom: 12 }}>{error}</div>}

        <div className="tabla-scroll">
          <table className="apilable">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Rol solicitado</th>
                <th>Datos del rol</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((s) => (
                <tr key={s.id_solicitud}>
                  <td data-label="Solicitante">
                    {s.nombre} {s.apellido}
                    <div className="dato-secundario">{s.email}</div>
                  </td>
                  <td data-label="Rol solicitado">{textoRol(s.rol_solicitado)}</td>
                  <td data-label="Datos del rol">{textoDatosRol(s.rol_solicitado, s.datos_rol)}</td>
                  <td data-label="Fecha">{formatearFecha(s.fecha_solicitud)}</td>
                  <td data-label="Estado">
                    <Badge estado={textoEstadoSolicitud(s.estado)} />
                    {s.estado === "RECHAZADA" && s.motivo_rechazo && (
                      <div className="dato-secundario">{s.motivo_rechazo}</div>
                    )}
                  </td>
                  <td data-label="Acciones">
                    {s.estado === "PENDIENTE" ? (
                      <>
                        <button className="button-primary" onClick={() => setModal({ tipo: "aprobar", solicitud: s })}>
                          Aprobar
                        </button>{" "}
                        <button className="button-secondary" onClick={() => setModal({ tipo: "rechazar", solicitud: s })}>
                          Rechazar
                        </button>
                      </>
                    ) : (
                      <span className="dato-secundario">{formatearFecha(s.fecha_respuesta)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibles.length === 0 && (
          <div className="vacio">
            {filtro === "PENDIENTE" ? "No hay solicitudes pendientes." : "No hay solicitudes para mostrar."}
          </div>
        )}
      </div>

      {modal?.tipo === "aprobar" && (
        <ModalAprobar
          solicitud={modal.solicitud}
          onClose={() => setModal(null)}
          onListo={() => {
            setModal(null);
            recargar();
          }}
        />
      )}
      {modal?.tipo === "rechazar" && (
        <ModalRechazar
          solicitud={modal.solicitud}
          onClose={() => setModal(null)}
          onListo={() => {
            setModal(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}

/** Confirmación para aprobar: crea la cuenta de la persona con el rol que pidió. */
function ModalAprobar({ solicitud: s, onClose, onListo }) {
  const { mostrarToast } = useToast();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function aprobar() {
    setGuardando(true);
    setError("");
    try {
      await aprobarSolicitud(s.id_solicitud);
      mostrarToast("Solicitud aprobada. El usuario ya puede ingresar.", "ok");
      onListo();
    } catch (e) {
      setError(e.message || "No se pudo aprobar la solicitud. Intenta nuevamente.");
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo="Aprobar solicitud"
      onClose={onClose}
      pie={
        <>
          <button className="button-secondary" data-cerrar="">Cancelar</button>
          <button className="button-primary" onClick={aprobar} disabled={guardando}>
            {guardando ? "Aprobando…" : "Aprobar solicitud"}
          </button>
        </>
      }
    >
      <p>
        Se creará la cuenta de <strong>{s.nombre} {s.apellido}</strong> como{" "}
        <strong>{textoRol(s.rol_solicitado).toLowerCase()}</strong>. Podrá ingresar con su cuenta de Google{" "}
        <strong>{s.email}</strong>.
      </p>
      {error && <div className="campo-error" style={{ display: "block", marginTop: 12 }}>{error}</div>}
    </Modal>
  );
}

/** Rechazo con motivo obligatorio (la base de datos no permite rechazar sin motivo). */
function ModalRechazar({ solicitud: s, onClose, onListo }) {
  const { mostrarToast } = useToast();
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
  const [errorServidor, setErrorServidor] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function rechazar() {
    if (!motivo.trim()) {
      setErrorMotivo("Escribe el motivo del rechazo.");
      return;
    }
    setErrorMotivo("");
    setErrorServidor("");
    setGuardando(true);
    try {
      await rechazarSolicitud(s.id_solicitud, motivo.trim());
      mostrarToast("Solicitud rechazada.", "info");
      onListo();
    } catch (e) {
      setErrorServidor(e.message || "No se pudo rechazar la solicitud. Intenta nuevamente.");
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo="Rechazar solicitud"
      onClose={onClose}
      pie={
        <>
          <button className="button-secondary" data-cerrar="">Cancelar</button>
          <button className="button-danger" onClick={rechazar} disabled={guardando}>
            {guardando ? "Rechazando…" : "Rechazar solicitud"}
          </button>
        </>
      }
    >
      <p style={{ marginBottom: 14 }}>
        Vas a rechazar la solicitud de <strong>{s.nombre} {s.apellido}</strong> ({s.email}).
      </p>
      <div className={`form-group ${errorMotivo ? "con-error" : ""}`}>
        <label htmlFor="motivo-rechazo">Motivo del rechazo</label>
        <textarea
          id="motivo-rechazo"
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          style={{ width: "100%", padding: 9, border: "1px solid #d6dce5", borderRadius: 5, fontFamily: "inherit", fontSize: 14 }}
        />
        <div className="campo-error">{errorMotivo}</div>
      </div>
      {errorServidor && <div className="campo-error" style={{ display: "block", marginTop: 12 }}>{errorServidor}</div>}
    </Modal>
  );
}
