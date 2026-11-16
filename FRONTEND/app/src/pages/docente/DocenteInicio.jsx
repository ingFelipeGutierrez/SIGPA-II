import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDatosDocente } from "../../hooks/useDatosDocente";
import { formatearFecha, primerNombre } from "../../utils/formato";

/**
 * src/pages/docente/DocenteInicio.jsx
 * Página "Inicio" del panel del Docente: tarjetas de resumen (KPIs),
 * últimas bitácoras recibidas y avance de los estudiantes a cargo.
 * Equivale a #inicio / pintarInicio() de docente/docente.js.
 */
export default function DocenteInicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { estudiantes, bitacoras: bits, notaPorBitacora, cargando } = useDatosDocente(usuario.id_usuario);

  if (cargando) return <p className="vacio">Cargando…</p>;

  const porRevisar = bits.filter((b) => b.estado === "pendiente").length;
  const sinNota = bits.filter((b) => b.estado === "aprobada" && notaPorBitacora[b._id] === undefined).length;
  const activos = estudiantes.filter((e) => e.estado === "en_curso" || e.estado === "finalizada");
  const promedio = activos.length
    ? Math.round(activos.reduce((s, e) => s + e.porcentaje, 0) / activos.length)
    : 0;

  const ultimas = bits.slice(0, 5);

  return (
    <div className="page">
      <div className="page-title">
        <h1>Hola, {primerNombre(usuario.nombre)}</h1>
        <p>Este es el resumen de tus estudiantes en práctica.</p>
      </div>

      <div className="cards">
        <TarjetaResumen
          titulo="Estudiantes a cargo"
          numero={estudiantes.length}
          info="Estudiantes en práctica que tienes asignados como asesor."
          enlace="Ver estudiantes"
          onClick={() => navigate("/docente/estudiantes")}
        />
        <TarjetaResumen
          titulo="Bitácoras por revisar"
          numero={porRevisar}
          info="Bitácoras pendientes de tu aprobación o corrección."
          enlace="Revisar ahora"
          onClick={() => navigate("/docente/bitacoras")}
        />
        <TarjetaResumen
          titulo="Avance promedio de horas"
          numero={`${promedio}%`}
          info="Promedio de horas aprobadas de tus estudiantes frente a lo requerido."
          enlace="Ver detalle"
          onClick={() => navigate("/docente/estudiantes")}
        />
        <TarjetaResumen
          titulo="Bitácoras sin nota"
          numero={sinNota}
          info="Bitácoras aprobadas que aún no tienen calificación."
          enlace="Calificar"
          onClick={() => navigate("/docente/bitacoras")}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Últimas bitácoras recibidas</div>
          {ultimas.length ? (
            ultimas.map((b) => (
              <div
                className="activity"
                style={{ cursor: "pointer" }}
                key={b._id}
                onClick={() => navigate("/docente/bitacoras", { state: { abrirId: b._id } })}
              >
                {b.estudianteNombre} — {b.titulo}
                <small>{formatearFecha(b.fecha)} · {b.estado}</small>
              </div>
            ))
          ) : (
            <div className="vacio">Tus estudiantes aún no han registrado bitácoras.</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Avance de mis estudiantes</div>
          {estudiantes.length ? (
            estudiantes.map((e) => (
              <div style={{ marginBottom: 12 }} key={e.id_estudiante}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{e.estudiante}</span>
                  <strong>{e.porcentaje}%</strong>
                </div>
                <div className="progress"><div className="progress-bar" style={{ width: `${e.porcentaje}%` }} /></div>
              </div>
            ))
          ) : (
            <div className="vacio">No tienes estudiantes asignados.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tarjeta de resumen (KPI) reutilizable: toda la tarjeta es clicable. */
function TarjetaResumen({ titulo, numero, info, enlace, onClick }) {
  return (
    <div className="card stat-card">
      <div className="stat-title">{titulo}</div>
      <div className="stat-number">{numero}</div>
      <div className="stat-info">{info}</div>
      <button type="button" className="stat-link" onClick={onClick}>
        <span>{enlace}</span>
      </button>
    </div>
  );
}
