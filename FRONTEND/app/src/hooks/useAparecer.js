import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * src/hooks/useAparecer.js
 *
 * Microinteracción de entrada: los elementos que coinciden con `selector`
 * dentro del contenedor `ref` aparecen subiendo un poco y con fade, uno
 * tras otro (stagger). Se repite cuando cambia `clave` (por ejemplo al
 * cambiar un filtro y pintarse filas nuevas). Se omite si la persona
 * tiene activado "reducir movimiento" en su sistema.
 *
 * @param {React.RefObject<HTMLElement>} ref  Contenedor que agrupa los elementos.
 * @param {string} selector  Selector CSS de los elementos a animar (ej. "tbody tr").
 * @param {unknown} clave  Cuando cambia, la animación vuelve a correr.
 */
export function useAparecer(ref, selector, clave) {
  useEffect(() => {
    const nodos = ref.current?.querySelectorAll(selector);
    if (!nodos || nodos.length === 0) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const animacion = gsap.fromTo(
      nodos,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power2.out", clearProps: "opacity,transform" }
    );
    return () => {
      animacion.kill();
      gsap.set(nodos, { clearProps: "opacity,transform" });
    };
  }, [ref, selector, clave]);
}
