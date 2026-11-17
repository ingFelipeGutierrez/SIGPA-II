import { useState } from "react";
import { useInstitucionesDirector } from "../../hooks/useInstitucionesDirector";
import { registrarInstitucion, renovarConvenio } from "../../services/practicas";
import { useToast } from "../../components/ToastContext";
import { formatearFecha, capitalizar, fechaHoy } from "../../utils/formato";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";

/**
 * src/pages/director/DirectorInstituciones.jsx
 * Página "Instituciones receptoras" del panel del Director
 * (CU 3 — Gestionar convenios institucionales): listado de instituciones
 * con su convenio más reciente, registro de instituciones nuevas (con su
 * convenio inicial) y renovación del convenio cuando está vencido o
 * próximo a vencer. Equivale a #instituciones / pintarInstituciones() de
 * director/director.js.
 */
export default function DirectorInstituciones() {
  const { instituciones, cargando, recargar } = useInstitucionesDirector();
  const [formAbierto, setFormAbierto] = useState(false);
  const [institucionAbierta, setInstitucionAbierta] = useState(null); // institución con "Ver convenio" abierto

  if (cargando) return <p className="vacio">Cargando…</p>;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Instituciones receptoras</h1>
        <p>Administra las instituciones y sus convenios.</p>
      </div>

      <div className="table-container">
        <div style={{ textAlign: "right", marginBottom: 15 }}>
          <button className="button-primary" onClick={() => setFormAbierto((v) => !v)}>
            + Registrar institución
          </button>
        </div>

        {formAbierto && (
          <FormInstitucion
            onCancelar={() => setFormAbierto(false)}
            onGuardada={() => {
              setFormAbierto(false);
              recargar();
            }}
          />
        )}

        <div className="tabla-scroll">
          <table className="apilable">
            <thead>
              <tr>
                <th>Institución</th>
                <th>Tipo</th>
                <th>Convenio</th>
                <th>Plazas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {instituciones.map((i) => (
                <tr key={i.id_institucion}>
                  <td data-label="Institución">{i.nombre}</td>
                  <td data-label="Tipo">{capitalizar(i.tipo)}</td>
                  <td data-label="Convenio">
                    {formatearFecha(i.fecha_inicio)} a {formatearFecha(i.fecha_fin)}
                  </td>
                  <td data-label="Plazas">{i.plazasOcupadas} / {i.plazasTotales}</td>
                  <td data-label="Estado"><Badge estado={i.estadoConvenio} /></td>
                  <td data-label="Acciones">
                    <button className="button-secondary" onClick={() => setInstitucionAbierta(i)}>
                      Ver convenio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {instituciones.length === 0 && (
          <div className="vacio">Aún no hay instituciones receptoras registradas.</div>
        )}
      </div>

      {institucionAbierta && (
        <ModalConvenio
          institucion={institucionAbierta}
          onClose={() => setInstitucionAbierta(null)}
          onRenovado={() => {
            setInstitucionAbierta(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}

/** Formulario "Registrar institución" (tarjeta en línea, igual que en el
 *  prototipo): institución + su convenio inicial en un solo paso. */
function FormInstitucion({ onCancelar, onGuardada }) {
  const { mostrarToast } = useToast();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [contacto, setContacto] = useState("");
  const [convenioInicio, setConvenioInicio] = useState("");
  const [convenioFin, setConvenioFin] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!nombre || !tipo || !direccion || !contacto || !convenioInicio || !convenioFin) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (convenioFin <= convenioInicio || convenioFin <= fechaHoy()) {
      setError("La fecha de finalización debe ser posterior a la de inicio y a la fecha de hoy.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      await registrarInstitucion({ nombre, tipo, direccion, contacto, convenioInicio, convenioFin });
      mostrarToast("Institución registrada correctamente.", "ok");
      onGuardada();
    } catch (e) {
      setError(e.message || "Ocurrió un error al registrar la institución.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="form-grid">
        <div className="form-group">
          <label>Nombre de la institución</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Tipo de institución</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Selecciona…</option>
            <option value="Oficial">Oficial</option>
            <option value="Privada">Privada</option>
          </select>
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Contacto</label>
          <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Convenio vigente desde</label>
          <input type="date" value={convenioInicio} onChange={(e) => setConvenioInicio(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Convenio vigente hasta</label>
          <input type="date" value={convenioFin} onChange={(e) => setConvenioFin(e.target.value)} />
        </div>
      </div>
      {error && <div className="campo-error" style={{ display: "block" }}>{error}</div>}
      <div style={{ textAlign: "right" }}>
        <button className="button-secondary" onClick={onCancelar}>Cancelar</button>{" "}
        <button className="button-primary" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar institución"}
        </button>
      </div>
    </div>
  );
}

/** Modal "Convenio institucional": detalle + renovación cuando el
 *  convenio está vencido o próximo a vencer. El botón "Renovar
 *  convenio" primero revela el campo de fecha y, al pulsarse de nuevo
 *  con una fecha elegida, envía la renovación — igual que `renovar()`
 *  en el prototipo original. */
function ModalConvenio({ institucion: i, onClose, onRenovado }) {
  const { mostrarToast } = useToast();
  const [renovarAbierto, setRenovarAbierto] = useState(false);
  const [nuevaFin, setNuevaFin] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function alPulsarRenovar() {
    if (!renovarAbierto) {
      setRenovarAbierto(true);
      return;
    }
    if (!nuevaFin) {
      setError("Selecciona la nueva fecha de finalización.");
      return;
    }
    if (nuevaFin <= i.fecha_fin) {
      setError("La nueva fecha debe ser posterior a la fecha de finalización actual.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      await renovarConvenio(i.id_institucion, nuevaFin);
      mostrarToast("Convenio renovado correctamente.", "ok");
      onRenovado();
    } catch {
      setError("La nueva fecha debe ser posterior a la fecha de finalización actual.");
    } finally {
      setGuardando(false);
    }
  }

  const alerta =
    i.estadoConvenio === "Vencido" ? (
      <div className="aviso aviso-rojo">
        ⛔ El convenio venció el {formatearFecha(i.fecha_fin)} y no puede respaldar nuevas plazas hasta su
        renovación.
      </div>
    ) : i.estadoConvenio === "Próximo a vencer" ? (
      <div className="aviso aviso-ambar">
        ⚠️ El convenio vence en {i.diasRestantes} días. Se recomienda iniciar el proceso de renovación.
      </div>
    ) : null;

  return (
    <Modal
      titulo="Convenio institucional"
      onClose={onClose}
      pie={
        <>
          <button className="button-secondary" data-cerrar="">Cerrar</button>
          {i.estadoConvenio !== "Vigente" && (
            <button className="button-primary" onClick={alPulsarRenovar} disabled={guardando}>
              {guardando ? "Guardando…" : "Renovar convenio"}
            </button>
          )}
        </>
      }
    >
      {alerta}
      <p className="dato-linea"><strong>Institución:</strong> {i.nombre}</p>
      <p className="dato-linea"><strong>Tipo:</strong> {capitalizar(i.tipo)}</p>
      <p className="dato-linea"><strong>Dirección:</strong> {i.direccion}</p>
      <p className="dato-linea"><strong>Contacto:</strong> {i.contacto}</p>
      <p className="dato-linea"><strong>Inicio:</strong> {formatearFecha(i.fecha_inicio)}</p>
      <p className="dato-linea"><strong>Finalización:</strong> {formatearFecha(i.fecha_fin)}</p>
      <p className="dato-linea"><strong>Días restantes:</strong> {i.diasRestantes ?? "—"}</p>
      <p className="dato-linea"><strong>Estado:</strong> <Badge estado={i.estadoConvenio} /></p>

      {renovarAbierto && (
        <div style={{ marginTop: 14 }}>
          <div className={`form-group ${error ? "con-error" : ""}`}>
            <label>Nueva fecha de finalización</label>
            <input type="date" value={nuevaFin} onChange={(e) => setNuevaFin(e.target.value)} />
            <div className="campo-error">{error}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}