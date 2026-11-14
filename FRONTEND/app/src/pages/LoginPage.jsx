import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";

const RUTA_POR_ROL = {
  ESTUDIANTE: "/estudiante",
  DOCENTE: "/docente",
  DIRECTOR: "/director",
  ADMIN_SISTEMA: "/admin",
};

export default function LoginPage() {
  const [mensaje, setMensaje] = useState("");
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const manejarGoogle = async (respuestaGoogle) => {
    const { status, data } = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ credential: respuestaGoogle.credential }),
    });

    if (status === 200 && data?.autenticado) {
      iniciarSesion(data.usuario);
      navigate(RUTA_POR_ROL[data.usuario.rol] ?? "/");
    } else if (status === 202) {
      setMensaje(data.mensaje);
    } else if (status === 404) {
      // Más adelante aquí va el formulario de solicitud de registro
      setMensaje(`${data.mensaje} (${data.datos_google?.email})`);
    } else {
      setMensaje(data?.error ?? "No se pudo iniciar sesión");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", textAlign: "center" }}>
      <h1>SIGPA</h1>
      <p>Ingresa con tu cuenta institucional @udi.edu.co</p>
      <GoogleLogin
        onSuccess={manejarGoogle}
        onError={() => setMensaje("Falló el inicio de sesión con Google")}
      />
      {mensaje && <p style={{ marginTop: 16 }}>{mensaje}</p>}
    </div>
  );
}