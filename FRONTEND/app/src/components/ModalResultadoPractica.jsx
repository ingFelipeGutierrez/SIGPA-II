import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useToast } from "./ToastContext";
import { formatearFecha, formatearHoras, formatearNota } from "../utils/formato";
import { obtenerBitacorasPorAsignacion } from "../services/bitacoras";
import { obtenerCalificacionesPorAsignacion, decidirResultadoPractica } from "../services/practicas";

/**
 * src/components/ModalResultadoPractica.jsx
 *
 * Modal "Resultado de la práctica" (CU 1, pasos 20 a 23 y rama 22a):
 * compartido entre la página "Decidir resultado de la práctica" y el
 * botón "Decidir resultado" de "Estado de las prácticas" (CU 7, rama
 * 5b), para no construir la misma ventana dos veces.
 *
 * Carga sus propios datos (bitácoras y calificaciones de la asignación)
 * al abrirse, igual que "Horas del estudiante" en Supervisión de horas,
 * así que al llamador le basta con pasarle la práctica tal como viene
 * de `obtenerPracticasCompletas` — no necesita traerle la nota promedio
 * ni el conteo de bitácoras de antemano.
 */
export default function ModalResultadoPractica({ practica: p, onClose, onDecidida }) {
  const { mostrarToast } = useToast();
  const [bitacoras, setBitacoras] = useState(null);
  const [notaPromedio, setNotaPromedio] = useState(null);
  const [rechazarAbierto, setRechazarAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      obtenerBitacorasPorAsignacion(p.id_asignacion),
      obtenerCalificacionesPorAsignacion(p.id_asignacion),
    ]).then(([bs, califs]) => {
      if (!vigente) return;
      setBitacoras(bs);
      setNotaPromedio(califs.length ? califs.reduce((s, c) => s + Number(c.nota), 0) / califs.length : null);
    });
    return () => { vigente = false; };
  }, [p.id_asignacion]);

  const conteo = { pendiente: 0, aprobada: 0, requiere_correccion: 0 };
  (bitacoras || []).forEach((b) => { if (conteo[b.estado] !== undefined) conteo[b.estado] += 1; });

  const porcentajeHoras = p.horas_requeridas > 0 ? Math.round((p.horas_cumplidas / p.horas_requeridas) * 100) : 0;
  const horasIncompletas = p.horas_cumplidas < p.horas_requeridas;
  const avisoListo = bitacoras !== null && (horasIncompletas || conteo.pendiente > 0);

  async function decidir(estado, motivoRechazo = null) {
    setGuardando(true);
    try {
      await decidirResultadoPractica(p.id_asignacion, { estado, motivo_rechazo: motivoRechazo });
      mostrarToast(
        estado === "aprobada"
          ? "Práctica aprobada. El estudiante ya puede consultar el resultado."
          : "Práctica rechazada. El estudiante podrá consultar el motivo.",
        "ok"
      );
      onDecidida();
    } catch (e) {
      setError(e.message || "Ocurrió un error al guardar la decisión.");
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
    await decidir("rechazada", motivo.trim());
  }

  return (
    <Modal
      titulo="Resultado de la práctica"
      onClose={onClose}
      pie={
        <>
          <button className="button-secondary" data-cerrar="">Cancelar</button>
          <button className="button-secondary" onClick={alPulsarRechazar} disabled={guardando}>
            Rechazar práctica
          </button>
          <button className="button-primary" onClick={() => decidir("aprobada")} disabled={guardando}>
            {guardando ? "Guardando…" : "Aprobar práctica"}
          </button>
        </>
      }
    >
      {avisoListo && (
        <div className="aviso aviso-ambar">
          ⚠️ {horasIncompletas ? "El estudiante no completó las horas requeridas. " : ""}
          {conteo.pendiente > 0 ? `Tiene ${conteo.pendiente} bitácora(s) pendiente(s) de revisión.` : ""}
        </div>
      )}

      <p className="dato-linea"><strong>Estudiante:</strong> {p.estudiante}</p>
      <p className="dato-linea"><strong>Institución:</strong> {p.institucion || "—"}</p>
      <p className="dato-linea"><strong>Docente asesor:</strong> {p.docente_asesor || "—"}</p>
      <p className="dato-linea">
        <strong>Tipo y nivel:</strong> {p.tipo_practica || "—"} · Nivel {p.nivel_practica || "—"}
      </p>
      <p className="dato-linea">
        <strong>Fechas:</strong> {p.fecha_inicio ? `${formatearFecha(p.fecha_inicio)} a ${formatearFecha(p.fecha_fin)}` : "—"}
      </p>
      <p className="dato-linea">
        <strong>Horas:</strong> {formatearHoras(p.horas_cumplidas)} / {p.horas_requeridas} ({porcentajeHoras}%)
      </p>
      <p className="dato-linea">
        <strong>Bitácoras:</strong>{" "}
        {bitacoras === null
          ? "Cargando…"
          : `${conteo.aprobada} aprobadas · ${conteo.pendiente} pendientes · ${conteo.requiere_correccion} requieren corrección`}
      </p>
      <p className="dato-linea"><strong>Nota promedio:</strong> {formatearNota(notaPromedio)}</p>

      {rechazarAbierto && (
        <div style={{ marginTop: 14 }}>
          <div className={`form-group ${error ? "con-error" : ""}`}>
            <label>Motivo del rechazo</label>
            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="campo-error">{error}</div>
          </div>
        </div>
      )}
      {!rechazarAbierto && error && <div className="campo-error" style={{ display: "block" }}>{error}</div>}
    </Modal>
  );
}