import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/estudiante" element={<PanelProvisional titulo="Panel Estudiante" />} />
      <Route path="/docente" element={<PanelProvisional titulo="Panel Docente" />} />
      <Route path="/director" element={<PanelProvisional titulo="Panel Director" />} />
      <Route path="/admin" element={<PanelProvisional titulo="Panel Super Admin" />} />
    </Routes>
  );
}