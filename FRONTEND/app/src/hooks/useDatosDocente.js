import { useCallback, useEffect, useState } from "react";
import { obtenerEstudiantesDocente, obtenerCalificacionesPorAsignacion } from "../services/practicas";
import { obtenerBitacorasDocente } from "../services/bitacoras";
import { conEstadoPractica } from "../utils/formato";

/**
 * src/hooks/useDatosDocente.js
 *
 * Trae, para el docente asesor con sesión iniciada, sus estudiantes
 * asignados (desde PostgreSQL/Neon, vía /estudiantes-docente) y TODAS las
 * bitácoras de esos estudiantes (desde MongoDB, vía /bitacoras/docente-real).
 * Las dos colecciones nunca se cruzan con un JOIN de SQL: el cruce
 * (nombre del estudiante en cada bitácora, horas cumplidas por
 * estudiante) se hace aquí, en JavaScript, igual que en el resto del
 * proyecto.
 *
 * Lo usan las tres páginas del panel de Docente (Inicio, Mis estudiantes
 * y Bitácoras por revisar) para no repetir esta lógica tres veces.
 */
export function useDatosDocente(idDocente) {
  const [estudiantesBase, setEstudiantesBase] = useState([]);
  const [bitacoras, setBitacoras] = useState([]);
  const [notaPorBitacora, setNotaPorBitacora] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [ests, bits] = await Promise.all([
        obtenerEstudiantesDocente(idDocente),
        obtenerBitacorasDocente(idDocente),
      ]);
      setEstudiantesBase(ests.map((e) => (e.id_asignacion ? conEstadoPractica({ ...e, tiene_docente: true }) : e)));
      setBitacoras(bits);

      // La nota vive en calificacion_bitacora (Postgres), indexada por
      // id_asignacion; se trae una vez por cada asignación distinta que
      // aparezca entre las bitácoras y se arma un mapa bitacora_id -> fila,
      // para no repetir esta consulta en cada página que necesita la nota.
      const idsAsignacion = [...new Set(bits.map((b) => b.id_asignacion))];
      const listas = await Promise.all(idsAsignacion.map((id) => obtenerCalificacionesPorAsignacion(id)));
      const mapa = {};
      listas.flat().forEach((cal) => { mapa[cal.bitacora_id] = cal; });
      setNotaPorBitacora(mapa);
    } finally {
      setCargando(false);
    }
  }, [idDocente]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  // Nombre del estudiante por id, para pintarlo en la tabla de bitácoras
  // (que solo trae estudiante_id, no el nombre).
  const nombrePorEstudiante = Object.fromEntries(estudiantesBase.map((e) => [e.id_estudiante, e.estudiante]));

  // Horas cumplidas = suma de horas_registradas de las bitácoras en
  // estado "aprobada" de ese estudiante (las únicas que cuentan para el
  // avance, igual que en el panel de Estudiante).
  const estudiantes = estudiantesBase.map((e) => {
    const horasCumplidas = bitacoras
      .filter((b) => b.estudiante_id === e.id_estudiante && b.estado === "aprobada")
      .reduce((suma, b) => suma + Number(b.horas_registradas || 0), 0);
    const horasRequeridas = e.horas_requeridas || 0;
    const porcentaje = horasRequeridas > 0 ? Math.min(100, Math.round((horasCumplidas / horasRequeridas) * 100)) : 0;
    return { ...e, horasCumplidas, porcentaje };
  });

  const bitacorasConNombre = bitacoras.map((b) => ({
    ...b,
    estudianteNombre: nombrePorEstudiante[b.estudiante_id] || "Estudiante",
    nota: notaPorBitacora[b._id]?.nota ?? null,
  }));

  return { estudiantes, bitacoras: bitacorasConNombre, notaPorBitacora, cargando, recargar: cargar };
}