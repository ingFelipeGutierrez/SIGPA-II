/* =========================================================================
   SIGPA · js/login.js
   Lógica del inicio de sesión.

   El login se asume como un proceso estándar (no es un caso de uso). Valida
   las credenciales contra la base de usuarios de datos.js y, si son
   correctas, guarda la sesión y redirige al panel del rol.

   Cuando exista la API de autenticación, la validación local se reemplaza
   por una llamada POST /api/login, y "Recordarme" tendrá efecto real.
   ========================================================================= */

const DESTINO = {
    "Estudiante": "estudiante/estudiante.html",
    "Docente Asesor": "docente/docente.html",
    "Director de Programa": "director/director.html"
};

// Foco automático en "Usuario" al cargar.
document.getElementById("usuario").focus();

// Mostrar u ocultar la contraseña.
document.getElementById("ver-clave").addEventListener("click", function () {
    let campo = document.getElementById("password");
    let mostrar = campo.type === "password";
    campo.type = mostrar ? "text" : "password";
    this.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
});

// Enter envía el formulario.
["usuario", "password"].forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (e) {
        if (e.key === "Enter") iniciarSesion();
    });
});

function mostrarError(mensaje) {
    let caja = document.getElementById("login-error");
    caja.textContent = mensaje;
    caja.classList.add("visible");
}

async function iniciarSesion() {
    let usuario = document.getElementById("usuario").value.trim();
    let clave = document.getElementById("password").value;
    let boton = document.getElementById("boton-login");

    if (!usuario || !clave) {
        mostrarError("Ingresa tu usuario y tu contraseña.");
        return;
    }

    // Estado "Ingresando…" mientras valida.
    boton.disabled = true;
    boton.classList.add("cargando");
    boton.textContent = "Ingresando…";

    // Pequeña espera simulada (lo que después hará la llamada a la API).
    await new Promise(function (r) { setTimeout(r, 500); });

    let u = await Datos.validarLogin(usuario, clave);

    if (!u) {
        boton.disabled = false;
        boton.classList.remove("cargando");
        boton.textContent = "Iniciar sesión";
        mostrarError("Usuario o contraseña incorrectos.");
        return;
    }

    sessionStorage.setItem("sigpaUsuario", u.usuario);
    sessionStorage.setItem("sigpaRol", u.rol);
    sessionStorage.setItem("sigpaNombre", u.nombre);
    sessionStorage.setItem("sigpaRefId", u.refId);

    window.location.href = DESTINO[u.rol];
}
