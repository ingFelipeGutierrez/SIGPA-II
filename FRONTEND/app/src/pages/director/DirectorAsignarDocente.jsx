import { useState } from "react";
import { Link } from "react-router-dom";
import { useAsignarDocente } from "../../hooks/useAsignarDocente";
import { asignarDocente } from "../../services/practicas";
import { useToast } from "../../components/ToastContext";

/**
 * src/pages/director/DirectorAsignarDocente.jsx
 * Página "Asignar docente asesor" (CU 1, pasos 5 a 10, rama 7a): marca
 * uno o varios estudiantes sin docente asesor y les asigna, en un solo
 * clic, el mismo docente asesor elegido. El backend crea una fila de
 * asignacion_docente por cada estudiante marcado.
 */
export default function DirectorAsignarDocente() {
  const { estudiantes, docentes, cargando, recargar } = useAsignarDocente();
  const { mostrarToast } = useToast();
  const [marcados, setMarcados] = useState(new Set());
  const [docenteId, setDocenteId] = useState("");
  const [error, setError] = useState("");
  const [asignando, setAsignando] = useState(false);

  if (cargando) return <p className="vacio">Cargando…</p>;

  function alternar(idEstudiante) {
    setMarcados((actual) => {
      const copia = new Set(actual);
      if (copia.has(idEstudiante)) copia.delete(idEstudiante); else copia.add(idEstudiante);
      return copia;
    });
    setError("");
  }

  const docenteSeleccionado = docentes.find((d) => String(d.id_usuario) === String(docenteId));
  const puedeAsignar = marcados.size > 0 && docenteSeleccionado;

  async function asignar() {
    if (!puedeAsignar) return;
    const disponibles = docenteSeleccionado.cupoMaximo - docenteSeleccionado.asignados;
    if (marcados.size > disponibles) {
      setError(
        `El docente asesor solo tiene ${disponibles} cupo${disponibles === 1 ? "" : "s"} disponible${disponibles === 1 ? "" : "s"}. Selecciona menos estudiantes o elige otro docente.`
      );
      return;
    }
    setError("");
    setAsignando(true);
    try {
      await Promise.all([...marcados].map((idEstudiante) => asignarDocente(idEstudiante, docenteSeleccionado.id_usuario)));
      mostrarToast("Docente asesor asignado correctamente.", "ok");
      setMarcados(new Set());
      setDocenteId("");
      recargar();
    } catch (e) {
      setError(e.message || "Ocurrió un error al asignar el docente asesor.");
    } finally {
      setAsignando(false);
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <Link to="/director/practicas" className="enlace-volver">← Gestionar prácticas</Link>
        <h1>Asignar docente asesor</h1>
        <p>Marca uno o varios estudiantes y elige el docente asesor que les corresponde.</p>
      </div>

      <div className="table-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>Estudiantes sin docente asesor</h3>
          {estudiantes.length === 0 ? (
            <div className="vacio">Todos los estudiantes ya tienen docente asesor.</div>
          ) : (
            <div className="lista-seleccionable">
              {estudiantes.map((e) => (
                <label key={e.id_usuario} className="fila-seleccionable">
                  <input
                    type="checkbox"
                    checked={marcados.has(e.id_usuario)}
                    onChange={() => alternar(e.id_usuario)}
                  />
                  <span>{e.nombre}</span>
                  <span className="dato-secundario">{e.institucionOGrupo}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Docentes asesores</h3>
          <div className="lista-seleccionable">
            {docentes.map((d) => (
              <label
                key={d.id_usuario}
                className={`fila-seleccionable ${!d.disponible ? "fila-deshabilitada" : ""}`}
              >
                <input
                  type="radio"
                  name="docente"
                  disabled={!d.disponible}
                  checked={String(docenteId) === String(d.id_usuario)}
                  onChange={() => { setDocenteId(d.id_usuario); setError(""); }}
                />
                <span>{d.nombre}</span>
                <span className="dato-secundario">
                  {d.disponible ? `${d.asignados} / ${d.cupoMaximo}` : "Sin disponibilidad"}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="campo-error" style={{ display: "block", marginTop: 14 }}>{error}</div>}

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <button className="button-primary" onClick={asignar} disabled={!puedeAsignar || asignando}>
          {asignando ? "Asignando…" : "Asignar"}
        </button>
      </div>
    </div>
  );
}