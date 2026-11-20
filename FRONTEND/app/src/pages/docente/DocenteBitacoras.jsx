import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDatosDocente } from "../../hooks/useDatosDocente";
import { obtenerEvidenciasDeBitacora } from "../../services/evidencias";
import { obtenerRetroalimentacionEstudiante } from "../../services/retroalimentacion";
import { formatearFecha, formatearHoras, formatearNota, textoEstadoBitacora } from "../../utils/formato";
import Badge from "../../components/Badge";
import ModalRevisionBitacora from "../../components/ModalRevisionBitacora";
import Cargando from "../../components/Cargando";

// Mismo orden de prioridad que ORDEN_ESTADO en el prototipo original:
// lo pendiente primero, luego lo que requiere corrección, y al final lo
// ya aprobado; dentro de cada grupo, lo más reciente primero.
const ORDEN_ESTADO = { pendiente: 0, requiere_correccion: 1, aprobada: 2 };

/**
 * src/pages/docente/DocenteBitacoras.jsx
 * Página "Bitácoras por revisar" (CU 2, 3 y 4): tabla filtrable de todas
 * las bitácoras de los estudiantes a cargo, con el modal de revisión de
 * 3 pestañas. Equivale a #bitacoras / pintarRevisar() de docente.js.
 *
 * Puede abrirse ya filtrada o con un modal abierto de entrada, cuando se
 * navega aquí desde "Mis estudiantes" (Ver bitácoras) o desde "Inicio"
 * (clic en una bitácora de "Últimas bitácoras recibidas") — ver
 * `location.state` más abajo.
 */
export default function DocenteBitacoras() {
  const { usuario } = useAuth();
  const location = useLocation();
  const { estudiantes, bitacoras: bits, notaPorBitacora, cargando, recargar } = useDatosDocente(usuario.id_usuario);

  const [fEstudiante, setFEstudiante] = useState(location.state?.estudianteId ? String(location.state.estudianteId) : "");
  const [fEstado, setFEstado] = useState("");
  const [conteoEvidencias, setConteoEvidencias] = useState({});
  const [bitacoraAbierta, setBitacoraAbierta] = useState(null);
  const [retrosPorEstudiante, setRetrosPorEstudiante] = useState({});

  // Evidencias: solo se necesita el conteo para la columna "Evid." de la tabla.
  useEffect(() => {
    if (!bits.length) return;
    Promise.all(bits.map((b) => obtenerEvidenciasDeBitacora(b._id).then((e) => [b._id, e.length]).catch(() => [b._id, 0])))
      .then((pares) => setConteoEvidencias(Object.fromEntries(pares)));
  }, [bits]);

  // Si se llegó desde "Últimas bitácoras recibidas" (Inicio), abre el
  // modal de esa bitácora en cuanto los datos terminan de cargar.
  useEffect(() => {
    if (cargando || !location.state?.abrirId) return;
    const b = bits.find((x) => x._id === location.state.abrirId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abre el modal una sola vez cuando llega el estado de navegación "abrirId" (ver DocenteInicio), no en cada render
    if (b) setBitacoraAbierta(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando]);

  const tituloPorBitacoraId = useMemo(
    () => Object.fromEntries(bits.map((b) => [b._id, b.titulo])),
    [bits]
  );

  async function abrirRevision(b) {
    setBitacoraAbierta(b);
    if (!retrosPorEstudiante[b.estudiante_id]) {
      try {
        const retros = await obtenerRetroalimentacionEstudiante(b.estudiante_id);
        setRetrosPorEstudiante((prev) => ({ ...prev, [b.estudiante_id]: retros }));
      } catch {
        setRetrosPorEstudiante((prev) => ({ ...prev, [b.estudiante_id]: [] }));
      }
    }
  }

  if (cargando) return <Cargando />;

  let lista = bits;
  if (fEstudiante) lista = lista.filter((b) => String(b.estudiante_id) === fEstudiante);
  if (fEstado) lista = lista.filter((b) => b.estado === fEstado);
  lista = [...lista].sort((a, b) => {
    const oa = ORDEN_ESTADO[a.estado] ?? 3;
    const ob = ORDEN_ESTADO[b.estado] ?? 3;
    if (oa !== ob) return oa - ob;
    return a.fecha < b.fecha ? 1 : -1;
  });

  const estudianteDe = (idEstudiante) => estudiantes.find((e) => e.id_estudiante === idEstudiante);
  const cerradaPara = (idEstudiante) => {
    const e = estudianteDe(idEstudiante);
    return e?.estado === "aprobada" || e?.estado === "rechazada";
  };

  return (
    <div className="page">
      <div className="page-title">
        <h1>Bitácoras por revisar</h1>
        <p>Revisa, aprueba, califica y retroalimenta las bitácoras de tus estudiantes.</p>
      </div>

      <div className="table-container">
        <div className="filtros">
          <div className="campo">
            <label>Estudiante</label>
            <select value={fEstudiante} onChange={(e) => setFEstudiante(e.target.value)}>
              <option value="">Todos</option>
              {estudiantes.map((e) => (
                <option key={e.id_estudiante} value={e.id_estudiante}>{e.estudiante}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Estado</label>
            <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="requiere_correccion">Requiere corrección</option>
            </select>
          </div>
          <button className="button-secondary" onClick={() => { setFEstudiante(""); setFEstado(""); }}>Limpiar</button>
        </div>

        <div className="tabla-scroll">
          <table className="apilable">
            <thead>
              <tr>
                <th>Estudiante</th><th>Fecha</th><th>Título</th><th>Descripción</th>
                <th>Evid.</th><th>Horas</th><th>Estado</th><th>Nota</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((b) => {
                const n = conteoEvidencias[b._id] || 0;
                return (
                  <tr key={b._id}>
                    <td data-label="Estudiante">{b.estudianteNombre}</td>
                    <td data-label="Fecha">{formatearFecha(b.fecha)}</td>
                    <td data-label="Título">{b.titulo}</td>
                    <td data-label="Descripción">
                      {b.descripcion.slice(0, 40)}{b.descripcion.length > 40 ? "…" : ""}
                    </td>
                    <td data-label="Evid.">{n ? `📎 ${n}` : "—"}</td>
                    <td data-label="Horas">{formatearHoras(b.horas_registradas)}</td>
                    <td data-label="Estado"><Badge estado={textoEstadoBitacora(b.estado)} /></td>
                    <td data-label="Nota">{b.nota !== null ? formatearNota(b.nota) : "—"}</td>
                    <td data-label="Acciones">
                      {b.estado === "pendiente" ? (
                        <button className="button-primary" onClick={() => abrirRevision(b)}>Revisar</button>
                      ) : (
                        <button className="button-secondary" onClick={() => abrirRevision(b)}>Ver</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lista.length === 0 && (
          <div className="vacio">
            {bits.length ? "No hay bitácoras que coincidan con los filtros seleccionados." : "Tus estudiantes aún no han registrado bitácoras."}
          </div>
        )}
      </div>

      {bitacoraAbierta && (
        <ModalRevisionBitacora
          bitacora={bitacoraAbierta}
          cerrada={cerradaPara(bitacoraAbierta.estudiante_id)}
          notaExistente={notaPorBitacora[bitacoraAbierta._id]}
          retrosEstudiante={retrosPorEstudiante[bitacoraAbierta.estudiante_id] || []}
          tituloPorBitacoraId={tituloPorBitacoraId}
          docenteId={usuario.id_usuario}
          onClose={() => setBitacoraAbierta(null)}
          onGuardado={recargar}
        />
      )}
    </div>
  );
}
