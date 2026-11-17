import { useCallback, useEffect, useState } from "react";
import {
  obtenerPlazas,
  obtenerInstitucionesCompletas,
  obtenerAsignacionesPlaza,
} from "../services/practicas";
import { estadoConvenio, diasRestantesConvenio } from "../utils/formato";

/**
 * src/hooks/usePlazasDirector.js
 *
 * Datos para la página "Plazas de práctica" del panel del Director
 * (CU 2 — Registrar Plaza de Práctica): cada plaza con el nombre y el
 * estado de vigencia del convenio de su institución ya resueltos, y sus
 * cupos ocupados (mismo cruce con asignacion_plaza que usa
 * useInstitucionesDirector, aquí por plaza en vez de por institución).
 *
 * También expone la lista de instituciones (con su convenio más
 * reciente) para el formulario "Registrar plaza": al elegir la
 * institución, el convenio asociado se completa solo.
 */
export function usePlazasDirector() {
  const [plazas, setPlazas] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [plazasDb, insts, asignaciones] = await Promise.all([
      obtenerPlazas(),
      obtenerInstitucionesCompletas(),
      obtenerAsignacionesPlaza(),
    ]);

    const institucionPorId = {};
    insts.forEach((i) => { institucionPorId[i.id_institucion] = i; });

    // Cuántas asignaciones "ocupan" cada plaza (todo lo que no sea un
    // cupo liberado: rechazada o cambiada), igual que en
    // useInstitucionesDirector.
    const ocupadosPorPlaza = {};
    asignaciones.forEach((a) => {
      if (a.estado !== "rechazada" && a.estado !== "cambiada") {
        ocupadosPorPlaza[a.plaza_id] = (ocupadosPorPlaza[a.plaza_id] || 0) + 1;
      }
    });

    const lista = plazasDb.map((p) => {
      const inst = institucionPorId[p.institucion_id];
      return {
        ...p,
        institucion_nombre: inst ? inst.nombre : "—",
        convenio_fecha_fin: inst ? inst.fecha_fin : null,
        estadoConvenio: inst ? estadoConvenio(inst.fecha_fin) : "Sin convenio",
        diasRestantesConvenio: inst ? diasRestantesConvenio(inst.fecha_fin) : null,
        ocupadas: ocupadosPorPlaza[p.id_plaza] || 0,
      };
    });

    setPlazas(lista);
    setInstituciones(insts);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { plazas, instituciones, cargando, recargar: cargar };
}