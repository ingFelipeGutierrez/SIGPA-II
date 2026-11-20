import { useCallback, useEffect, useState } from "react";
import { obtenerMiPractica } from "../services/practicas";
import { obtenerBitacorasEstudiante } from "../services/bitacoras";
import { conEstadoPractica } from "../utils/formato";

/**
 * src/hooks/useMiPractica.js
 *
 * Trae, para el estudiante con sesión iniciada, su plaza asignada (desde
 * PostgreSQL/Neon) y sus bitácoras (desde MongoDB), y calcula las horas
 * cumplidas sumando las bitácoras en estado "aprobada" — las dos bases
 * nunca se cruzan con un JOIN de SQL, el cruce se hace aquí en
 * JavaScript, como se decidió para todo el proyecto.
 *
 * Lo usan tanto la página de Inicio como la de "Mi práctica", para no
 * repetir esta lógica en los dos sitios.
 */
export function useMiPractica(idEstudiante) {
  const [practica, setPractica] = useState(undefined); // undefined = cargando, null = sin plaza
  const [bitacoras, setBitacoras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [pr, bits] = await Promise.all([
        obtenerMiPractica(idEstudiante),
        obtenerBitacorasEstudiante(idEstudiante),
      ]);
      setPractica(conEstadoPractica(pr));
      setBitacoras(bits);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [idEstudiante]);

  useEffect(() => {
    // La regla react-hooks/set-state-in-effect marca este patrón porque, en
    // general, llamar setState sincrónicamente dentro de un efecto puede
    // encadenar renders innecesarios. Aquí es el patrón correcto: es la
    // única forma de disparar la carga de datos al montar el componente
    // (o cuando cambia idEstudiante), y `cargar` ya actualiza el estado de
    // forma asíncrona dentro de su propio then/catch, no de golpe aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const horasCumplidas = bitacoras
    .filter((b) => b.estado === "aprobada")
    .reduce((suma, b) => suma + Number(b.horas_registradas || 0), 0);

  const horasRequeridas = practica?.horas_requeridas || 0;
  const porcentajeHoras = horasRequeridas > 0
    ? Math.min(100, Math.round((horasCumplidas / horasRequeridas) * 100))
    : 0;

  return { practica, bitacoras, cargando, error, horasCumplidas, porcentajeHoras, recargar: cargar };
}
