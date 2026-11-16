import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { iniciales } from "../utils/formato";

/**
 * src/layouts/PanelLayout.jsx
 *
 * Estructura compartida por los cuatro paneles (Estudiante, Docente,
 * Director, Super Admin): menú lateral izquierdo, barra superior con el
 * usuario y su avatar, zona de contenido (donde se renderizan las
 * páginas hijas vía <Outlet/>) y pie de página. Es el equivalente en
 * componente de la plantilla que se repetía al inicio de cada
 * *.html del prototipo (sidebar + topbar + .content + footer).
 *
 * El color de acento de cada rol sigue viniendo de la clase `rol-*` en
 * <body> (definida en comun.css), que este layout pone y quita según el
 * rol de la persona que inició sesión.
 *
 * @param {{titulo: string, rolClase: string, rolEtiqueta: string, menu: {icono: string, etiqueta: string, ruta: string}[]}} props
 */
export default function PanelLayout({ titulo, rolClase, rolEtiqueta, menu }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  // comun.css define el color de acento y el cajón del menú móvil a partir
  // de clases en <body> (body.rol-estudiante, body.menu-abierto). React no
  // puede renderizar un <body> propio (ya existe el real en index.html), así
  // que esas clases se sincronizan a mano en el <body> real del documento.
  useEffect(() => {
    document.body.className = `${rolClase} ${menuMovilAbierto ? "menu-abierto" : ""}`.trim();
    return () => { document.body.className = ""; };
  }, [rolClase, menuMovilAbierto]);

  function salir() {
    cerrarSesion();
    navigate("/");
  }

  return (
    <>
      <section id="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            🎓 SIGPA
            <small>Gestión de Prácticas</small>
          </div>
          <span className="sidebar-rol">{rolEtiqueta}</span>
          <ul className="menu">
            {menu.map((item) => (
              <li key={item.ruta}>
                <NavLink
                  to={item.ruta}
                  end={item.ruta === ""}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setMenuMovilAbierto(false)}
                >
                  {item.icono} {item.etiqueta}
                </NavLink>
              </li>
            ))}
            <li>
              <button onClick={salir}>🚪 Cerrar sesión</button>
            </li>
          </ul>
        </aside>

        <main className="main">
          <header className="topbar">
            <button
              className="hamburguesa"
              aria-label="Menú"
              onClick={() => setMenuMovilAbierto((v) => !v)}
            >
              ☰
            </button>
            <div className="topbar-title">{titulo}</div>
            <div className="user">
              <div>
                <strong>{usuario?.nombre} {usuario?.apellido}</strong>
                <br />
                <small>{rolEtiqueta}</small>
              </div>
              <div className="avatar">{iniciales(`${usuario?.nombre} ${usuario?.apellido}`)}</div>
            </div>
          </header>

          <div className="content">
            <Outlet />
          </div>

          <footer className="footer-copy">
            <span>
              &copy; {new Date().getFullYear()} <strong className="marca">SIGPA II</strong> · Todos los
              derechos reservados.
            </span>
          </footer>
        </main>
      </section>
    </>
  );
}
