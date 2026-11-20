import { useMemo } from "react";
import { useGestionarPracticas } from "./useGestionarPracticas";
import { useSupervisionHoras } from "./useSupervisionHoras";
import { usePracticasDirector } from "./usePracticasDirector";
import { usePlazasDirector } from "./usePlazasDirector";
import { estadoConvenio } from "../utils/formato";

/**
 * src/hooks/useDirectorInicio.js
 *
 * Datos de la pantalla de Inicio del Director (Documento Maestro 12.1):
 * las 4 tarjetas de resumen, las 6 alertas de seguimiento y las últimas
 * 5 asignaciones. No hace consultas nuevas: compone los hooks que ya
 * alimentan las demás pantallas del panel, para que el Inicio siempre
 * muestre las mismas cifras que Gestionar prácticas, Plazas,
 * Instituciones y Supervisión (una sola fuente de verdad por dato).
 *
 *  - useGestionarPracticas -> alertas: sin docente, sin grupo, plazas
 *    pendientes y finalizadas por decidir.
 *  - useSupervisionHoras   -> cumplimiento promedio y bajo cumplimiento.
 *  - usePracticasDirector  -> prácticas en curso y últimas asignaciones
 *    (el estado ya viene calculado con la regla del maestro).
 *  - usePlazasDirector     -> plazas/cupos libres y convenios por institución.
 */
export function useDirectorInicio() {
  const { conteos, cargando: cargandoConteos } = useGestionarPracticas();
  const { indicadores, cargando: cargandoSupervision } = useSupervisionHoras();
  const { practicas, cargando: cargandoPracticas } = usePracticasDirector();
  const { plazas, instituciones, cargando: cargandoPlazas } = usePlazasDirector();

  const cargando = cargandoConteos || cargandoSupervision || cargandoPracticas || cargandoPlazas;

  const datos = useMemo(() => {
    const estadosConvenio = instituciones.map((i) => estadoConvenio(i.fecha_fin));
    const vigentes = estadosConvenio.filter((e) => e === "Vigente").length;
    const proximos = estadosConvenio.filter((e) => e === "Próximo a vencer").length;
    const vencidos = estadosConvenio.filter((e) => e === "Vencido").length;

    // Cupos libres solo de las plazas ya aprobadas.
    const plazasLibres = plazas
      .filter((p) => p.estado === "aprobada")
      .reduce((suma, p) => suma + Math.max(0, p.capacidad - p.ocupadas), 0);

    return {
      tarjetas: {
        enCurso: practicas.filter((p) => p.estado === "en_curso").length,
        convenios: { vigentes, proximos },
        plazasLibres,
        cumplimientoPromedio: indicadores.cumplimiento_promedio,
      },
      alertas: {
        sinDocente: conteos.sinDocente,
        sinGrupo: conteos.sinGrupo,
        plazasPendientes: conteos.plazasPendientes,
        finalizadasPorDecidir: conteos.finalizadasPorDecidir,
        conveniosPorVencer: proximos + vencidos,
        bajoCumplimiento: indicadores.con_bajo_cumplimiento,
      },
      // practicas-completas ya llega ordenado de la asignación más reciente a la más antigua.
      ultimasAsignaciones: practicas.slice(0, 5),
    };
  }, [conteos, indicadores, practicas, plazas, instituciones]);

  return { ...datos, cargando };
}
