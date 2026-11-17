import { useCallback, useEffect, useState } from "react";
import {
  obtenerInstitucionesCompletas,
  obtenerPlazas,
  obtenerAsignacionesPlaza,
} from "../services/practicas";
import { estadoConvenio, diasRestantesConvenio } from "../utils/formato";

/**
 * src/hooks/useInstitucionesDirector.js
 *
 * Datos para la página "Instituciones receptoras" del panel del
 * Director (CU 3 — Gestionar convenios institucionales): cada
 * institución con su convenio más reciente (ya resuelto en el backend
 * con un LEFT JOIN LATERAL), más sus cupos de plaza (ocupadas/totales)
 * y el estado de vigencia de su convenio.
 *
 * Los cupos se calculan aquí cruzando dos consultas independientes
 * (plazas y asignacion-plaza) en vez de pedirle al backend un JOIN
 * entre ellas, igual que en el resto de los paneles del proyecto.
 */
export function useInstitucionesDirector() {
  const [instituciones, setInstituciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [insts, plazas, asignaciones] = await Promise.all([
      obtenerInstitucionesCompletas(),
      obtenerPlazas(),
      obtenerAsignacionesPlaza(),
    ]);

    // Cuántas asignaciones "ocupan" cada plaza (todo lo que no sea un
    // cupo liberado: rechazada o cambiada), igual que en el reporte de
    // convenios del backend.
    const ocupadosPorPlaza = {};
    asignaciones.forEach((a) => {
      if (a.estado !== "rechazada" && a.estado !== "cambiada") {
        ocupadosPorPlaza[a.plaza_id] = (ocupadosPorPlaza[a.plaza_id] || 0) + 1;
      }
    });

    // Cupos totales/ocupados agregados por institución.
    const cuposPorInstitucion = {};
    plazas.forEach((p) => {
      if (!cuposPorInstitucion[p.institucion_id]) {
        cuposPorInstitucion[p.institucion_id] = { totales: 0, ocupadas: 0 };
      }
      cuposPorInstitucion[p.institucion_id].totales += p.capacidad;
      cuposPorInstitucion[p.institucion_id].ocupadas += ocupadosPorPlaza[p.id_plaza] || 0;
    });

    const lista = insts.map((i) => {
      const cupos = cuposPorInstitucion[i.id_institucion] || { totales: 0, ocupadas: 0 };
      return {
        ...i,
        plazasTotales: cupos.totales,
        plazasOcupadas: cupos.ocupadas,
        estadoConvenio: estadoConvenio(i.fecha_fin),
        diasRestantes: diasRestantesConvenio(i.fecha_fin),
      };
    });

    setInstituciones(lista);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { instituciones, cargando, recargar: cargar };
}