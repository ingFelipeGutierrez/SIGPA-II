import { useCallback, useEffect, useState } from "react";
import { obtenerSolicitudes } from "../services/solicitudes";

/**
 * src/hooks/useAdminSolicitudes.js
 *
 * Lista de solicitudes de registro para la página "Solicitudes de
 * registro" del Super Admin. `recargar` vuelve a pedirlas sin mostrar la
 * pantalla de carga (se usa después de aprobar o rechazar, para que la
 * tabla se actualice sin parpadear ni perder el filtro).
 */
export function useAdminSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setSolicitudes(await obtenerSolicitudes());
      setError("");
    } catch (e) {
      setError(e.message || "No se pudieron cargar las solicitudes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { solicitudes, cargando, error, recargar: cargar };
}
