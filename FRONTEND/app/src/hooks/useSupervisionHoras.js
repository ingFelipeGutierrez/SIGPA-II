import { useCallback, useEffect, useState } from "react";
import { obtenerReporteHoras } from "../services/reportes";

/**
 * src/hooks/useSupervisionHoras.js
 *
 * Cumplimiento de horas de los estudiantes con práctica "En curso" o
 * "Finalizada" (GET /api/reportes/horas, ya calculado en el backend:
 * horas cumplidas/requeridas, porcentaje y nivel "Bajo"/"Medio"/"Alto").
 * Usado por la página "Supervisión de horas" (CU 6) del panel del
 * Director.
 */
export function useSupervisionHoras() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [indicadores, setIndicadores] = useState({ estudiantes_en_practica: 0, cumplimiento_promedio: 0, con_bajo_cumplimiento: 0 });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const datos = await obtenerReporteHoras();
    setEstudiantes(datos.estudiantes);
    setIndicadores(datos.indicadores);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { estudiantes, indicadores, cargando, recargar: cargar };
}