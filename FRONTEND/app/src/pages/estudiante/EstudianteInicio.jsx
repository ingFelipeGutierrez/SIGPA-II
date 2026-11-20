import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMiPractica } from "../../hooks/useMiPractica";
import { obtenerCalificacionesPorAsignacion } from "../../services/practicas";
import { obtenerRetroalimentacionEstudiante } from "../../services/retroalimentacion";
import { formatearFecha, formatearHoras, formatearNota, primerNombre, textoEstadoPractica } from "../../utils/formato";
import Badge from "../../components/Badge";
import Cargando from "../../components/Cargando";

/**
 * src/pages/estudiante/EstudianteInicio.jsx
 * Página "Inicio" del panel del Estudiante: resumen con tarjetas (KPIs),
 * últimas actividades y la práctica en fechas. Equivale a la sección
 * #inicio de estudiante.html / pintarInicio() de estudiante.js.
 */
export default function EstudianteInicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { practica: pr, bitacoras: bits, cargando, horasCumplidas } = useMiPractica(usuario.id_usuario);
  const [notas, setNotas] = useState([]);
  const [retros, setRetros] = useState([]);

  useEffect(() => {
    obtenerRetroalimentacionEstudiante(usuario.id_usuario).then(setRetros).catch(() => setRetros([]));
  }, [usuario.id_usuario]);

  useEffect(() => {
    if (pr?.id_asignacion) {
      obtenerCalificacionesPorAsignacion(pr.id_asignacion).then(setNotas).catch(() => setNotas([]));
    }
  }, [pr]);

  if (cargando) return <Cargando />;

  // Últimas actividades: movimientos reales, más recientes primero (máx. 5).
  const tituloDe = (idBitacora) => bits.find((b) => String(b._id) === String(idBitacora))?.titulo || "";
  const movimientos = [
    ...bits.flatMap((b) => [
      { fecha: b.fecha, texto: "Registraste la bitácora", detalle: b.titulo },
      ...(b.estado === "aprobada"
        ? [{ fecha: b.fecha_revision || b.fecha, texto: "Bitácora aprobada", detalle: b.titulo }]
        : []),
      ...(b.estado === "requiere_correccion"
        ? [{ fecha: b.fecha_revision || b.fecha, texto: "Corrección solicitada", detalle: b.titulo }]
        : []),
    ]),
    ...notas.map((n) => ({ fecha: n.fecha, texto: `Nota recibida (${formatearNota(n.nota)})`, detalle: tituloDe(n.bitacora_id) })),
    ...retros.map((r) => ({ fecha: r.fecha, texto: "Retroalimentación recibida", detalle: tituloDe(r.bitacora_id) })),
  ]
    .filter((m) => m.fecha)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 5);

  const corrPendientes = bits.filter((b) => b.estado === "requiere_correccion").length;
  const horasPendientes = pr ? Math.max(0, pr.horas_requeridas - horasCumplidas) : 0;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Hola, {primerNombre(usuario.nombre)}</h1>
        <p>Este es el resumen de tu práctica académica.</p>
      </div>

      <div className="cards">
        <TarjetaResumen
          titulo="Práctica asignada"
          numero={pr ? <Badge estado={textoEstadoPractica(pr.estado)} /> : "Sin asignar"}
          info="Estado de tu práctica en la institución receptora."
          sub={pr?.institucion}
          enlace="Ver práctica"
          onClick={() => navigate("/estudiante/practica")}
        />
        <TarjetaResumen
          titulo="Horas cumplidas"
          numero={pr ? `${formatearHoras(horasCumplidas)} / ${pr.horas_requeridas}` : "—"}
          info="Horas de bitácoras aprobadas frente al total que debes completar."
          enlace="Ver avance de horas"
          onClick={() => navigate("/estudiante/practica")}
        />
        <TarjetaResumen
          titulo="Bitácoras registradas"
          numero={bits.length}
          info="Actividades que has reportado durante tu práctica."
          enlace="Ver bitácoras"
          onClick={() => navigate("/estudiante/bitacoras")}
        />
        <TarjetaResumen
          titulo="Evaluaciones recibidas"
          numero={notas.length}
          info="Notas que tu docente asesor ya te asignó."
          enlace="Ver evaluaciones"
          onClick={() => navigate("/estudiante/evaluaciones")}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Últimas actividades</div>
          {movimientos.length ? (
            movimientos.map((m, i) => (
              <div className="activity" key={i}>
                {m.texto}
                <small>{m.detalle ? `${m.detalle} · ` : ""}{formatearFecha(m.fecha)}</small>
              </div>
            ))
          ) : (
            <div className="vacio">Aún no tienes actividad.</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Mi práctica en fechas</div>
          {!pr ? (
            <div className="vacio">Aún no tienes una práctica asignada.</div>
          ) : (
            <>
              <p className="dato-linea"><strong>Inicio:</strong> {formatearFecha(pr.fecha_inicio)}</p>
              <p className="dato-linea"><strong>Fin:</strong> {formatearFecha(pr.fecha_fin)}</p>
              <p className="dato-linea"><strong>Horas pendientes:</strong> {formatearHoras(horasPendientes)} h</p>
              {corrPendientes > 0 && (
                <div className="aviso aviso-naranja" style={{ marginTop: 10 }}>
                  ⚠️ Tienes {corrPendientes} bitácora(s) que requieren corrección.{" "}
                  <button className="enlace-accion" onClick={() => navigate("/estudiante/bitacoras")}>
                    Ver bitácoras
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tarjeta de resumen (KPI) reutilizable: toda la tarjeta es clicable. */
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
