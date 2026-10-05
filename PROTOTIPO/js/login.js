/* =========================================================================
   SIGPA · js/login.js
   Lógica del inicio de sesión (RF01). Valida las credenciales contra una
   base de usuarios simulada y, si son correctas, guarda la sesión y
   redirige al panel que corresponde al rol.

   Cuando exista la API de autenticación (MongoDB), esta validación local
   se reemplaza por una llamada POST /api/login.
   ========================================================================= */

/* =========================================================
   BASE DE USUARIOS (simulada, sin backend).
========================================================= */
const usuarios = {
    "estudiante": { password: "123456", nombre: "Laura Fernández", rol: "Estudiante",           carpeta: "estudiante/estudiante.html" },
    "docente":    { password: "123456", nombre: "Laura Sánchez",   rol: "Docente Asesor",        carpeta: "docente/docente.html" },
    "director":   { password: "123456", nombre: "Ricardo Jaime",   rol: "Director de Programa",  carpeta: "director/director.html" }
};

function iniciarSesion() {

    let usuario = document.getElementById("usuario").value.trim();
    let password = document.getElementById("password").value;
    let errorBox = document.getElementById("login-error");

    errorBox.style.display = "none";

    if (usuario === "" || password === "") {
        errorBox.textContent = "Por favor ingrese usuario y contraseña.";
        errorBox.style.display = "block";
        return;
    }

    let datosUsuario = usuarios[usuario];

    if (!datosUsuario || datosUsuario.password !== password) {
        errorBox.textContent = "Usuario o contraseña incorrectos.";
        errorBox.style.display = "block";
        return;
    }

    sessionStorage.setItem("sigpaUsuario", usuario);
    sessionStorage.setItem("sigpaNombre", datosUsuario.nombre);
    sessionStorage.setItem("sigpaRol", datosUsuario.rol);

    window.location.href = datosUsuario.carpeta;
}

document.getElementById("password").addEventListener("keyup", function (evento) {
    if (evento.key === "Enter") iniciarSesion();
});
