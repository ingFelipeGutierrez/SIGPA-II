/**
 * src/services/solicitudes.js
 *
 * Llamadas al router /api/solicitudes del backend (base neondb): las
 * solicitudes de registro que llegan cuando alguien entra con Google y
 * su cuenta aún no existe. Usado por el panel del Super Admin para
 * listarlas y aprobarlas o rechazarlas.
 */
import { apiGet, apiEnviar } from "./api";

const BASE = "/api/solicitudes";

/** Todas las solicitudes, de la más reciente a la más antigua. */
export const obtenerSolicitudes = () => apiGet(BASE);

/** Aprueba: el backend crea el usuario real con su rol y marca la solicitud como APROBADA. */
export const aprobarSolicitud = (idSolicitud) => apiEnviar(`${BASE}/${idSolicitud}/aprobar`, "PUT");

/** Rechaza con un motivo obligatorio (la base exige motivo cuando el estado es RECHAZADA). */
export const rechazarSolicitud = (idSolicitud, motivo) =>
  apiEnviar(`${BASE}/${idSolicitud}/rechazar`, "PUT", { motivo });
