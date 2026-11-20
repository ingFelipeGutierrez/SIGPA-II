import { useEffect, useState } from "react";
import { useToast } from "./ToastContext";
import Modal from "./Modal";
import Badge from "./Badge";
import { obtenerEvidenciasDeBitacora } from "../services/evidencias";
import { aprobarBitacora, solicitarCorreccion } from "../services/bitacoras";
import { crearCalificacionBitacora, actualizarCalificacionBitacora } from "../services/practicas";
import { registrarRetroalimentacion } from "../services/retroalimentacion";
import { formatearFecha, formatearHoras, formatearTamano, textoEstadoBitacora, contarPalabras } from "../utils/formato";

/**
 * src/components/ModalRevisionBitacora.jsx
 *
 * Modal de revisión de una bitácora, con las 3 pestañas del prototipo
 * original (docente/docente.js: abrirRevision/vistaDetalle/vistaNota/
 * vistaRetro): Detalle (aprobar / solicitar corrección), Nota (0.0 a 5.0
 * + observaciones) y Retroalimentación (texto libre + historial del
 * estudiante). Lo usan tanto "Bitácoras por revisar" como el acceso
 * directo desde "Inicio".
 *
 * Toda acción de guardado cierra el modal y recarga los datos del panel
 * (via `onGuardado`), igual que `cerrarModal(); await refrescar();` en el
 * prototipo.
 *
 * @param {{
 *   bitacora: object, cerrada: boolean, notaExistente: object|undefined,
 *   retrosEstudiante: object[], tituloPorBitacoraId: Record<string,string>,
 *   docenteId: number, onClose: () => void, onGuardado: () => void,
 * }} props
 */
export default function ModalRevisionBitacora({
  bitacora: b, cerrada, notaExistente, retrosEstudiante, tituloPorBitacoraId, docenteId, onClose, onGuardado,
}) {
  const { mostrarToast } = useToast();
  const [tab, setTab] = useState("detalle");
  const [evidencias, setEvidencias] = useState([]);

  const [cajaCorreccionAbierta, setCajaCorreccionAbierta] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");

  const [notaValor, setNotaValor] = useState(notaExistente?.nota ?? "");
  const [notaObs, setNotaObs] = useState(notaExistente?.observaciones ?? "");
  const [errorNota, setErrorNota] = useState("");
  const [errorObs, setErrorObs] = useState("");

  const [retroTexto, setRetroTexto] = useState("");
  const [errorRetro, setErrorRetro] = useState("");

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerEvidenciasDeBitacora(b._id).then(setEvidencias).catch(() => setEvidencias([]));
  }, [b._id]);

  async function aprobar() {
    setGuardando(true);
    try {
      await aprobarBitacora(b._id);
      onClose();
      await onGuardado();
      mostrarToast("Bitácora aprobada. Las horas se sumaron al avance del estudiante.", "ok");
    } catch {
      mostrarToast("No se pudo aprobar la bitácora.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function enviarCorreccion() {
    if (!motivo.trim()) { setErrorMotivo("Escribe el motivo de la corrección."); return; }
    setErrorMotivo("");
    setGuardando(true);
    try {
      await solicitarCorreccion(b._id, motivo.trim());
      onClose();
      await onGuardado();
      mostrarToast("Solicitud de corrección registrada. El estudiante podrá corregir la bitácora.", "ok");
    } catch {
      mostrarToast("No se pudo registrar la solicitud.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarNota() {
    const num = Number(notaValor);
    if (notaValor === "" || Number.isNaN(num) || num < 0 || num > 5) {
      setErrorNota("Ingresa una nota entre 0.0 y 5.0."); return;
    }
    if (notaObs.length > 500) { setErrorObs("Las observaciones no pueden superar los 500 caracteres."); return; }
    setErrorNota(""); setErrorObs("");
    setGuardando(true);
    try {
      if (notaExistente?.id_calificacion) {
        await actualizarCalificacionBitacora(notaExistente.id_calificacion, { nota: num, observaciones: notaObs || null });
      } else {
        await crearCalificacionBitacora({
          bitacora_id: b._id, id_asignacion: b.id_asignacion, docente_id: docenteId,
          nota: num, observaciones: notaObs || null,
        });
      }
      onClose();
      await onGuardado();
      mostrarToast("Nota registrada correctamente.", "ok");
    } catch {
      mostrarToast("No se pudo registrar la nota.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarRetro() {
    const texto = retroTexto.trim();
    if (!texto) { setErrorRetro("Escribe la retroalimentación antes de guardar."); return; }
    if (contarPalabras(texto) > 200) { setErrorRetro("La retroalimentación no puede superar las 200 palabras."); return; }
    setErrorRetro("");
    setGuardando(true);
    try {
      await registrarRetroalimentacion({ bitacora_id: b._id, estudiante_id: b.estudiante_id, docente_id: docenteId, texto });
      onClose();
      await onGuardado();
      mostrarToast("Retroalimentación registrada correctamente.", "ok");
    } catch {
      mostrarToast("No se pudo registrar la retroalimentación.", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={`Revisión de bitácora · ${b.estudianteNombre} · ${b.titulo}`}
      ancho
      onClose={onClose}
      pie={
        // Pie único: "Cerrar" a la izquierda y, solo en la pestaña Detalle de una
        // bitácora pendiente, las acciones de revisión a su derecha.
        <>
          <button className="button-secondary" data-cerrar="">Cerrar</button>
          {tab === "detalle" && b.estado === "pendiente" && !cerrada && (
            <>
              <button className="button-danger" disabled={guardando} onClick={() => setCajaCorreccionAbierta(true)}>
                Solicitar corrección
              </button>
              <button className="button-primary" disabled={guardando} onClick={aprobar}>Aprobar</button>
            </>
          )}
        </>
      }
    >
      <div className="tabs">
        <button className={tab === "detalle" ? "activa" : ""} onClick={() => setTab("detalle")}>Detalle</button>
        <button className={tab === "nota" ? "activa" : ""} onClick={() => setTab("nota")}>Nota</button>
        <button className={tab === "retro" ? "activa" : ""} onClick={() => setTab("retro")}>Retroalimentación</button>
      </div>

      {tab === "detalle" && (
        <div>
          <p className="dato-linea">
            <strong>Fecha:</strong> {formatearFecha(b.fecha)} · <strong>Horas:</strong> {formatearHoras(b.horas_registradas)}{" "}
            · <strong>Estado:</strong> <Badge estado={textoEstadoBitacora(b.estado)} />
          </p>
          <p className="dato-linea"><strong>Descripción:</strong><br />{b.descripcion}</p>
          {b.estado === "requiere_correccion" && (
            <div className="bloque-rechazo"><strong>Motivo de la corrección:</strong><br />{b.motivo_correccion}</div>
          )}
          <p className="dato-linea"><strong>Evidencias:</strong></p>
          {evidencias.length ? (
            <ul className="lista-archivos">
              {evidencias.map((e) => (
                <li key={e._id}>
                  <span>🔗 {e.url_archivo}<small>{e.formato || "enlace"} · {formatearTamano(e.tamano_bytes)}</small></span>
                  <a className="button-secondary" href={e.url_archivo} target="_blank" rel="noreferrer">Abrir</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dato-linea" style={{ color: "var(--gris-texto)" }}>Sin evidencias adjuntas.</p>
          )}

          {b.estado === "pendiente" && !cerrada ? (
            <>
              {cajaCorreccionAbierta && (
                <div style={{ marginTop: 14 }}>
                  <div className={`form-group ${errorMotivo ? "con-error" : ""}`}>
                    <label>Motivo de la corrección</label>
                    <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                    <div className="campo-error">{errorMotivo}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button className="button-secondary" onClick={() => setCajaCorreccionAbierta(false)}>Cancelar</button>{" "}
                    <button className="button-primary" disabled={guardando} onClick={enviarCorreccion}>Guardar</button>
                  </div>
                </div>
              )}
            </>
          ) : cerrada ? (
            <p className="dato-linea" style={{ color: "var(--gris-texto)", marginTop: 14 }}>
              La práctica ya tiene resultado: la bitácora está en modo consulta.
            </p>
          ) : null}
        </div>
      )}

      {tab === "nota" && (
        (b.estado !== "aprobada" || cerrada) ? (
          <p className="dato-linea">La nota solo se puede registrar cuando la bitácora está aprobada.</p>
        ) : (
          <div>
            <div className={`form-group ${errorNota ? "con-error" : ""}`}>
              <label>Nota (0.0 a 5.0)</label>
              <input type="number" min="0" max="5" step="0.1" value={notaValor} onChange={(e) => setNotaValor(e.target.value)} />
              <div className="campo-error">{errorNota}</div>
            </div>
            <div className={`form-group ${errorObs ? "con-error" : ""}`}>
              <label>Observaciones (opcional)</label>
              <textarea maxLength={600} value={notaObs} onChange={(e) => setNotaObs(e.target.value)} />
              <div className={`contador ${notaObs.length > 500 ? "excedido" : ""}`}>{notaObs.length} / 500</div>
              <div className="campo-error">{errorObs}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <button className="button-primary" disabled={guardando} onClick={guardarNota}>Guardar</button>
            </div>
          </div>
        )
      )}

      {tab === "retro" && (
        <div>
          {cerrada ? (
            <p className="dato-linea" style={{ color: "var(--gris-texto)" }}>
              La práctica ya tiene resultado: no se registran nuevas retroalimentaciones.
            </p>
          ) : (
            <div>
              <div className={`form-group ${errorRetro ? "con-error" : ""}`}>
                <label>Retroalimentación</label>
                <textarea value={retroTexto} onChange={(e) => setRetroTexto(e.target.value)} />
                <div className={`contador ${contarPalabras(retroTexto) > 200 ? "excedido" : ""}`}>
                  {contarPalabras(retroTexto)} / 200 palabras
                </div>
                <div className="campo-error">{errorRetro}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <button className="button-primary" disabled={guardando} onClick={guardarRetro}>Guardar</button>
              </div>
            </div>
          )}
          <h3 style={{ margin: "18px 0 10px" }}>Retroalimentaciones registradas para este estudiante</h3>
          {retrosEstudiante.length ? (
            retrosEstudiante.map((r) => (
              <div className="retro-item" key={r._id}>
                <small>{formatearFecha(r.fecha)} · {tituloPorBitacoraId[r.bitacora_id] || "Bitácora"}</small>
                {r.texto}
              </div>
            ))
          ) : (
            <div className="vacio">Aún no has registrado retroalimentaciones para este estudiante.</div>
          )}
        </div>
      )}
    </Modal>
  );
}
