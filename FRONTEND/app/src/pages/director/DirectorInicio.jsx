import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDirectorInicio } from "../../hooks/useDirectorInicio";
import { formatearFecha, primerNombre } from "../../utils/formato";
import Cargando from "../../components/Cargando";

/**
 * src/pages/director/DirectorInicio.jsx
 * Inicio del panel del Director (Documento Maestro 12.1): panorama
 * general del programa con 4 tarjetas de resumen, 6 alertas de
 * seguimiento (cada una navega a la pantalla donde se resuelve; si el
 * conteo es 0 se muestra en gris y sin botón) y las últimas 5
 * asignaciones. Equivale a #inicio / pintarInicio() de
 * director/director.js.
 */
export default function DirectorInicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { tarjetas, alertas, ultimasAsignaciones, cargando } = useDirectorInicio();

  if (cargando) return <Cargando />;

  const { proximos } = tarjetas.convenios;

  // [texto, conteo, ruta, estado de navegación opcional]
  const listaAlertas = [
    ["Estudiantes sin docente asesor", alertas.sinDocente, "/director/practicas/docente"],
    ["Estudiantes sin grupo", alertas.sinGrupo, "/director/practicas/grupo"],
    ["Plazas pendientes de decisión", alertas.plazasPendientes, "/director/practicas/plazas", { estado: "pendiente" }],
    ["Prácticas finalizadas por decidir", alertas.finalizadasPorDecidir, "/director/practicas/resultado"],
    ["Convenios por vencer o vencidos", alertas.conveniosPorVencer, "/director/instituciones"],
    ["Estudiantes con bajo cumplimiento", alertas.bajoCumplimiento, "/director/supervision"],
  ];

  return (
    <div className="page">
      <div className="page-title">
        <h1>Hola, {primerNombre(usuario.nombre)}</h1>
        <p>Este es el panorama general del programa.</p>
      </div>

      <div className="cards">
        <TarjetaResumen
          titulo="Prácticas en curso"
          numero={tarjetas.enCurso}
          info="Estudiantes que hoy realizan su práctica en una institución."
          enlace="Ver prácticas en curso"
          onClick={() => navigate("/director/estado", { state: { estado: "en_curso" } })}
        />
        <TarjetaResumen
          titulo="Convenios vigentes"
          numero={tarjetas.convenios.vigentes}
          info="Convenios activos con instituciones receptoras."
          sub={`${proximos} ${proximos === 1 ? "próximo a vencer" : "próximos a vencer"}`}
          enlace="Ver convenios"
          onClick={() => navigate("/director/instituciones")}
        />
        <TarjetaResumen
          titulo="Plazas disponibles"
          numero={tarjetas.plazasLibres}
          info="Cupos libres en plazas de práctica ya aprobadas."
          enlace="Ver plazas"
          onClick={() => navigate("/director/practicas/plazas", { state: { estado: "aprobada" } })}
        />
        <TarjetaResumen
          titulo="Cumplimiento promedio"
          numero={`${tarjetas.cumplimientoPromedio}%`}
          info="Avance promedio de horas de las prácticas en curso y finalizadas."
          enlace="Ver supervisión de horas"
          onClick={() => navigate("/director/supervision")}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Alertas de seguimiento</div>
          {listaAlertas.map(([texto, conteo, ruta, estadoNav]) => (
            <div
              key={texto}
              className="activity"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...(conteo === 0 ? { color: "var(--gris-texto)" } : {}) }}
            >
              <span>{texto}</span>
              {conteo === 0 ? (
                <strong>0</strong>
              ) : (
                <button className="enlace-accion" onClick={() => navigate(ruta, estadoNav ? { state: estadoNav } : undefined)}>
                  {conteo}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title">Últimas asignaciones</div>
          {ultimasAsignaciones.length ? (
            ultimasAsignaciones.map((p) => (
              <div className="activity" key={p.id_asignacion}>
                {p.estudiante} {p.grupo_nombre ? `asignado a ${p.grupo_nombre}` : "registrado"}
                <small>{formatearFecha(p.fecha_inicio)}</small>
              </div>
            ))
          ) : (
            <div className="vacio">Sin asignaciones recientes.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tarjeta de resumen clicable (igual a la del Inicio del Estudiante). */
function TarjetaResumen({ titulo, numero, info, sub, enlace, onClick }) {
  return (
    <div className="card stat-card">
      <div className="stat-title">{titulo}</div>
      <div className="stat-number">{numero}</div>
      <div className="stat-info">{info}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <button type="button" className="stat-link" onClick={onClick}>
        <span>{enlace}</span>
      </button>
    </div>
  );
}
