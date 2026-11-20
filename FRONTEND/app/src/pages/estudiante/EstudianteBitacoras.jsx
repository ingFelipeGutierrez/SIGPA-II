import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMiPractica } from "../../hooks/useMiPractica";
import { obtenerActividadesDeGrupo } from "../../services/actividades";
import { obtenerEvidenciasDeBitacora } from "../../services/evidencias";
import { formatearFecha, formatearHoras, formatearTamano, textoEstadoBitacora } from "../../utils/formato";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import Cargando from "../../components/Cargando";

/**
 * src/pages/estudiante/EstudianteBitacoras.jsx
 * Página "Bitácoras" (historial): tabla de entradas registradas, con
 * acceso a "Ver" el detalle (incluye evidencias) y, si el docente pidió
 * una corrección, a "Corregir" esa misma entrada. Equivale a #bitacoras /
 * pintarBitacoras() del prototipo original.
 */
export default function EstudianteBitacoras() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { practica: pr, bitacoras: bits, cargando } = useMiPractica(usuario.id_usuario);
  const [actividades, setActividades] = useState({}); // _id -> título, para mostrar en la tabla
  const [conteoEvidencias, setConteoEvidencias] = useState({}); // bitacora._id -> cantidad
  const [modalBitacora, setModalBitacora] = useState(null);
  const [evidenciasModal, setEvidenciasModal] = useState([]);

  useEffect(() => {
    if (pr?.id_grupo) {
      obtenerActividadesDeGrupo(pr.id_grupo).then((lista) => {
        const mapa = {};
        lista.forEach((a) => { mapa[a._id] = a.titulo; });
        setActividades(mapa);
      }).catch(() => setActividades({}));
    }
  }, [pr]);

  // Cuenta las evidencias de cada bitácora para la columna "Evidencias" de
  // la tabla (el documento de bitácora en Mongo no guarda el conteo, así
  // que se consulta aparte, una vez que se conoce el historial).
  useEffect(() => {
    if (!bits.length) return;
    Promise.all(bits.map((b) => obtenerEvidenciasDeBitacora(b._id).then((e) => [b._id, e.length]).catch(() => [b._id, 0])))
      .then((pares) => setConteoEvidencias(Object.fromEntries(pares)));
  }, [bits]);

  async function abrirVer(b) {
    setModalBitacora(b);
    try { setEvidenciasModal(await obtenerEvidenciasDeBitacora(b._id)); }
    catch { setEvidenciasModal([]); }
  }

  if (cargando) return <Cargando />;

  const enCurso = pr?.estado === "en_curso";
  // "Sin resultado" = el director todavía no decidió aprobada/rechazada:
  // mientras tanto el estudiante puede seguir corrigiendo bitácoras.
  const sinResultado = pr && pr.estado !== "aprobada" && pr.estado !== "rechazada";

  return (
    <div className="page">
      <div className="page-title">
        <h1>Bitácoras</h1>
        <p>Consulta y registra las actividades realizadas durante tu práctica.</p>
      </div>

      <div className="table-container">
        <div style={{ textAlign: "right", marginBottom: 15 }}>
          <button
            className="button-primary"
            disabled={!enCurso}
            onClick={() => navigate("/estudiante/bitacoras/nueva")}
          >
            + Nueva bitácora
          </button>
        </div>

        <table className="apilable">
          <thead>
            <tr>
              <th>Fecha</th><th>Título</th><th>Descripción</th><th>Horas</th>
              <th>Evidencias</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bits.map((b) => (
              <tr key={b._id}>
                <td data-label="Fecha">{formatearFecha(b.fecha)}</td>
                <td data-label="Título">{b.titulo}</td>
                <td data-label="Descripción">{b.descripcion}</td>
                <td data-label="Horas">{formatearHoras(b.horas_registradas)}</td>
                <td data-label="Evidencias">{conteoEvidencias[b._id] ? `📎 ${conteoEvidencias[b._id]}` : "—"}</td>
                <td data-label="Estado"><Badge estado={textoEstadoBitacora(b.estado)} /></td>
                <td data-label="Acciones">
                  <button className="button-secondary" onClick={() => abrirVer(b)}>👁️ Ver</button>{" "}
                  {b.estado === "requiere_correccion" && sinResultado && (
                    <button
                      className="button-primary"
                      onClick={() => navigate(`/estudiante/bitacoras/${b._id}/corregir`)}
                    >
                      ✏️ Corregir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bits.length === 0 && <div className="vacio">Aún no has registrado bitácoras.</div>}
        {pr && !enCurso && (
          <div className="aviso aviso-ambar">⚠️ Podrás registrar bitácoras mientras tu práctica esté en curso.</div>
        )}
      </div>

      {modalBitacora && (
        <Modal titulo={modalBitacora.titulo} onClose={() => setModalBitacora(null)}>
          <p className="dato-linea"><strong>Actividad:</strong> {actividades[modalBitacora.actividad_id] || "—"}</p>
          <p className="dato-linea"><strong>Fecha:</strong> {formatearFecha(modalBitacora.fecha)}</p>
          <p className="dato-linea"><strong>Horas dedicadas:</strong> {formatearHoras(modalBitacora.horas_registradas)}</p>
          <p className="dato-linea"><strong>Estado:</strong> <Badge estado={textoEstadoBitacora(modalBitacora.estado)} /></p>
          <p className="dato-linea"><strong>Descripción:</strong><br />{modalBitacora.descripcion}</p>
          {modalBitacora.estado === "requiere_correccion" && (
            <div className="bloque-rechazo">
              <strong>Motivo de la corrección:</strong><br />{modalBitacora.motivo_correccion}
            </div>
          )}
          <p className="dato-linea"><strong>Evidencias:</strong></p>
          {evidenciasModal.length ? (
            <ul className="lista-archivos">
              {evidenciasModal.map((e) => (
                <li key={e._id}>
                  <span>🔗 <a href={e.url_archivo} target="_blank" rel="noreferrer">{e.url_archivo}</a>
                    <small>{e.formato || "enlace"} · {formatearTamano(e.tamano_bytes)}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dato-linea" style={{ color: "var(--gris-texto)" }}>Sin evidencias adjuntas.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
