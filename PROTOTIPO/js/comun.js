/* =========================================================================
   SIGPA · js/comun.js

   Funciones que usan POR IGUAL los tres paneles (Estudiante, Docente y
   Director). Antes estaban copiadas dentro del <script> de cada HTML; al
   tenerlas en un solo archivo, si hay que corregir algo se corrige una vez.

   Este archivo debe cargarse ANTES del .js propio de cada panel.
   ========================================================================= */


/* =========================================================
   1. CAPA DE DATOS (localStorage)

   Mientras no exista el backend, los datos viven en el
   localStorage del navegador. Así los cambios que hace un rol
   (por ejemplo, el docente aprueba una bitácora) se ven
   reflejados en el panel de otro rol.

   Más adelante, cuando exista la API REST, estas dos funciones
   son las únicas que habrá que reemplazar por fetch().
========================================================= */

/**
 * Lee un arreglo del localStorage. Si la clave todavía no existe,
 * guarda los datos de ejemplo (semilla) y los devuelve.
 */
function cargar(clave, semilla) {
    let datos = localStorage.getItem(clave);
    if (!datos) {
        localStorage.setItem(clave, JSON.stringify(semilla));
        return semilla;
    }
    return JSON.parse(datos);
}

/**
 * Guarda un arreglo en el localStorage bajo la clave indicada.
 */
function guardar(clave, arreglo) {
    localStorage.setItem(clave, JSON.stringify(arreglo));
}


/* =========================================================
   2. PRESENTACIÓN
========================================================= */

/**
 * Devuelve la etiqueta de color según el estado.
 * Verde: Aprobada, Vigente, Activa · Rojo: Rechazada · Amarillo: el resto.
 */
function badge(estado) {
    let clase = estado === "Aprobada" || estado === "Vigente" || estado === "Activa" ? "approved"
              : estado === "Rechazada" ? "rejected" : "pending";
    return '<span class="badge ' + clase + '">' + estado + '</span>';
}

/**
 * Convierte una fecha ISO (2026-05-25) al formato local (25/05/2026).
 */
function formatearFecha(iso) {
    let partes = iso.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}


/* =========================================================
   3. NAVEGACIÓN
========================================================= */

/**
 * Muestra una sola página del panel y oculta las demás.
 * También marca como activo el botón del menú lateral.
 */
function mostrarPagina(nombre, boton) {
    document.querySelectorAll(".page").forEach(function (p) { p.style.display = "none"; });
    let pagina = document.getElementById(nombre);
    if (pagina) pagina.style.display = "block";

    document.querySelectorAll(".menu button").forEach(function (b) { b.classList.remove("active"); });
    if (boton) boton.classList.add("active");
}

/**
 * Cierra la sesión y devuelve al login.
 */
function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = "../index.html";
}
