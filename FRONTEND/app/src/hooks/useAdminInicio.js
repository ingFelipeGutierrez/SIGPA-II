import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../services/usuarios";
import { obtenerSolicitudes } from "../services/solicitudes";

/**
 * src/hooks/useAdminInicio.js
 *
 * Datos del Inicio del Super Admin: cuántas solicitudes esperan
 * respuesta, cuántos usuarios hay (total y por rol) y las 5 solicitudes
 * más recientes. Todo sale de la base relacional (neondb): usuarios y
 * solicitudes_registro.
 */
export function useAdminInicio() {
  const [datos, setDatos] = useState({ pendientes: 0, total: 0, porRol: {}, ultimas: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerUsuarios(), obtenerSolicitudes()])
      .then(([usuarios, solicitudes]) => {
        if (!activo) return;
        const porRol = {};
        usuarios.forEach((u) => {
          porRol[u.rol] = (porRol[u.rol] || 0) + 1;
        });
        setDatos({
          pendientes: solicitudes.filter((s) => s.estado === "PENDIENTE").length,
          total: usuarios.length,
          porRol,
          ultimas: solicitudes.slice(0, 5), // el backend ya las ordena de la más reciente a la más antigua
        });
        setCargando(false);
      })
      .catch((e) => {
        if (!activo) return;
        setError(e.message || "No se pudo cargar el panorama general.");
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  return { datos, cargando, error };
}
