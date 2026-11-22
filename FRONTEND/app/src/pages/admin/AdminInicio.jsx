import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminInicio } from "../../hooks/useAdminInicio";
import { useAparecer } from "../../hooks/useAparecer";
import { formatearFecha, primerNombre } from "../../utils/formato";
import { ROLES_USUARIO, textoRol, textoEstadoSolicitud } from "../../utils/roles";
import Badge from "../../components/Badge";
import Cargando from "../../components/Cargando";

/**
 * src/pages/admin/AdminInicio.jsx
 * Inicio del panel del Super Admin: panorama del acceso a la plataforma
 * con 4 tarjetas de resumen (solicitudes pendientes, usuarios, estudiantes
 * y docentes), el conteo de usuarios por rol y las 5 solicitudes más
 * recientes. Cada tarjeta lleva a la pantalla donde se resuelve.
 */
export default function AdminInicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { datos, cargando, error } = useAdminInicio();
  const contenidoRef = useRef(null);
  useAparecer(contenidoRef, ".card", cargando);

  if (cargando) return <Cargando />;
  if (error) {
    return (
      <div className="page">
        <div className="vacio">{error}</div>
      </div>
    );
  }

  const { pendientes, total, porRol, ultimas } = datos;

  return (
    <div className="page" ref={contenidoRef}>
      <div className="page-title">
        <h1>Hola, {primerNombre(usuario.nombre)}</h1>
        <p>Administra el acceso y las cuentas de la plataforma.</p>
      </div>

      <div className="cards">
        <TarjetaResumen
          titulo="Solicitudes pendientes"
          numero={pendientes}
          info="Personas que pidieron acceso y esperan tu respuesta."
          enlace="Revisar solicitudes"
          onClick={() => navigate("/admin/solicitudes")}
        />
        <TarjetaResumen
          titulo="Usuarios registrados"
          numero={total}
          info="Cuentas con acceso a la plataforma, de todos los roles."
          enlace="Ver usuarios"
          onClick={() => navigate("/admin/usuarios")}
        />
        <TarjetaResumen
          titulo="Estudiantes"
          numero={porRol.ESTUDIANTE || 0}
          info="Estudiantes que pueden registrar su práctica."
          enlace="Ver estudiantes"
          onClick={() => navigate("/admin/usuarios", { state: { rol: "ESTUDIANTE" } })}
        />
        <TarjetaResumen
          titulo="Docentes asesores"
          numero={porRol.DOCENTE || 0}
          info="Docentes que hacen el seguimiento de las prácticas."
          enlace="Ver docentes"
          onClick={() => navigate("/admin/usuarios", { state: { rol: "DOCENTE" } })}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Usuarios por rol</div>
          {ROLES_USUARIO.map((r) => (
            <div
              key={r.valor}
              className="activity"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>{r.etiqueta}</span>
              <strong>{porRol[r.valor] || 0}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title">Últimas solicitudes</div>
          {ultimas.length ? (
            ultimas.map((s) => (
              <div className="activity" key={s.id_solicitud}>
                {s.nombre} {s.apellido} solicitó ser {textoRol(s.rol_solicitado).toLowerCase()}
                <small>
                  {formatearFecha(s.fecha_solicitud)} · <Badge estado={textoEstadoSolicitud(s.estado)} />
                </small>
              </div>
            ))
          ) : (
            <div className="vacio">Aún no hay solicitudes de registro.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tarjeta de resumen clicable (misma estructura que la del Inicio del Director). */
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
