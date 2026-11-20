import { useState } from "react";
import { Link } from "react-router-dom";
import { useAsignarDocente } from "../../hooks/useAsignarDocente";
import { asignarDocente } from "../../services/practicas";
import { useToast } from "../../components/ToastContext";
import Cargando from "../../components/Cargando";

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

  if (cargando) return <Cargando />;

  // Sin estudiantes pendientes: igual que el prototipo, solo el título y la tarjeta vacía.
  if (estudiantes.length === 0) {
    return (
      <div className="page">
        <div className="page-title">
          <Link to="/director/practicas" className="enlace-volver">← Gestionar prácticas</Link>
          <h1>Asignar docente asesor</h1>
        </div>
        <div className="card vacio">Todos los estudiantes ya tienen docente asesor.</div>
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

  const docenteSeleccionado = docentes.find((d) => String(d.id_usuario) === String(docenteId));

  async function asignar() {
    if (marcados.size === 0 || !docenteSeleccionado) {
      mostrarToast("Selecciona al menos un estudiante y un docente.", "error");
      return;
    }
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
      mostrarToast(e.message || "No se pudo asignar.", "error");
    } finally {
      setAsignando(false);
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <Link to="/director/practicas" className="enlace-volver">← Gestionar prácticas</Link>
        <h1>Asignar docente asesor</h1>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Estudiantes sin docente asesor</div>
          <ul className="lista-seleccion">
            {estudiantes.map((e) => (
              <li key={e.id_usuario}>
                <input
                  type="checkbox"
                  checked={marcados.has(e.id_usuario)}
                  onChange={() => alternar(e.id_usuario)}
                />{" "}
                <span>
                  {e.nombre}
                  <small> · {e.institucionOGrupo}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="section-title">Docentes asesores</div>
          <ul className="lista-seleccion">
            {docentes.map((d) => (
              <li key={d.id_usuario} className={!d.disponible ? "deshabilitada" : ""}>
                <input
                  type="radio"
                  name="doc"
                  disabled={!d.disponible}
                  checked={String(docenteId) === String(d.id_usuario)}
                  onChange={() => { setDocenteId(d.id_usuario); setError(""); }}
                />{" "}
                <span>
                  {d.nombre}
                  <small> · {d.asignados} / {d.cupoMaximo}{!d.disponible ? " · Sin disponibilidad" : ""}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && <div className="campo-error" style={{ display: "block", marginTop: 14 }}>{error}</div>}

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <button className="button-primary" onClick={asignar} disabled={asignando}>
          {asignando ? "Asignando…" : "Asignar"}
        </button>
      </div>
    </div>
  );
}
