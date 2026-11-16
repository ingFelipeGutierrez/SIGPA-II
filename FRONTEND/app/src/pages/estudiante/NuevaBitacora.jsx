import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import { obtenerMiPractica } from "../../services/practicas";
import { obtenerActividadesDeGrupo } from "../../services/actividades";
import { obtenerBitacorasEstudiante, registrarBitacora, corregirBitacora } from "../../services/bitacoras";
import { obtenerEvidenciasDeBitacora, registrarEvidencia, eliminarEvidencia } from "../../services/evidencias";
import { fechaHoy, formatearFecha, formatearHoras } from "../../utils/formato";

const PASOS = ["Actividad", "Descripción", "Evidencias", "Revisión"];

/**
 * src/pages/estudiante/NuevaBitacora.jsx
 *
 * Formulario por pasos para registrar (o corregir) una bitácora de
 * práctica (CU 3). Equivale a #nueva-bitacora / el "wizard" de
 * estudiante.js, con un ajuste frente al prototipo original: en vez de
 * escribir un título libre, el estudiante elige la ACTIVIDAD (tarea tipo
 * Classroom) que su docente publicó para el grupo, porque así quedó
 * definido el modelo de datos real (bitacora.actividad_id es obligatorio
 * en el backend). El titulo SI se conserva como campo propio de la
 * bitacora (independiente del titulo de la actividad): el esquema de
 * validacion de la coleccion "bitacora" en MongoDB lo exige obligatorio.
 * Las evidencias, por ahora, son un enlace (ej. de
 * Google Drive) y no un archivo subido directamente, porque el backend
 * v1 solo admite evidencias de tipo "link_drive".
 */
export default function NuevaBitacora() {
  const { usuario } = useAuth();
  const { idBitacora } = useParams(); // presente solo en modo "corregir"
  const modoCorreccion = Boolean(idBitacora);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();

  const [actividadesAbiertas, setActividadesAbiertas] = useState([]);
  const [bitacoraOriginal, setBitacoraOriginal] = useState(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  const [pasoActual, setPasoActual] = useState(1);
  const [pasoMaximo, setPasoMaximo] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});

  const [actividadId, setActividadId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [horas, setHoras] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [evidencias, setEvidencias] = useState([]); // {_id?, url_archivo, formato}
  const [nuevoEnlace, setNuevoEnlace] = useState("");

  // Carga inicial: la práctica (para saber el grupo y sus actividades
  // abiertas) y, en modo corrección, la bitácora original + sus evidencias.
  useEffect(() => {
    (async () => {
      const pr = await obtenerMiPractica(usuario.id_usuario);
      if (pr?.id_grupo) {
        const lista = await obtenerActividadesDeGrupo(pr.id_grupo);
        setActividadesAbiertas(lista.filter((a) => a.estado === "abierta"));
      }

      if (modoCorreccion) {
        const todas = await obtenerBitacorasEstudiante(usuario.id_usuario);
        const b = todas.find((x) => x._id === idBitacora);
        if (!b) { mostrarToast("No se encontró la bitácora a corregir.", "error"); navigate("/estudiante/bitacoras"); return; }
        setBitacoraOriginal(b);
        setActividadId(b.actividad_id);
        setTitulo(b.titulo || "");
        setFecha(String(b.fecha).split("T")[0]);
        setHoras(b.horas_registradas);
        setDescripcion(b.descripcion);
        setPasoMaximo(4);
        const ev = await obtenerEvidenciasDeBitacora(idBitacora);
        setEvidencias(ev);
      }
      setCargandoInicial(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function marcarError(campo, mensaje) {
    setErrores((prev) => ({ ...prev, [campo]: mensaje }));
    return !mensaje;
  }

  function validarPaso(n) {
    if (n === 1) {
      const errActividad = actividadId ? "" : "Selecciona la actividad sobre la que estás reportando.";
      const errFecha = !fecha ? "Selecciona la fecha de la actividad." : fecha > fechaHoy() ? "La fecha no puede ser posterior a hoy." : "";
      const errHoras = Number(horas) > 0 ? "" : "Ingresa un número de horas mayor que 0.";
      const a = marcarError("actividad", errActividad);
      const f = marcarError("fecha", errFecha);
      const h = marcarError("horas", errHoras);
      return a && f && h;
    }
    if (n === 2) {
      const errTitulo = !titulo.trim() ? "Escribe un título para esta bitácora."
        : titulo.trim().length > 150 ? "El título no puede superar los 150 caracteres." : "";
      const t = marcarError("titulo", errTitulo);
      const d = marcarError("descripcion", descripcion.trim() ? "" : "Describe la actividad realizada.");
      return t && d;
    }
    return true;
  }

  function siguientePaso(n) {
    if (!validarPaso(n)) return;
    setPasoActual(n + 1);
    setPasoMaximo((m) => Math.max(m, n + 1));
  }

  function irAPaso(n) { if (n <= pasoMaximo) setPasoActual(n); }

  function agregarEnlace() {
    if (!nuevoEnlace.trim()) return;
    setEvidencias((lista) => [...lista, { url_archivo: nuevoEnlace.trim(), formato: "enlace" }]);
    setNuevoEnlace("");
  }

  async function quitarEvidencia(i) {
    const e = evidencias[i];
    // Si ya tiene _id es porque ya existe en Mongo (modo corrección): hay
    // que borrarla también del servidor, no solo de la lista en pantalla.
    if (e._id) {
      try { await eliminarEvidencia(e._id); } catch { /* se intenta igual quitar de la vista */ }
    }
    setEvidencias((lista) => lista.filter((_, idx) => idx !== i));
  }

  async function guardar() {
    const p1 = validarPaso(1), p2 = validarPaso(2);
    if (!p1 || !p2) {
      setPasoActual(!p1 ? 1 : 2);
      setPasoMaximo((m) => Math.max(m, !p1 ? 1 : 2));
      mostrarToast("Revisa los campos marcados en rojo.", "error");
      return;
    }
    setGuardando(true);
    try {
      const datosBitacora = { titulo: titulo.trim(), fecha, descripcion: descripcion.trim(), horas_registradas: Number(horas) };

      if (modoCorreccion) {
        await corregirBitacora(idBitacora, datosBitacora);
        // Las evidencias nuevas (sin _id) todavía no se guardaron: se suben ahora.
        for (const e of evidencias.filter((x) => !x._id)) {
          await registrarEvidencia({ bitacora_id: idBitacora, url_archivo: e.url_archivo, tipo: "link_drive" });
        }
        mostrarToast("Bitácora corregida y enviada nuevamente a revisión.", "ok");
      } else {
        const creada = await registrarBitacora({
          actividad_id: actividadId, estudiante_id: usuario.id_usuario, ...datosBitacora,
        });
        for (const e of evidencias) {
          await registrarEvidencia({ bitacora_id: creada._id, url_archivo: e.url_archivo, tipo: "link_drive" });
        }
        mostrarToast("Bitácora guardada correctamente. Quedó pendiente de revisión por tu docente asesor.", "ok");
      }
      navigate("/estudiante/bitacoras");
    } catch {
      mostrarToast("No se pudo guardar la bitácora.", "error");
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoInicial) return <p className="vacio">Cargando…</p>;

  const actividadSeleccionada = actividadesAbiertas.find((a) => a._id === actividadId)
    || (modoCorreccion ? { _id: actividadId, titulo: bitacoraOriginal?.actividad_titulo || "Actividad" } : null);

  return (
    <div className="page">
      <div className="page-title">
        <h1>{modoCorreccion ? "Corregir bitácora" : "Nueva bitácora"}</h1>
        <p>Registra una actividad de tu práctica en cuatro pasos.</p>
      </div>

      {!modoCorreccion && (
        <div className="aviso aviso-info">
          ℹ️ Registra la actividad tal como la realizaste: tu docente asesor la revisará con esta información.
        </div>
      )}
      {modoCorreccion && (
        <div className="aviso aviso-naranja">
          ⚠️ <span><strong>Motivo de la corrección:</strong> {bitacoraOriginal?.motivo_correccion}</span>
        </div>
      )}

      <Stepper pasoActual={pasoActual} />

      <PasoCard n={1} titulo="Datos de la actividad" pasoActual={pasoActual} pasoMaximo={pasoMaximo}
        resumen={pasoActual > 1 ? `${formatearFecha(fecha)} · ${formatearHoras(Number(horas))} h` : ""}
        onEditar={() => irAPaso(1)}>
        <div className="form-grid">
          <div className={`form-group ${errores.actividad ? "con-error" : ""}`}>
            <label>Actividad</label>
            {modoCorreccion ? (
              <input type="text" value={actividadSeleccionada?.titulo || ""} disabled />
            ) : (
              <select value={actividadId} onChange={(e) => setActividadId(e.target.value)}>
                <option value="">Selecciona una actividad…</option>
                {actividadesAbiertas.map((a) => <option key={a._id} value={a._id}>{a.titulo}</option>)}
              </select>
            )}
            <div className="campo-error">{errores.actividad}</div>
            {!modoCorreccion && actividadesAbiertas.length === 0 && (
              <p className="dato-linea" style={{ color: "var(--gris-texto)" }}>
                Tu docente asesor aún no ha publicado actividades abiertas para tu grupo.
              </p>
            )}
          </div>
          <div className={`form-group ${errores.fecha ? "con-error" : ""}`}>
            <label>Fecha</label>
            <input type="date" value={fecha} max={fechaHoy()} onChange={(e) => setFecha(e.target.value)} />
            <div className="campo-error">{errores.fecha}</div>
          </div>
          <div className={`form-group ${errores.horas ? "con-error" : ""}`}>
            <label>Horas dedicadas</label>
            <input type="number" min="0.5" step="0.5" placeholder="Ej: 4" value={horas} onChange={(e) => setHoras(e.target.value)} />
            <div className="campo-error">{errores.horas}</div>
          </div>
        </div>
        <div className="paso-acciones"><span /><button className="button-primary" onClick={() => siguientePaso(1)}>Siguiente</button></div>
      </PasoCard>

      <PasoCard n={2} titulo="Título y descripción" pasoActual={pasoActual} pasoMaximo={pasoMaximo}
        resumen={pasoActual > 2 ? titulo : ""}
        onEditar={() => irAPaso(2)}>
        <div className={`form-group ${errores.titulo ? "con-error" : ""}`}>
          <label>Título de la bitácora</label>
          <input type="text" maxLength={150} placeholder="Ej: Día 1 - Reconocimiento del área de trabajo"
            value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <div className="campo-error">{errores.titulo}</div>
        </div>
        <div className={`form-group ${errores.descripcion ? "con-error" : ""}`}>
          <label>Descripción de la actividad</label>
          <textarea placeholder="Describe detalladamente la actividad realizada..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <div className="campo-error">{errores.descripcion}</div>
        </div>
        <div className="paso-acciones"><button className="enlace-accion" onClick={() => irAPaso(1)}>Atrás</button><button className="button-primary" onClick={() => siguientePaso(2)}>Siguiente</button></div>
      </PasoCard>

      <PasoCard n={3} titulo="Evidencias" pasoActual={pasoActual} pasoMaximo={pasoMaximo}
        resumen={pasoActual > 3 ? (evidencias.length ? `${evidencias.length} evidencia(s) adjunta(s)` : "Sin evidencias adjuntas") : ""}
        onEditar={() => irAPaso(3)}>
        <div className="zona-archivos">
          <div style={{ fontSize: 30 }}>🔗</div>
          <p>Pega el enlace de Drive (u otro) con el soporte de la actividad.<br />Puedes agregar varios enlaces.</p>
          <input type="url" placeholder="https://drive.google.com/…" value={nuevoEnlace}
            onChange={(e) => setNuevoEnlace(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }} />
          <button className="button-secondary" onClick={agregarEnlace}>Agregar enlace</button>
        </div>
        <ul className="lista-archivos">
          {evidencias.map((e, i) => (
            <li key={e._id || i}>
              <span>🔗 {e.url_archivo}</span>
              <button className="quitar" aria-label="Quitar" onClick={() => quitarEvidencia(i)}>✕</button>
            </li>
          ))}
        </ul>
        <div className="paso-acciones" style={{ marginTop: 14 }}>
          <button className="enlace-accion" onClick={() => irAPaso(2)}>Atrás</button>
          <button className="button-primary" onClick={() => siguientePaso(3)}>Siguiente</button>
        </div>
      </PasoCard>

      <PasoCard n={4} titulo="Revisión" pasoActual={pasoActual} pasoMaximo={pasoMaximo} resumen="" onEditar={null}>
        <p className="dato-linea"><strong>Actividad:</strong> {actividadSeleccionada?.titulo || "—"}</p>
        <p className="dato-linea"><strong>Título de la bitácora:</strong> {titulo || "—"}</p>
        <p className="dato-linea"><strong>Fecha:</strong> {fecha ? formatearFecha(fecha) : "—"}</p>
        <p className="dato-linea"><strong>Horas dedicadas:</strong> {horas ? formatearHoras(Number(horas)) : "—"}</p>
        <p className="dato-linea"><strong>Descripción:</strong><br />{descripcion || "—"}</p>
        <p className="dato-linea"><strong>Evidencias:</strong> {evidencias.length || "Sin evidencias adjuntas"}</p>
        <p className="dato-linea" style={{ color: "var(--gris-texto)", marginTop: 12 }}>
          Al guardar, la bitácora quedará en estado «Pendiente» hasta que tu docente asesor la revise.
        </p>
        <div className="paso-acciones" style={{ marginTop: 14 }}><button className="enlace-accion" onClick={() => irAPaso(3)}>Atrás</button><span /></div>
      </PasoCard>

      <div className="barra-resumen">
        <div className="datos">
          <div className="dato"><strong>{fecha ? formatearFecha(fecha) : "—"}</strong><span>Fecha</span></div>
          <div className="dato"><strong>{horas ? `${formatearHoras(Number(horas))} h` : "—"}</strong><span>Horas</span></div>
          <div className="dato"><strong>{evidencias.length}</strong><span>Evidencias</span></div>
        </div>
        <div className="acciones">
          <button className="button-secondary" onClick={() => navigate("/estudiante/bitacoras")}>Cancelar</button>
          <button className={`button-primary ${guardando ? "cargando" : ""}`} disabled={guardando} onClick={guardar}>
            {modoCorreccion ? "Guardar corrección" : "Guardar bitácora"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Indicador de pasos (1·2·3·4) de la parte superior del formulario. */
function Stepper({ pasoActual }) {
  return (
    <div className="stepper">
      {PASOS.map((nombre, i) => {
        const n = i + 1;
        const clase = n < pasoActual ? "hecho" : n === pasoActual ? "actual" : "";
        return (
          <div key={nombre} style={{ display: "contents" }}>
            <div className={`paso ${clase}`}>
              <span className="paso-num">{n < pasoActual ? "✓" : n}</span>{nombre}
            </div>
            {i < PASOS.length - 1 && <div className={`paso-linea ${n < pasoActual ? "hecha" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Una tarjeta-paso del formulario. El CSS original (.paso-card.actual
 * .paso-card-cuerpo) ya anima la aparición del contenido cuando la
 * tarjeta pasa a ser la "actual" — React solo necesita alternar las
 * clases, no hace falta duplicar esa animación con GSAP.
 */
function PasoCard({ n, titulo, pasoActual, pasoMaximo, resumen, onEditar, children }) {
  const esActual = n === pasoActual;
  const completado = n < pasoActual;
  return (
    <div className={`paso-card ${esActual ? "actual" : ""} ${n > pasoMaximo ? "bloqueada" : ""}`}>
      <div className="paso-card-cabecera">
        <div><h3>{titulo}</h3><div className="paso-card-resumen">{completado ? resumen : ""}</div></div>
        {onEditar && completado && <button className="enlace-accion" onClick={onEditar}>Editar</button>}
      </div>
      <div className="paso-card-cuerpo">{children}</div>
    </div>
  );
}
