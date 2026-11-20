import { useState } from "react";
import { Link } from "react-router-dom";
import { useAsignarGrupo } from "../../hooks/useAsignarGrupo";
import { agregarEstudianteAGrupo, crearAsignacionPlaza, crearGrupo } from "../../services/practicas";
import { useToast } from "../../components/ToastContext";
import { formatearFecha } from "../../utils/formato";
import Badge from "../../components/Badge";
import Cargando from "../../components/Cargando";

/**
 * src/pages/director/DirectorAsignarGrupo.jsx
 * Página "Asignar estudiantes a grupo de práctica" (CU 1, pasos 11 a 15
 * y rama 14a "+ Crear nuevo grupo"): marca uno o varios estudiantes sin
 * grupo, elige un grupo existente (o crea uno nuevo eligiendo su plaza)
 * y les entrega a todos la misma plaza, fechas y horas requeridas del
 * grupo.
 */
export default function DirectorAsignarGrupo() {
  const { estudiantes, grupos, plazasDisponibles, tipos, niveles, maxNumeroGrupo, cargando, recargar } = useAsignarGrupo();
  const { mostrarToast } = useToast();
  const [marcados, setMarcados] = useState(new Set());
  const [grupoId, setGrupoId] = useState("");
  const [error, setError] = useState("");
  const [asignando, setAsignando] = useState(false);

  // Campos del formulario "+ Crear nuevo grupo"
  const [nombre, setNombre] = useState("");
  const [plazaId, setPlazaId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [nivelId, setNivelId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horasRequeridas, setHorasRequeridas] = useState("160");
  const [erroresNuevo, setErroresNuevo] = useState({});

  if (cargando) return <Cargando />;

  if (estudiantes.length === 0) {
    return (
      <div className="page">
        <div className="page-title">
          <Link to="/director/practicas" className="enlace-volver">← Gestionar prácticas</Link>
          <h1>Asignar estudiantes a grupo de práctica</h1>
        </div>
        <div className="card vacio">No hay estudiantes pendientes de agrupación.</div>
      </div>
    );
  }

  function alternar(idEstudiante) {
    setMarcados((actual) => {
      const copia = new Set(actual);
      if (copia.has(idEstudiante)) copia.delete(idEstudiante); else copia.add(idEstudiante);
      return copia;
    });
    setError("");
  }

  const grupoExistente = grupos.find((g) => String(g.id_grupo) === String(grupoId));
  const esNuevo = grupoId === "nuevo";
  const plazaElegida = plazasDisponibles.find((p) => String(p.id_plaza) === String(plazaId));

  function limpiarFormularioNuevo() {
    setNombre(""); setPlazaId(""); setTipoId(""); setNivelId("");
    setFechaInicio(""); setFechaFin(""); setHorasRequeridas("160"); setErroresNuevo({});
  }

  function validarNuevoGrupo() {
    const errores = {};
    if (!nombre.trim()) errores.nombre = "Escribe el nombre del grupo.";
    if (!plazaId) errores.plazaId = "Selecciona la plaza.";
    if (!tipoId) errores.tipoId = "Selecciona el tipo de práctica.";
    if (!nivelId) errores.nivelId = "Selecciona el nivel.";
    if (!fechaInicio) errores.fechaInicio = "Selecciona la fecha de inicio.";
    if (!fechaFin || fechaFin <= fechaInicio) errores.fechaFin = "La fecha de fin debe ser posterior a la de inicio.";
    if (!horasRequeridas || Number(horasRequeridas) <= 0) errores.horasRequeridas = "Ingresa las horas requeridas (mayor que 0).";
    setErroresNuevo(errores);
    return Object.keys(errores).length === 0;
  }

  async function asignar() {
    if (marcados.size === 0) { mostrarToast("Selecciona al menos un estudiante.", "error"); return; }
    if (!grupoId) { mostrarToast("Selecciona un grupo.", "error"); return; }

    if (esNuevo) {
      if (!validarNuevoGrupo()) return;
      if (plazaElegida.estadoConvenio === "Vencido") {
        setError("El convenio de la institución está vencido.");
        return;
      }
      if (marcados.size > plazaElegida.cuposLibres) {
        setError(
          `El grupo solo tiene ${plazaElegida.cuposLibres} cupo${plazaElegida.cuposLibres === 1 ? "" : "s"} libre${plazaElegida.cuposLibres === 1 ? "" : "s"}. Selecciona menos estudiantes o elige otro grupo.`
        );
        return;
      }
      setError("");
      setAsignando(true);
      try {
        const nuevoGrupo = await crearGrupo({
          tipo_practica_id: Number(tipoId),
          nivel_practica_id: Number(nivelId),
          numero_grupo: maxNumeroGrupo + 1, // D3: máximo existente + 1
          nombre: nombre.trim(),
          convenio_id: plazaElegida.convenio_id,
        });
        await asignarEstudiantesAGrupo(nuevoGrupo.id_grupo, {
          plaza_id: plazaElegida.id_plaza,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          horas_requeridas: Number(horasRequeridas),
        });
        mostrarToast("Estudiantes asignados al grupo correctamente.", "ok");
        setMarcados(new Set());
        setGrupoId("");
        limpiarFormularioNuevo();
        recargar();
      } catch (e) {
        setError(e.message || "Ocurrió un error al crear el grupo.");
      } finally {
        setAsignando(false);
      }
      return;
    }

    // Grupo existente
    if (grupoExistente.estadoConvenio === "Vencido") {
      setError("El convenio de la institución está vencido.");
      return;
    }
    if (marcados.size > grupoExistente.cuposLibres) {
      setError(
        `El grupo solo tiene ${grupoExistente.cuposLibres} cupo${grupoExistente.cuposLibres === 1 ? "" : "s"} libre${grupoExistente.cuposLibres === 1 ? "" : "s"}. Selecciona menos estudiantes o elige otro grupo.`
      );
      return;
    }
    setError("");
    setAsignando(true);
    try {
      await asignarEstudiantesAGrupo(grupoExistente.id_grupo, {
        plaza_id: grupoExistente.plaza_id,
        fecha_inicio: grupoExistente.fecha_inicio,
        fecha_fin: grupoExistente.fecha_fin,
        horas_requeridas: grupoExistente.horas_requeridas,
      });
      mostrarToast("Estudiantes asignados al grupo correctamente.", "ok");
      setMarcados(new Set());
      setGrupoId("");
      recargar();
    } catch (e) {
      setError(e.message || "Ocurrió un error al asignar los estudiantes.");
    } finally {
      setAsignando(false);
    }
  }

  async function asignarEstudiantesAGrupo(idGrupo, { plaza_id, fecha_inicio, fecha_fin, horas_requeridas }) {
    let asignados = 0;
    for (const idEstudiante of marcados) {
      // Secuencial (no Promise.all): asignacion_plaza depende de que la
      // fila de grupo_estudiante ya exista (restricción del backend).
      try {
        await agregarEstudianteAGrupo(idGrupo, idEstudiante);
        await crearAsignacionPlaza({ id_grupo: idGrupo, id_estudiante: idEstudiante, plaza_id, fecha_inicio, fecha_fin, horas_requeridas });
        asignados += 1;
      } catch (e) {
        // D3: si falla a la mitad, se dice cuántos quedaron guardados y
        // quién falló; la lista se recarga para mostrar solo los pendientes.
        const quien = estudiantes.find((x) => x.id_usuario === idEstudiante)?.nombre || "un estudiante";
        setMarcados(new Set());
        recargar();
        throw new Error(
          `Se asignaron ${asignados} de ${marcados.size} estudiantes. Falló con ${quien}: ${e.message || "error desconocido"}. ` +
          "Los ya asignados quedaron guardados; vuelve a intentar con los restantes.",
          { cause: e }
        );
      }
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <Link to="/director/practicas" className="enlace-volver">← Gestionar prácticas</Link>
        <h1>Asignar estudiantes a grupo de práctica</h1>
      </div>

      <div className="card">
        <div className="section-title">Estudiantes sin grupo</div>
        <ul className="lista-seleccion">
          {estudiantes.map((e) => (
            <li key={e.id_usuario}>
              <input type="checkbox" checked={marcados.has(e.id_usuario)} onChange={() => alternar(e.id_usuario)} />{" "}
              <span>
                {e.nombre}
                <small> · {e.docenteAsesor}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Grupo de práctica</label>
              <select value={grupoId} onChange={(e) => { setGrupoId(e.target.value); setError(""); }}>
                <option value="">Selecciona…</option>
                {grupos.map((g) => (
                  <option key={g.id_grupo} value={g.id_grupo}>
                    {g.nombre} · {g.institucion_nombre} · {g.cuposLibres} cupos
                  </option>
                ))}
                <option value="nuevo">+ Crear nuevo grupo</option>
              </select>
            </div>

            {grupoExistente && (
              <div style={{ marginBottom: 16 }}>
                {grupoExistente.estadoConvenio === "Vencido" && (
                  <div className="aviso aviso-rojo">
                    ⛔ El convenio de esta institución está vencido. Elige otro grupo o{" "}
                    <Link to="/director/instituciones">renueva el convenio</Link>.
                  </div>
                )}
                <p className="dato-linea"><strong>Institución:</strong> {grupoExistente.institucion_nombre}</p>
                <p className="dato-linea"><strong>Tipo y nivel:</strong> {grupoExistente.tipo_practica} · Nivel {grupoExistente.nivel_practica}</p>
                <p className="dato-linea">
                  <strong>Fechas:</strong> {formatearFecha(grupoExistente.fecha_inicio)} a {formatearFecha(grupoExistente.fecha_fin)}
                </p>
                <p className="dato-linea"><strong>Horas requeridas:</strong> {grupoExistente.horas_requeridas}</p>
                <p className="dato-linea"><strong>Convenio:</strong> <Badge estado={grupoExistente.estadoConvenio} /></p>
              </div>
            )}

            {esNuevo && (
              <div style={{ marginBottom: 16 }}>
                <div className="form-grid">
                  <div className={`form-group ${erroresNuevo.nombre ? "con-error" : ""}`}>
                    <label>Nombre del grupo</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    <div className="campo-error">{erroresNuevo.nombre}</div>
                  </div>
                  <div className={`form-group ${erroresNuevo.plazaId ? "con-error" : ""}`}>
                    <label>Plaza</label>
                    <select value={plazaId} onChange={(e) => setPlazaId(e.target.value)}>
                      <option value="">Selecciona…</option>
                      {plazasDisponibles.map((p) => (
                        <option key={p.id_plaza} value={p.id_plaza}>
                          {p.institucion_nombre} (cupos libres: {p.cuposLibres})
                        </option>
                      ))}
                    </select>
                    <div className="campo-error">{erroresNuevo.plazaId}</div>
                  </div>
                  <div className={`form-group ${erroresNuevo.tipoId ? "con-error" : ""}`}>
                    <label>Tipo de práctica</label>
                    <select value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
                      <option value="">Selecciona…</option>
                      {tipos.map((t) => <option key={t.id_tipo_practica} value={t.id_tipo_practica}>{t.nombre}</option>)}
                    </select>
                    <div className="campo-error">{erroresNuevo.tipoId}</div>
                  </div>
                  <div className={`form-group ${erroresNuevo.nivelId ? "con-error" : ""}`}>
                    <label>Nivel</label>
                    <select value={nivelId} onChange={(e) => setNivelId(e.target.value)}>
                      <option value="">Selecciona…</option>
                      {niveles.map((n) => <option key={n.id_nivel_practica} value={n.id_nivel_practica}>{n.nombre}</option>)}
                    </select>
                    <div className="campo-error">{erroresNuevo.nivelId}</div>
                  </div>
                  <div className={`form-group ${erroresNuevo.fechaInicio ? "con-error" : ""}`}>
                    <label>Fecha de inicio</label>
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                    <div className="campo-error">{erroresNuevo.fechaInicio}</div>
                  </div>
                  <div className={`form-group ${erroresNuevo.fechaFin ? "con-error" : ""}`}>
                    <label>Fecha de fin</label>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                    <div className="campo-error">{erroresNuevo.fechaFin}</div>
                  </div>
                  <div className={`form-group ${erroresNuevo.horasRequeridas ? "con-error" : ""}`}>
                    <label>Horas requeridas</label>
                    <input type="number" min="1" value={horasRequeridas} onChange={(e) => setHorasRequeridas(e.target.value)} />
                    <div className="campo-error">{erroresNuevo.horasRequeridas}</div>
                  </div>
                </div>
              </div>
            )}
      </div>

            {error && <div className="campo-error" style={{ display: "block", marginBottom: 14 }}>{error}</div>}

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <button className="button-primary" onClick={asignar} disabled={asignando}>
          {asignando ? "Asignando…" : "Asignar"}
        </button>
      </div>
    </div>
  );
}
