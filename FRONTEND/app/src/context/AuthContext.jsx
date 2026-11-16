import { createContext, useContext, useState } from "react";

/**
 * src/context/AuthContext.jsx
 *
 * Guarda quién inició sesión (lo que devuelve POST /api/login: id_usuario,
 * nombre, apellido, email, rol) en memoria de React y en localStorage,
 * para que sobreviva a un refresco de página. No valida nada contra el
 * backend por sí solo: eso ya lo hizo /api/login antes de llamar a
 * `iniciarSesion`.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  });

  const iniciarSesion = (u) => {
    setUsuario(u);
    localStorage.setItem("usuario", JSON.stringify(u));
  };

  const cerrarSesion = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
  };

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para leer el usuario de la sesión actual desde cualquier componente. */
// eslint-disable-next-line react-refresh/only-export-components -- hook y Provider comparten contexto, se mantienen juntos a propósito
export const useAuth = () => useContext(AuthContext);
