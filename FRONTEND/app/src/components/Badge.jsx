import { claseBadge } from "../utils/formato";

/**
 * src/components/Badge.jsx
 * Etiqueta de estado con color (ej. "Pendiente" en ámbar, "Aprobada" en
 * verde). El color lo decide `claseBadge` en un solo lugar, igual que en
 * el prototipo original, para que todos los paneles usen los mismos
 * colores para el mismo estado.
 */
export default function Badge({ estado }) {
  return <span className={`badge badge-${claseBadge(estado)}`}>{estado}</span>;
}
