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
import DirectorInicio from "./pages/director/DirectorInicio";
import DirectorReportes from "./pages/director/DirectorReportes";
import AdminInicio from "./pages/admin/AdminInicio";
import AdminSolicitudes from "./pages/admin/AdminSolicitudes";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import { useAuth } from "./context/AuthContext";

/**
 * src/App.jsx
 * Define las rutas de toda la aplicación. El panel de cada rol vive bajo
 * su propio PanelLayout (menú lateral + topbar propios de ese rol);
 * dentro de /estudiante, cada página hija se renderiza en el <Outlet/>
 * del layout. Los cuatro paneles (Estudiante, Docente, Director
 * y Super Admin) están definidos aquí.
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
        <Route index element={<DirectorInicio />} />
        <Route path="practicas" element={<DirectorGestionar />} />
        <Route path="practicas/docente" element={<DirectorAsignarDocente />} />
        <Route path="practicas/grupo" element={<DirectorAsignarGrupo />} />
        <Route path="practicas/plazas" element={<DirectorPlazas />} />
        <Route path="practicas/resultado" element={<DirectorDecidirResultado />} />
        <Route path="instituciones" element={<DirectorInstituciones />} />
        <Route path="estado" element={<DirectorEstado />} />
        <Route path="supervision" element={<DirectorSupervision />} />
        <Route path="reportes" element={<DirectorReportes />} />
      </Route>

      <Route path="/admin" element={<RutaPrivada rol="ADMIN_SISTEMA"><PanelAdmin /></RutaPrivada>}>
        <Route index element={<AdminInicio />} />
        <Route path="solicitudes" element={<AdminSolicitudes />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
      </Route>
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

/** Menú lateral del panel del Super Admin (solicitudes de registro y usuarios). */
function PanelAdmin() {
  return (
    <PanelLayout
      titulo="Panel Super Admin"
      rolClase="rol-admin"
      rolEtiqueta="Super Admin"
      menu={[
        { icono: "🏠", etiqueta: "Inicio", ruta: "" },
        { icono: "📨", etiqueta: "Solicitudes de registro", ruta: "solicitudes" },
        { icono: "👥", etiqueta: "Usuarios", ruta: "usuarios" },
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
