import { useNavigate } from "react-router-dom";
import { useGestionarPracticas } from "../../hooks/useGestionarPracticas";
import Cargando from "../../components/Cargando";

/**
 * src/pages/director/DirectorGestionar.jsx
 * Página "Gestionar prácticas" (CU 1): 4 tarjetas de acción, cada una
 * con su conteo pendiente. Equivale a #practicas / pintarPracticas() de
 * director/director.js.
 */
export default function DirectorGestionar() {
  const { conteos, cargando } = useGestionarPracticas();
  const navigate = useNavigate();

  if (cargando) return <Cargando />;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Gestionar prácticas</h1>
        <p>Asigna docentes y grupos, registra plazas y decide el resultado de las prácticas.</p>
      </div>

      <div className="cards">
        <TarjetaAccion
          titulo="Asignar docente asesor"
          conteo={conteos.sinDocente}
          info="estudiantes sin docente asignado"
          onClick={() => navigate("docente")}
        />
        <TarjetaAccion
          titulo="Asignar estudiantes a grupo de práctica"
          conteo={conteos.sinGrupo}
          info="estudiantes sin grupo asignado"
          onClick={() => navigate("grupo")}
        />
        <TarjetaAccion
          titulo="Plazas de práctica"
          conteo={conteos.plazasPendientes}
          info="plazas pendientes de decisión"
          onClick={() => navigate("plazas")}
        />
        <TarjetaAccion
          titulo="Decidir resultado de la práctica"
          conteo={conteos.finalizadasPorDecidir}
          info="prácticas finalizadas por decidir"
          onClick={() => navigate("resultado")}
        />
      </div>
    </div>
  );
}

/** Tarjeta de acción con conteo, igual a las de "Estado de las
 *  prácticas" pero navegando a su propia pantalla en vez de filtrar. */
function TarjetaAccion({ titulo, conteo, info, onClick }) {
  return (
    <div className="card stat-card tarjeta-accion" onClick={onClick}>
      <div className="stat-title">{titulo}</div>
      <div className="conteo">{conteo}</div>
      <div className="stat-info">{info}</div>
    </div>
  );
}