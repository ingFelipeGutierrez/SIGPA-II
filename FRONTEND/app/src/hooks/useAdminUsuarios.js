import { useCallback, useEffect, useState } from "react";
import { obtenerUsuarios, obtenerEstudiantes, obtenerDocentesCompletos } from "../services/usuarios";

/**
 * src/hooks/useAdminUsuarios.js
 *
 * Lista de usuarios para la página "Usuarios" del Super Admin: todas las
 * personas con su rol y, según el rol, su programa y semestre
 * (estudiante) o su especialidad (docente). Los datos de cada rol viven
 * en tablas distintas, así que se piden por separado y se unen aquí.
 * `recargar` refresca sin pantalla de carga (después de crear, editar o
 * eliminar).
 */
export function useAdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const [todos, estudiantes, docentes] = await Promise.all([
        obtenerUsuarios(),
        obtenerEstudiantes(),
        obtenerDocentesCompletos(),
      ]);
      const porEstudiante = new Map(estudiantes.map((e) => [e.id_usuario, e]));
      const porDocente = new Map(docentes.map((d) => [d.id_usuario, d]));
      setUsuarios(
        todos.map((u) => ({
          ...u,
          programa: porEstudiante.get(u.id_usuario)?.programa ?? "",
          semestre: porEstudiante.get(u.id_usuario)?.semestre ?? "",
          especialidad: porDocente.get(u.id_usuario)?.especialidad ?? "",
        }))
      );
      setError("");
    } catch (e) {
      setError(e.message || "No se pudieron cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ver useMiPractica para la misma justificación
    cargar();
  }, [cargar]);

  return { usuarios, cargando, error, recargar: cargar };
}
