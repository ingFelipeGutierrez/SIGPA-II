import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PanelLayout from "./layouts/PanelLayout";
import EstudianteInicio from "./pages/estudiante/EstudianteInicio";
import EstudiantePractica from "./pages/estudiante/EstudiantePractica";
import EstudianteBitacoras from "./pages/estudiante/EstudianteBitacoras";
import NuevaBitacora from "./pages/estudiante/NuevaBitacora";
import EstudianteEvaluaciones from "./pages/estudiante/EstudianteEvaluaciones";
import DocenteInicio from "./pages/docente/DocenteInicio";
import DocenteEstudiantes from "./pages/docente/DocenteEstudiantes";
import DocenteBitacoras from "./pages/docente/DocenteBitacoras";
import DirectorGestionar from "./pages/director/DirectorGestionar";
import DirectorAsignarDocente from "./pages/director/DirectorAsignarDocente";
import DirectorAsignarGrupo from "./pages/director/DirectorAsignarGrupo";
import DirectorPlazas from "./pages/director/DirectorPlazas";
import DirectorDecidirResultado from "./pages/director/DirectorDecidirResultado";
import DirectorInstituciones from "./pages/director/DirectorInstituciones";
import DirectorEstado from "./pages/director/DirectorEstado";
import DirectorSupervision from "./pages/director/DirectorSupervision";
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

      <Route path="/docente" element={<RutaPrivada rol="DOCENTE"><PanelDocente /></RutaPrivada>}>
        <Route index element={<DocenteInicio />} />
        <Route path="estudiantes" element={<DocenteEstudiantes />} />
        <Route path="bitacoras" element={<DocenteBitacoras />} />
      </Route>

      <Route path="/director" element={<RutaPrivada rol="DIRECTOR"><PanelDirector /></RutaPrivada>}>
        <Route index element={<PaginaPendiente titulo="Inicio" />} />
        <Route path="practicas" element={<DirectorGestionar />} />
        <Route path="practicas/docente" element={<DirectorAsignarDocente />} />
        <Route path="practicas/grupo" element={<DirectorAsignarGrupo />} />
        <Route path="practicas/plazas" element={<DirectorPlazas />} />
        <Route path="practicas/resultado" element={<DirectorDecidirResultado />} />
        <Route path="instituciones" element={<DirectorInstituciones />} />
        <Route path="estado" element={<DirectorEstado />} />
        <Route path="supervision" element={<DirectorSupervision />} />
        <Route path="reportes" element={<PaginaPendiente titulo="Reportes" />} />
      </Route>

      {/* Panel de Admin: pendiente de construir. */}
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

/** Menú lateral del panel de Docente (CU 1, 2, 3 y 4). */
function PanelDocente() {
  return (
    <PanelLayout
      titulo="Panel del Docente"
      rolClase="rol-docente"
      rolEtiqueta="Docente Asesor"
      menu={[
        { icono: "🏠", etiqueta: "Inicio", ruta: "" },
        { icono: "👥", etiqueta: "Mis estudiantes", ruta: "estudiantes" },
        { icono: "📝", etiqueta: "Bitácoras por revisar", ruta: "bitacoras" },
      ]}
    />
  );
}

/** Menú lateral del panel del Director (CU 1 a 7). */
function PanelDirector() {
  return (
    <PanelLayout
      titulo="Panel del Director"
      rolClase="rol-director"
      rolEtiqueta="Director de Programa"
      menu={[
        { icono: "🏠", etiqueta: "Inicio", ruta: "" },
        { icono: "📋", etiqueta: "Gestionar prácticas", ruta: "practicas" },
        { icono: "🏫", etiqueta: "Instituciones receptoras", ruta: "instituciones" },
        { icono: "📊", etiqueta: "Estado de las prácticas", ruta: "estado" },
        { icono: "⏱️", etiqueta: "Supervisión de horas", ruta: "supervision" },
        { icono: "📈", etiqueta: "Reportes", ruta: "reportes" },
      ]}
    />
  );
}

/** Página de una sección del panel del Director aún en construcción. */
function PaginaPendiente({ titulo }) {
  return (
    <div className="page">
      <div className="page-title"><h1>{titulo}</h1></div>
      <div className="card vacio">Esta sección está en construcción. Vuelve pronto.</div>
    </div>
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