import { useCallback, useEffect, useState } from "react";
import { obtenerPracticasCompletas, obtenerCalificacionesBitacora } from "../services/practicas";

/**
 * src/hooks/usePracticasPorDecidir.js
 *
 * Datos para "Decidir resultado de la práctica" (CU 1, pasos 18 a 23):
 * las prácticas en estado "finalizada", con su nota promedio ya
 * calculada a partir de todas las calificaciones de bitácora (cruce en
 * el cliente, igual que en el resto del proyecto).
 */
export function usePracticasPorDecidir() {
  const [practicas, setPracticas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [todas, calificaciones] = await Promise.all([
      obtenerPracticasCompletas(),
      obtenerCalificacionesBitacora(),
    ]);

    const sumaPorAsignacion = {};
    calificaciones.forEach((c) => {
      if (!sumaPorAsignacion[c.id_asignacion]) sumaPorAsignacion[c.id_asignacion] = { suma: 0, cuenta: 0 };
      sumaPorAsignacion[c.id_asignacion].suma += Number(c.nota);
      sumaPorAsignacion[c.id_asignacion].cuenta += 1;
    });

    setPracticas(
      todas
        .filter((p) => p.estado === "finalizada")
        .map((p) => {
          const s = sumaPorAsignacion[p.id_asignacion];
          return { ...p, notaPromedio: s ? s.suma / s.cuenta : null };
        })
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { practicas, cargando, recargar: cargar };
}