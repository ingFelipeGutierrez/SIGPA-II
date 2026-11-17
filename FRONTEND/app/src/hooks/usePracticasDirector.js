import { useCallback, useEffect, useState } from "react";
import { obtenerPracticasCompletas } from "../services/practicas";

/**
 * src/hooks/usePracticasDirector.js
 *
 * Todas las prácticas del programa (asignacion_plaza), con institución,
 * grupo, tipo, nivel, estudiante, docente asesor y horas cumplidas ya
 * resueltos por el backend (GET /api/practicas/practicas-completas).
 * Usado por la página "Estado de las prácticas" (CU 7) del panel del
 * Director.
 */
export function usePracticasDirector() {
  const [practicas, setPracticas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const datos = await obtenerPracticasCompletas();
    setPracticas(datos);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { practicas, cargando, recargar: cargar };
}