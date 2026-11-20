/**
 * src/components/Cargando.jsx
 *
 * Indicador de carga animado que reemplaza los textos sueltos
 * "Cargando…" de cada pantalla. Muestra un anillo giratorio y un
 * dinosaurio que rebota (animaciones CSS en comun.css, sección 13).
 * Con `prefers-reduced-motion` las animaciones se apagan solas.
 *
 * @param {{mensaje?: string, simple?: boolean}} props
 *   - mensaje: texto bajo la animación (por defecto "Cargando…").
 *   - simple: true para mostrar solo el anillo, sin el dinosaurio.
 */
export default function Cargando({ mensaje = "Cargando…", simple = false }) {
  return (
    <div className="cargando-caja" role="status" aria-live="polite">
      {simple ? <div className="cargando-anillo" /> : <span className="cargando-dino" aria-hidden="true">🦕</span>}
      <span>{mensaje}</span>
    </div>
  );
}
