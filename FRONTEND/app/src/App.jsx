import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PanelLayout from "./layouts/PanelLayout";
import EstudianteInicio from "./pages/estudiante/EstudianteInicio";
import EstudiantePractica from "./pages/estudiante/EstudiantePractica";
import EstudianteBitacoras from "./pages/estudiante/EstudianteBitacoras";
import NuevaBitacora from "./pages/estudiante/NuevaBitacora";
import EstudianteEvaluaciones from "./pages/estudiante/EstudianteEvaluaciones";
import { useAuth } from "./context/AuthContext";

/**
 * src/App.jsx
 * Define las rutas de toda la aplicación. El panel de cada rol vive bajo
 * su propio PanelLayout (menú lateral + topbar propios de ese rol);
 * dentro de /estudiante, cada página hija se renderiza en el <Outlet/>
 * del layout. Los paneles de Docente, Director y Admin se agregan aquí
 * mismo a medida que se van construyendo.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/estudiante" element={<RutaPrivada rol="ESTUDIANTE"><PanelEstudiante /></RutaPrivada>}>
        <Route index element={<EstudianteInicio />} />
        <Route path="practica" element={<EstudiantePractica />} />
        <Route path="bitacoras" element={<EstudianteBitacoras />} />
        <Route path="bitacoras/nueva" element={<NuevaBitacora />} />
        <Route path="bitacoras/:idBitacora/corregir" element={<NuevaBitacora />} />
        <Route path="evaluaciones" element={<EstudianteEvaluaciones />} />
      </Route>

      {/* Paneles de Docente, Director y Admin: pendientes de construir. */}
      <Route path="/docente/*" element={<PanelProvisional titulo="Panel Docente" />} />
      <Route path="/director/*" element={<PanelProvisional titulo="Panel Director" />} />
      <Route path="/admin/*" element={<PanelProvisional titulo="Panel Super Admin" />} />
    </Routes>
  );
}

/** Menú lateral del panel de Estudiante (CU 1, 2 y 3). */
function PanelEstudiante() {
  return (
    <PanelLayout
      titulo="Panel del Estudiante"
      rolClase="rol-estudiante"
      rolEtiqueta="Estudiante"
      menu={[
        { icono: "🏠", etiqueta: "Inicio", ruta: "" },
        { icono: "📋", etiqueta: "Mi práctica", ruta: "practica" },
        { icono: "📝", etiqueta: "Bitácoras", ruta: "bitacoras" },
        { icono: "⭐", etiqueta: "Evaluaciones", ruta: "evaluaciones" },
      ]}
    />
  );
}

/** Evita que alguien entre a un panel sin sesión, o con el rol equivocado. */
function RutaPrivada({ rol, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/" replace />;
  if (rol && usuario.rol !== rol) return <Navigate to="/" replace />;
  return children;
}

function PanelProvisional({ titulo }) {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h2>{titulo}</h2>
      <p>Hola, {usuario?.nombre} {usuario?.apellido} ({usuario?.rol})</p>
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </div>
  );
}
