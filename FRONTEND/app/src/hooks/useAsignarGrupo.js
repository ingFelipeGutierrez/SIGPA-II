import { useCallback, useEffect, useState } from "react";
import { obtenerEstudiantes, obtenerDocentesCompletos } from "../services/usuarios";
import {
  obtenerGrupos,
  obtenerGrupoEstudiante,
  obtenerAsignacionesPlaza,
  obtenerPlazas,
  obtenerAsignacionesDocente,
  obtenerInstitucionesCompletas,
  obtenerTiposPractica,
  obtenerNivelesPractica,
} from "../services/practicas";
import { estadoConvenio } from "../utils/formato";

/**
 * src/hooks/useAsignarGrupo.js
 *
 * Datos para "Asignar estudiantes a grupo de práctica" (CU 1, pasos 11
 * a 15 y 14a): estudiantes sin grupo (con su docente asesor, si ya lo
 * tienen), los grupos existentes con su "resumen" y las plazas
 * disponibles para crear un grupo nuevo.
 *
 * Importante: `grupo_practica` NO guarda la plaza, las fechas ni las
 * horas requeridas — esos valores viven en cada fila de
 * `asignacion_plaza` (uno por estudiante). Por eso el "resumen" de un
 * grupo existente se resuelve tomando cualquier asignación de plaza que
 * ya tenga ese grupo (todas comparten la misma plaza/fechas/horas,
 * porque así se las entrega el director al crear el grupo) y cruzándola
 * con la plaza y la institución. Un grupo recién creado siempre nace
 * con su primera asignación en el mismo paso, así que esto nunca deja a
 * un grupo "sin resumen" en la lista.
 */
export function useAsignarGrupo() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [plazasDisponibles, setPlazasDisponibles] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  // Mayor numero_grupo existente (de TODOS los grupos, aunque aún no tengan
  // asignaciones): el grupo nuevo toma este valor + 1.
  const [maxNumeroGrupo, setMaxNumeroGrupo] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [
      todosEstudiantes,
      todosDocentes,
      gruposDb,
      grupoEstudiante,
      asignacionesPlaza,
      plazas,
      asignacionesDocente,
      instituciones,
      tiposDb,
      nivelesDb,
    ] = await Promise.all([
      obtenerEstudiantes(),
      obtenerDocentesCompletos(),
      obtenerGrupos(),
      obtenerGrupoEstudiante(),
      obtenerAsignacionesPlaza(),
      obtenerPlazas(),
      obtenerAsignacionesDocente(),
      obtenerInstitucionesCompletas(),
      obtenerTiposPractica(),
      obtenerNivelesPractica(),
    ]);

    const institucionPorId = {};
    instituciones.forEach((i) => { institucionPorId[i.id_institucion] = i; });

    const plazaPorId = {};
    plazas.forEach((p) => { plazaPorId[p.id_plaza] = p; });

    const docentePorId = {};
    todosDocentes.forEach((d) => { docentePorId[d.id_usuario] = `${d.nombre} ${d.apellido}`; });

    // Cuántas asignaciones "ocupan" cada plaza (todo lo que no sea un cupo
    // liberado: rechazada o cambiada), igual que en usePlazasDirector.
    const ocupadosPorPlaza = {};
    asignacionesPlaza.forEach((a) => {
      if (a.estado !== "rechazada" && a.estado !== "cambiada") {
        ocupadosPorPlaza[a.plaza_id] = (ocupadosPorPlaza[a.plaza_id] || 0) + 1;
      }
    });

    const conGrupo = new Set(grupoEstudiante.map((ge) => ge.id_estudiante));

    const docenteActivoPorEstudiante = {};
    asignacionesDocente.forEach((a) => {
      if (a.estado === "ACTIVO") docenteActivoPorEstudiante[a.id_estudiante] = a.id_docente;
    });

    setEstudiantes(
      todosEstudiantes
        .filter((e) => !conGrupo.has(e.id_usuario))
        .map((e) => ({
          id_usuario: e.id_usuario,
          nombre: `${e.nombre} ${e.apellido}`,
          docenteAsesor: docentePorId[docenteActivoPorEstudiante[e.id_usuario]] || "Sin docente asesor",
        }))
    );

    setGrupos(
      gruposDb
        .map((g) => {
          const referencia = asignacionesPlaza.find((a) => a.id_grupo === g.id_grupo);
          const plaza = referencia && plazaPorId[referencia.plaza_id];
          if (!referencia || !plaza) return null; // sin resumen resoluble: no se ofrece en el desplegable
          const institucion = institucionPorId[plaza.institucion_id];
          return {
            id_grupo: g.id_grupo,
            nombre: g.nombre,
            tipo_practica: g.tipo_practica,
            nivel_practica: g.nivel_practica,
            plaza_id: plaza.id_plaza,
            institucion_nombre: institucion ? institucion.nombre : "—",
            estadoConvenio: institucion ? estadoConvenio(institucion.fecha_fin) : "Sin convenio",
            fecha_inicio: referencia.fecha_inicio,
            fecha_fin: referencia.fecha_fin,
            horas_requeridas: referencia.horas_requeridas,
            cuposLibres: plaza.capacidad - (ocupadosPorPlaza[plaza.id_plaza] || 0),
          };
        })
        .filter(Boolean)
    );

    setPlazasDisponibles(
      plazas
        .filter((p) => p.estado === "aprobada")
        .map((p) => {
          const institucion = institucionPorId[p.institucion_id];
          return {
            ...p,
            institucion_nombre: institucion ? institucion.nombre : "—",
            estadoConvenio: institucion ? estadoConvenio(institucion.fecha_fin) : "Sin convenio",
            cuposLibres: p.capacidad - (ocupadosPorPlaza[p.id_plaza] || 0),
          };
        })
        .filter((p) => p.cuposLibres > 0)
    );

    setMaxNumeroGrupo(gruposDb.reduce((m, g) => Math.max(m, Number(g.numero_grupo) || 0), 0));
    setTipos(tiposDb);
    setNiveles(nivelesDb);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { estudiantes, grupos, plazasDisponibles, tipos, niveles, maxNumeroGrupo, cargando, recargar: cargar };
}