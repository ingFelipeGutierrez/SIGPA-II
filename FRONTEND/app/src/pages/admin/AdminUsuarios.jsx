import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminUsuarios } from "../../hooks/useAdminUsuarios";
import { useAparecer } from "../../hooks/useAparecer";
import { crearUsuario, actualizarUsuario, eliminarUsuario } from "../../services/usuarios";
import { useToast } from "../../components/ToastContext";
import { ROLES_USUARIO, textoRol, colorRol, textoDetalleUsuario, esCuentaDePrueba } from "../../utils/roles";
import Modal from "../../components/Modal";
import Cargando from "../../components/Cargando";

const FORMULARIO_VACIO = { nombre: "", apellido: "", email: "", rol: "", programa: "", semestre: "", especialidad: "" };

/**
 * src/pages/admin/AdminUsuarios.jsx
 * Página "Usuarios" del Super Admin: lista de todas las cuentas con filtro
 * por rol y búsqueda, y las acciones de crear, editar y eliminar. Cada
 * rol se guarda con su endpoint propio (usuario + datos del rol en una
 * sola transacción). Las cuentas de prueba de los calificadores y la
 * cuenta con la que se inició sesión no se pueden eliminar.
 */
export default function AdminUsuarios() {
  const { usuario: sesion } = useAuth();
  const ubicacion = useLocation();
  const { usuarios, cargando, error, recargar } = useAdminUsuarios();
  const [filtroRol, setFiltroRol] = useState(ubicacion.state?.rol ?? "");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState(null); // { tipo: "form" | "eliminar", usuario? }
  const tablaRef = useRef(null);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroRol && u.rol !== filtroRol) return false;
      if (!texto) return true;
      return `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(texto);
    });
  }, [usuarios, filtroRol, busqueda]);

  useAparecer(tablaRef, "tbody tr", `${filtroRol}-${visibles.length}`);

  if (cargando) return <Cargando />;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Usuarios</h1>
        <p>Administra las cuentas de la plataforma por rol.</p>
      </div>

      <div className="table-container" ref={tablaRef}>
        <div className="filtros">
          <div className="campo">
            <label htmlFor="filtro-rol">Rol</label>
            <select id="filtro-rol" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="">Todos</option>
              {ROLES_USUARIO.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="buscar-usuario">Buscar</label>
            <input
              id="buscar-usuario"
              type="search"
              placeholder="Nombre o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button className="button-primary" onClick={() => setModal({ tipo: "form" })}>
              + Crear usuario
            </button>
          </div>
        </div>

        {error && <div className="campo-error" style={{ display: "block", marginBottom: 12 }}>{error}</div>}

        <div className="tabla-scroll">
          <table className="apilable">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Datos del rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => {
                const protegida = esCuentaDePrueba(u);
                const esYo = u.id_usuario === sesion.id_usuario;
                return (
                  <tr key={u.id_usuario}>
                    <td data-label="Nombre">{u.nombre} {u.apellido}</td>
                    <td data-label="Correo">{u.email}</td>
                    <td data-label="Rol">
                      <span className={`badge badge-${colorRol(u.rol)}`}>{textoRol(u.rol)}</span>
                    </td>
                    <td data-label="Datos del rol">{textoDetalleUsuario(u)}</td>
                    <td data-label="Acciones">
                      <button
                        className="button-secondary"
                        disabled={protegida}
                        title={protegida ? "Cuenta de prueba protegida" : undefined}
                        onClick={() => setModal({ tipo: "form", usuario: u })}
                      >
                        Editar
                      </button>{" "}
                      <button
                        className="button-secondary"
                        disabled={protegida || esYo}
                        title={protegida ? "Cuenta de prueba protegida" : esYo ? "No puedes eliminar tu propia cuenta" : undefined}
                        onClick={() => setModal({ tipo: "eliminar", usuario: u })}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibles.length === 0 && <div className="vacio">No hay usuarios que coincidan con la búsqueda.</div>}
      </div>

      {modal?.tipo === "form" && (
        <ModalUsuario
          usuarioEditado={modal.usuario}
          usuarios={usuarios}
          onClose={() => setModal(null)}
          onListo={() => {
            setModal(null);
            recargar();
          }}
        />
      )}
      {modal?.tipo === "eliminar" && (
        <ModalEliminar
          usuario={modal.usuario}
          onClose={() => setModal(null)}
          onListo={() => {
            setModal(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}

/** Formulario para crear o editar un usuario. Al editar, el rol no se puede cambiar
 *  (cada rol vive en su propia tabla); para cambiarlo se crea una cuenta nueva. */
function ModalUsuario({ usuarioEditado, usuarios, onClose, onListo }) {
  const { mostrarToast } = useToast();
  const editando = Boolean(usuarioEditado);
  const [form, setForm] = useState(() =>
    editando
      ? {
          nombre: usuarioEditado.nombre,
          apellido: usuarioEditado.apellido,
          email: usuarioEditado.email,
          rol: usuarioEditado.rol,
          programa: usuarioEditado.programa || "",
          semestre: usuarioEditado.semestre ? String(usuarioEditado.semestre) : "",
          especialidad: usuarioEditado.especialidad || "",
        }
      : FORMULARIO_VACIO
  );
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function validar() {
    const e = {};
    const email = form.email.trim().toLowerCase();
    if (!form.nombre.trim()) e.nombre = "Escribe el nombre.";
    if (!form.apellido.trim()) e.apellido = "Escribe el apellido.";
    if (!email) {
      e.email = "Escribe el correo.";
    } else if (!/^[^\s@]+@udi\.edu\.co$/.test(email)) {
      e.email = "Usa un correo institucional @udi.edu.co.";
    } else if (usuarios.some((u) => u.email.toLowerCase() === email && u.id_usuario !== usuarioEditado?.id_usuario)) {
      e.email = "Ya existe un usuario con ese correo.";
    }
    if (!form.rol) e.rol = "Selecciona el rol.";
    if (form.rol === "ESTUDIANTE") {
      if (!form.programa.trim()) e.programa = "Escribe el programa académico.";
      if (!form.semestre || Number(form.semestre) < 1 || Number(form.semestre) > 12) e.semestre = "Ingresa un semestre entre 1 y 12.";
    }
    if (form.rol === "DOCENTE" && !form.especialidad.trim()) e.especialidad = "Escribe la especialidad.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function guardar() {
    if (!validar()) return;
    setErrorServidor("");
    setGuardando(true);

    const datos = { nombre: form.nombre.trim(), apellido: form.apellido.trim(), email: form.email.trim().toLowerCase() };
    if (form.rol === "ESTUDIANTE") {
      datos.programa = form.programa.trim();
      datos.semestre = Number(form.semestre);
    }
    if (form.rol === "DOCENTE") datos.especialidad = form.especialidad.trim();

    try {
      if (editando) {
        await actualizarUsuario(form.rol, usuarioEditado.id_usuario, datos);
        mostrarToast("Usuario actualizado correctamente.", "ok");
      } else {
        await crearUsuario(form.rol, datos);
        mostrarToast("Usuario creado correctamente.", "ok");
      }
      onListo();
    } catch (e) {
      setErrorServidor(e.message || "No se pudo guardar el usuario. Intenta nuevamente.");
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? "Editar usuario" : "Crear usuario"}
      onClose={onClose}
      pie={
        <>
          <button className="button-secondary" data-cerrar="">Cancelar</button>
          <button className="button-primary" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear usuario"}
          </button>
        </>
      }
    >
      {errorServidor && <div className="login-error visible" role="alert" style={{ marginBottom: 14 }}>{errorServidor}</div>}

      <div className="form-grid" style={{ marginBottom: 12 }}>
        <Campo id="usr-nombre" etiqueta="Nombre" error={errores.nombre}>
          <input id="usr-nombre" type="text" value={form.nombre} onChange={cambiar("nombre")} />
        </Campo>
        <Campo id="usr-apellido" etiqueta="Apellido" error={errores.apellido}>
          <input id="usr-apellido" type="text" value={form.apellido} onChange={cambiar("apellido")} />
        </Campo>
      </div>

      <div className="form-grid" style={{ marginBottom: 12 }}>
        <Campo id="usr-email" etiqueta="Correo institucional" error={errores.email}>
          <input id="usr-email" type="email" value={form.email} onChange={cambiar("email")} />
        </Campo>
        <Campo id="usr-rol" etiqueta="Rol" error={errores.rol}>
          <select id="usr-rol" value={form.rol} onChange={cambiar("rol")} disabled={editando}>
            <option value="">Selecciona…</option>
            {ROLES_USUARIO.map((r) => (
              <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
            ))}
          </select>
        </Campo>
      </div>

      {form.rol === "ESTUDIANTE" && (
        <div className="form-grid">
          <Campo id="usr-programa" etiqueta="Programa" error={errores.programa}>
            <input id="usr-programa" type="text" value={form.programa} onChange={cambiar("programa")} />
          </Campo>
          <Campo id="usr-semestre" etiqueta="Semestre" error={errores.semestre}>
            <input id="usr-semestre" type="number" min="1" max="12" value={form.semestre} onChange={cambiar("semestre")} />
          </Campo>
        </div>
      )}

      {form.rol === "DOCENTE" && (
        <Campo id="usr-especialidad" etiqueta="Especialidad" error={errores.especialidad}>
          <input id="usr-especialidad" type="text" value={form.especialidad} onChange={cambiar("especialidad")} />
        </Campo>
      )}

      {editando && (
        <p className="dato-secundario" style={{ marginTop: 14 }}>
          El rol no se puede cambiar. Si la persona necesita otro rol, crea una cuenta nueva.
        </p>
      )}
    </Modal>
  );
}

/** Campo de formulario con su etiqueta y el mensaje de error debajo. */
function Campo({ id, etiqueta, error, children }) {
  return (
    <div className={`form-group ${error ? "con-error" : ""}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      <div className="campo-error">{error}</div>
    </div>
  );
}

/** Confirmación para eliminar: nombra a la persona y avisa que no se puede deshacer. */
function ModalEliminar({ usuario: u, onClose, onListo }) {
  const { mostrarToast } = useToast();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function eliminar() {
    setGuardando(true);
    setError("");
    try {
      await eliminarUsuario(u.rol, u.id_usuario);
      mostrarToast("Usuario eliminado correctamente.", "ok");
      onListo();
    } catch (e) {
      setError(e.message || "No se pudo eliminar el usuario. Intenta nuevamente.");
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo="Eliminar usuario"
      onClose={onClose}
      pie={
        <>
          <button className="button-secondary" data-cerrar="">Cancelar</button>
          <button className="button-danger" onClick={eliminar} disabled={guardando}>
            {guardando ? "Eliminando…" : "Eliminar usuario"}
          </button>
        </>
      }
    >
      <p>
        Vas a eliminar la cuenta de <strong>{u.nombre} {u.apellido}</strong> ({u.email}) como{" "}
        <strong>{textoRol(u.rol).toLowerCase()}</strong>. Esta acción no se puede deshacer.
      </p>
      <p className="dato-secundario" style={{ marginTop: 10 }}>
        Si la persona ya tiene prácticas o bitácoras registradas, esos datos no se borran. Úsalo sobre todo
        para cuentas creadas por error.
      </p>
      {error && <div className="campo-error" style={{ display: "block", marginTop: 12 }}>{error}</div>}
    </Modal>
  );
}
