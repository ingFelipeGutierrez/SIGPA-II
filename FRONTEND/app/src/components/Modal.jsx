import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * src/components/Modal.jsx
 *
 * Ventana modal genérica, equivalente a `abrirModal()`/`cerrarModal()` del
 * prototipo original. Admite varias apiladas (cada una con su propio
 * z-index creciente) y se cierra con click en el fondo, en el botón "X",
 * en un botón con `data-cerrar`, o con la tecla Escape.
 *
 * La entrada/salida la anima GSAP (fondo con fade, caja con scale+fade)
 * en vez de CSS puro, porque el cierre necesita esperar a que la
 * animación termine antes de desmontar el componente (`onClose`), algo
 * que un simple @keyframes de CSS no puede coordinar con React.
 */
export default function Modal({ titulo, ancho, pie, onClose, children }) {
  const fondoRef = useRef(null);
  const cajaRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(fondoRef.current, { opacity: 0 }, { opacity: 1, duration: 0.15 });
    gsap.fromTo(
      cajaRef.current,
      { opacity: 0, y: 14, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" }
    );

    function alPresionarTecla(e) {
      if (e.key === "Escape") cerrarConAnimacion();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cerrarConAnimacion() {
    gsap.to(cajaRef.current, { scale: 0.97, duration: 0.16, ease: "power1.in" });
    gsap.to(fondoRef.current, { opacity: 0, duration: 0.16, ease: "power1.in", onComplete: onClose });
  }

  function alHacerClicFondo(e) {
    if (e.target === fondoRef.current || e.target.dataset.cerrar !== undefined) cerrarConAnimacion();
  }

  return (
    <div className="modal-fondo" ref={fondoRef} onClick={alHacerClicFondo}>
      <div className={`modal-caja ${ancho ? "modal-ancho" : ""}`} ref={cajaRef} role="dialog" aria-modal="true">
        <div className="modal-cabecera">
          <h3>{titulo}</h3>
          <button className="modal-x" data-cerrar="" aria-label="Cerrar" onClick={cerrarConAnimacion}>
            ✕
          </button>
        </div>
        <div className="modal-cuerpo">{children}</div>
        {pie !== null && (
          <div className="modal-pie">
            {pie || (
              <button className="button-secondary" data-cerrar="" onClick={cerrarConAnimacion}>
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
