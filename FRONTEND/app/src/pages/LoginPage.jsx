import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";

/** A qué panel va cada rol después de iniciar sesión. */
const RUTA_POR_ROL = {
  ESTUDIANTE: "/estudiante",
  DOCENTE: "/docente",
  DIRECTOR: "/director",
  ADMIN_SISTEMA: "/admin",
};

/**
 * src/pages/LoginPage.jsx
 *
 * Pantalla de inicio de sesión, con el diseño del prototipo: panel azul
 * de marca a la izquierda y, a la derecha, el formulario. Ofrece dos
 * caminos independientes:
 *
 *  1. Usuario y contraseña de prueba (POST /api/login/prueba): pensado
 *     para los calificadores; las credenciales se muestran en el recuadro
 *     inferior. El backend lo habilita con ENABLE_TEST_LOGIN.
 *  2. Cuenta institucional @udi.edu.co con Google (POST /api/login). Si
 *     la cuenta no está registrada, la pantalla cambia al formulario
 *     "Solicitar acceso" (POST /api/solicitudes) para pedir rol de
 *     estudiante o docente.
 *
 * Mensajes que puede mostrar: credenciales incorrectas, solicitud
 * pendiente de aprobación, cuenta no registrada, dominio no permitido y
 * solicitud enviada.
 */
export default function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  // El estilo del login depende de la clase `login-body` en el <body> real.
  useEffect(() => {
    document.body.className = "login-body";
    return () => { document.body.className = ""; };
  }, []);

  const [vista, setVista] = useState("login"); // "login" | "solicitud"
  const [datosGoogle, setDatosGoogle] = useState(null);
  const [error, setError] = useState("");
  const [errorVersion, setErrorVersion] = useState(0); // reinicia la animación de sacudida en cada error
  const [aviso, setAviso] = useState(null); // { tipo: "info" | "ambar", texto }

  function mostrarError(texto) {
    setAviso(null);
    setError(texto);
    setErrorVersion((v) => v + 1);
  }

  function entrar(usuario) {
    iniciarSesion(usuario);
    navigate(RUTA_POR_ROL[usuario.rol] ?? "/");
  }

  /** Respuesta de Google: autenticado, pendiente, no registrado o rechazado. */
  async function manejarGoogle(respuestaGoogle) {
    setError("");
    setAviso(null);
    try {
      const { status, data } = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ credential: respuestaGoogle.credential }),
      });

      if (status === 200 && data?.autenticado) {
        entrar(data.usuario);
      } else if (status === 202) {
        setAviso({ tipo: "ambar", texto: "Tu solicitud de registro está pendiente de aprobación. Cuando el administrador la apruebe podrás ingresar." });
      } else if (status === 404 && data?.datos_google) {
        setDatosGoogle(data.datos_google);
        setVista("solicitud");
      } else if (status === 403) {
        mostrarError("Dominio no permitido: solo se permiten cuentas @udi.edu.co.");
      } else {
        mostrarError(data?.error ?? "No se pudo iniciar sesión con Google.");
      }
    } catch {
      mostrarError("No se pudo conectar con el servidor. Intenta nuevamente.");
    }
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo">
          🎓 SIGPA<small>Gestión de Prácticas Académicas</small>
        </div>
        <p>Organiza, gestiona y realiza seguimiento a las prácticas académicas de manera fácil y eficiente.</p>
      </div>

      <div className="login-right">
        {vista === "login" ? (
          <FormularioLogin
            error={error}
            errorVersion={errorVersion}
            aviso={aviso}
            onError={mostrarError}
            onLimpiar={() => setError("")}
            onEntrar={entrar}
            onGoogle={manejarGoogle}
            onGoogleError={() => mostrarError("Falló el inicio de sesión con Google.")}
          />
        ) : (
          <FormularioSolicitud
            datosGoogle={datosGoogle}
            onCancelar={() => { setVista("login"); setDatosGoogle(null); }}
            onEnviada={() => {
              setVista("login");
              setDatosGoogle(null);
              setAviso({ tipo: "info", texto: "Solicitud enviada. Un administrador la revisará y, cuando la apruebe, podrás ingresar con tu cuenta de Google." });
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Usuario/contraseña de prueba + separador "o" + botón de Google + recuadro de credenciales. */
function FormularioLogin({ error, errorVersion, aviso, onError, onLimpiar, onEntrar, onGoogle, onGoogleError }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function ingresar(e) {
    e.preventDefault();
    if (!usuario.trim() || !clave) {
      onError("Ingresa tu usuario y tu contraseña.");
      return;
    }
    setCargando(true);
    try {
      const { status, data } = await apiFetch("/api/login/prueba", {
        method: "POST",
        body: JSON.stringify({ usuario: usuario.trim(), password: clave }),
      });
      if (status === 200 && data?.autenticado) {
        onEntrar(data.usuario);
        return;
      }
      onError(data?.error ?? "Usuario o contraseña incorrectos.");
    } catch {
      onError("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={ingresar} noValidate>
      <h2>Iniciar sesión</h2>
      <p style={{ color: "var(--gris-texto)", marginBottom: 22 }}>Ingresa tus credenciales para acceder a la plataforma.</p>

      {error && <div key={errorVersion} className="login-error visible" role="alert">{error}</div>}
      {aviso && <div className={`aviso aviso-${aviso.tipo}`} role="status">{aviso.texto}</div>}

      <div className="input-group">
        <label htmlFor="usuario">Usuario</label>
        <div className="input-wrap">
          <input
            id="usuario"
            type="text"
            placeholder="Ingresa tu usuario"
            autoComplete="username"
            autoFocus
            value={usuario}
            onChange={(e) => { setUsuario(e.target.value); onLimpiar(); }}
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="password">Contraseña</label>
        <div className="input-wrap">
          <input
            id="password"
            type={verClave ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => { setClave(e.target.value); onLimpiar(); }}
          />
          <button
            type="button"
            className="ver-clave"
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setVerClave((v) => !v)}
          >
            👁️
          </button>
        </div>
      </div>

      <button type="submit" className={`login-button ${cargando ? "cargando" : ""}`} disabled={cargando}>
        {cargando ? "Ingresando…" : "Iniciar sesión"}
      </button>

      <div className="login-separador"><span>o</span></div>

      <div className="login-google">
        <GoogleLogin onSuccess={onGoogle} onError={onGoogleError} text="signin_with" shape="rectangular" />
      </div>

      <div className="login-hint">
        <strong>Usuarios de prueba</strong> (contraseña 123456):<br />
        estudiante &nbsp;·&nbsp; docente &nbsp;·&nbsp; director &nbsp;·&nbsp; admin
      </div>
    </form>
  );
}

/** "Solicitar acceso": para cuentas @udi.edu.co que aún no existen como usuario. */
function FormularioSolicitud({ datosGoogle, onCancelar, onEnviada }) {
  const [nombre, setNombre] = useState(datosGoogle?.nombre || "");
  const [apellido, setApellido] = useState(datosGoogle?.apellido || "");
  const [rol, setRol] = useState("");
  const [programa, setPrograma] = useState("");
  const [semestre, setSemestre] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState("");
  const [enviando, setEnviando] = useState(false);

  function validar() {
    const e = {};
    if (!nombre.trim()) e.nombre = "Escribe tu nombre.";
    if (!apellido.trim()) e.apellido = "Escribe tu apellido.";
    if (!rol) e.rol = "Selecciona el rol que solicitas.";
    if (rol === "ESTUDIANTE") {
      if (!programa.trim()) e.programa = "Escribe tu programa académico.";
      if (!semestre || Number(semestre) < 1 || Number(semestre) > 12) e.semestre = "Ingresa un semestre entre 1 y 12.";
    }
    if (rol === "DOCENTE" && !especialidad.trim()) e.especialidad = "Escribe tu especialidad.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function enviar(ev) {
    ev.preventDefault();
    if (!validar()) return;
    setErrorServidor("");
    setEnviando(true);
    try {
      const { status, data } = await apiFetch("/api/solicitudes", {
        method: "POST",
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: datosGoogle.email,
          google_sub: datosGoogle.google_sub,
          rol_solicitado: rol,
          datos_rol: rol === "ESTUDIANTE"
            ? { programa: programa.trim(), semestre: Number(semestre) }
            : { especialidad: especialidad.trim() },
        }),
      });
      if (status === 201) {
        onEnviada();
      } else {
        setErrorServidor(data?.error ?? "No se pudo enviar la solicitud.");
      }
    } catch {
      setErrorServidor("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <h2>Solicitar acceso</h2>
      <p style={{ color: "var(--gris-texto)", marginBottom: 16 }}>
        Tu cuenta <strong>{datosGoogle?.email}</strong> aún no está registrada. Completa los datos y un administrador revisará tu solicitud.
      </p>

      {errorServidor && <div className="login-error visible" role="alert">{errorServidor}</div>}

      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div className={`form-group ${errores.nombre ? "con-error" : ""}`}>
          <label htmlFor="sol-nombre">Nombre</label>
          <input id="sol-nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <div className="campo-error">{errores.nombre}</div>
        </div>
        <div className={`form-group ${errores.apellido ? "con-error" : ""}`}>
          <label htmlFor="sol-apellido">Apellido</label>
          <input id="sol-apellido" type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          <div className="campo-error">{errores.apellido}</div>
        </div>
      </div>

      <div className={`form-group ${errores.rol ? "con-error" : ""}`} style={{ marginBottom: 12 }}>
        <label htmlFor="sol-rol">Rol que solicitas</label>
        <select id="sol-rol" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="">Selecciona…</option>
          <option value="ESTUDIANTE">Estudiante</option>
          <option value="DOCENTE">Docente asesor</option>
        </select>
        <div className="campo-error">{errores.rol}</div>
      </div>

      {rol === "ESTUDIANTE" && (
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <div className={`form-group ${errores.programa ? "con-error" : ""}`}>
            <label htmlFor="sol-programa">Programa</label>
            <input id="sol-programa" type="text" value={programa} onChange={(e) => setPrograma(e.target.value)} />
            <div className="campo-error">{errores.programa}</div>
          </div>
          <div className={`form-group ${errores.semestre ? "con-error" : ""}`}>
            <label htmlFor="sol-semestre">Semestre</label>
            <input id="sol-semestre" type="number" min="1" max="12" value={semestre} onChange={(e) => setSemestre(e.target.value)} />
            <div className="campo-error">{errores.semestre}</div>
          </div>
        </div>
      )}

      {rol === "DOCENTE" && (
        <div className={`form-group ${errores.especialidad ? "con-error" : ""}`} style={{ marginBottom: 12 }}>
          <label htmlFor="sol-especialidad">Especialidad</label>
          <input id="sol-especialidad" type="text" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
          <div className="campo-error">{errores.especialidad}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" className="button-secondary" onClick={onCancelar}>Volver</button>
        <button type="submit" className={`button-primary ${enviando ? "cargando" : ""}`} disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}
