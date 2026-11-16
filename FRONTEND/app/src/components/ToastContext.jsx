import { createContext, useCallback, useContext, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * src/components/ToastContext.jsx
 *
 * Cola de mensajes emergentes (toast), equivalente a `mostrarToast()` del
 * prototipo original. Aquí la entrada/salida de cada mensaje la anima
 * GSAP en vez de depender de @keyframes puro en CSS: como la lista de
 * toasts vive en el estado de React (se agregan y quitan dinámicamente),
 * GSAP permite animar la salida ANTES de desmontar el elemento, algo que
 * CSS solo no puede hacer limpiamente dentro de un componente de React.
 *
 * Uso: const { mostrarToast } = useToast(); mostrarToast("Guardado", "ok");
 */
const ToastContext = createContext(null);

let contador = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const refs = useRef({}); // id -> nodo DOM del toast, para animar su salida

  const quitarToast = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id));
    delete refs.current[id];
  }, []);

  const mostrarToast = useCallback((mensaje, tipo = "info") => {
    const id = ++contador;
    setToasts((lista) => [...lista, { id, mensaje, tipo }]);

    // A los 3.6s empieza a salir (igual que el prototipo original), y a
    // los 4s se quita del todo del estado.
    setTimeout(() => {
      const nodo = refs.current[id];
      if (nodo) {
        gsap.to(nodo, { opacity: 0, x: 20, duration: 0.35, onComplete: () => quitarToast(id) });
      } else {
        quitarToast(id);
      }
    }, 3600);
  }, [quitarToast]);

  const registrarRef = useCallback((id, nodo) => {
    if (nodo) {
      refs.current[id] = nodo;
      // Entrada: desliza desde la derecha y aparece (equivalente a
      // @keyframes toast-entra del CSS original, pero orquestado en JS).
      gsap.fromTo(nodo, { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
    }
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div id="toast-contenedor">
        {toasts.map((t) => (
          <div
            key={t.id}
            ref={(nodo) => registrarRef(t.id, nodo)}
            className={`toast toast-${t.tipo}`}
            role="status"
          >
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook para disparar mensajes emergentes desde cualquier componente. */
// eslint-disable-next-line react-refresh/only-export-components -- hook y Provider comparten contexto, se mantienen juntos a propósito
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
