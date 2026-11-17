import { useCallback, useEffect, useState } from "react";
import { obtenerEstudiantes, obtenerDocentesCompletos } from "../services/usuarios";
import { obtenerDocenteCupo, obtenerAsignacionesDocente, obtenerPracticasCompletas } from "../services/practicas";

/**
 * src/hooks/useAsignarDocente.js
 *
 * Datos para "Asignar docente asesor" (CU 1, pasos 5 a 10): estudiantes
 * sin docente asesor activo (con la institución o grupo que ya tengan,
 * si los tienen) y los docentes asesores con su cupo ya resuelto
 * (asignados sobre el máximo), para deshabilitar en la lista a los que
 * no tienen disponibilidad.
 *
 * Solo entran a la lista de docentes los que ya tienen una fila en
 * docente_cupo: sin ella, POST /asignacion-docente falla (es la
 * información base que pide la precondición del caso de uso).
 */
export function useAsignarDocente() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [todosEstudiantes, todosDocentes, cupos, asignaciones, practicas] = await Promise.all([
      obtenerEstudiantes(),
      obtenerDocentesCompletos(),
      obtenerDocenteCupo(),
      obtenerAsignacionesDocente(),
      obtenerPracticasCompletas(),
    ]);

    const activasPorDocente = {};
    const conDocenteActivo = new Set();
    asignaciones.forEach((a) => {
      if (a.estado === "ACTIVO") {
        activasPorDocente[a.id_docente] = (activasPorDocente[a.id_docente] || 0) + 1;
        conDocenteActivo.add(a.id_estudiante);
      }
    });

    const institucionOGrupoPorEstudiante = {};
    practicas.forEach((p) => {
      institucionOGrupoPorEstudiante[p.id_estudiante] = p.institucion || p.grupo_nombre || null;
    });

    setEstudiantes(
      todosEstudiantes
        .filter((e) => !conDocenteActivo.has(e.id_usuario))
        .map((e) => ({
          id_usuario: e.id_usuario,
          nombre: `${e.nombre} ${e.apellido}`,
          institucionOGrupo: institucionOGrupoPorEstudiante[e.id_usuario] || "—",
        }))
    );

    const cupoPorDocente = {};
    cupos.forEach((c) => { cupoPorDocente[c.id_docente] = c; });

    setDocentes(
      todosDocentes
        .filter((d) => cupoPorDocente[d.id_usuario])
        .map((d) => {
          const cupo = cupoPorDocente[d.id_usuario];
          const asignados = activasPorDocente[d.id_usuario] || 0;
          return {
            id_usuario: d.id_usuario,
            nombre: `${d.nombre} ${d.apellido}`,
            asignados,
            cupoMaximo: cupo.cupo_maximo,
            disponible: asignados < cupo.cupo_maximo,
          };
        })
    );

    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { estudiantes, docentes, cargando, recargar: cargar };
}