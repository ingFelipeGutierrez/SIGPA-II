import { useCallback, useEffect, useState } from "react";
import { obtenerAsignacionesDocente, obtenerPlazas, obtenerPracticasCompletas } from "../services/practicas";
import { obtenerEstudiantes } from "../services/usuarios";

/**
 * src/hooks/useGestionarPracticas.js
 *
 * Los 4 contadores de la página "Gestionar prácticas" (CU 1 — tarjetas
 * de acción): estudiantes sin docente asesor, estudiantes sin grupo,
 * plazas pendientes de decisión y prácticas finalizadas por decidir.
 * Se calculan aquí cruzando varias consultas ya existentes, en vez de
 * pedirle al backend un endpoint solo para los conteos.
 */
export function useGestionarPracticas() {
  const [conteos, setConteos] = useState({ sinDocente: 0, sinGrupo: 0, plazasPendientes: 0, finalizadasPorDecidir: 0 });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [estudiantes, asignacionesDocente, practicas, plazas] = await Promise.all([
      obtenerEstudiantes(),
      obtenerAsignacionesDocente(),
      obtenerPracticasCompletas(),
      obtenerPlazas(),
    ]);

    const conDocenteActivo = new Set(
      asignacionesDocente.filter((a) => a.estado === "ACTIVO").map((a) => a.id_estudiante)
    );
    const conGrupo = new Set(practicas.map((p) => p.id_estudiante));

    setConteos({
      sinDocente: estudiantes.filter((e) => !conDocenteActivo.has(e.id_usuario)).length,
      sinGrupo: estudiantes.filter((e) => !conGrupo.has(e.id_usuario)).length,
      plazasPendientes: plazas.filter((p) => p.estado === "pendiente").length,
      finalizadasPorDecidir: practicas.filter((p) => p.estado === "finalizada").length,
    });
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { conteos, cargando, recargar: cargar };
}