/* =========================================================================
   SIGPA · js/comun.js
   UTILIDADES COMPARTIDAS por los tres paneles (interfaz y formato).

   Los datos NO se tocan aquí: eso lo hace js/datos.js. Este archivo solo
   tiene ayudas de presentación: formato, etiquetas de estado, navegación,
   mensajes (toast), ventanas (modal), pestañas y menú responsive.

   Orden de carga en cada panel: comun.js, luego datos.js, luego el .js del panel.
   ========================================================================= */


/* =========================================================
   1. FORMATO
========================================================= */

// Convierte texto en HTML seguro (se usa con todo lo que escribe el usuario).
function escaparHtml(texto) {
    return String(texto == null ? "" : texto)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Fecha ISO (2026-05-25) → formato local (25/05/2026).
function formatearFecha(iso) {
    if (!iso) return "—";
    let p = String(iso).split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
}

// Horas: entero sin decimales, con decimal cuando aplica.
function formatearHoras(n) {
    n = Number(n);
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Nota: "4.5 / 5.0".
function formatearNota(n) {
    if (n === null || n === undefined || n === "") return "—";
    return Number(n).toFixed(1) + " / 5.0";
}

// Tamaño de archivo legible.
function formatearTamano(kb) {
    return kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : kb + " KB";
}

// Iniciales para el avatar (primeras letras de las dos primeras palabras).
function iniciales(nombre) {
    let p = String(nombre || "").trim().split(/\s+/);
    return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || "");
}

// Primer nombre.
function primerNombre(nombre) {
    return String(nombre || "").trim().split(/\s+/)[0] || "";
}

// Fecha de hoy en hora local (no UTC).
function fechaHoy() {
    let d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
}

// Cuenta palabras separando por espacios.
function contarPalabras(texto) {
    let t = String(texto || "").trim();
    return t ? t.split(/\s+/).length : 0;
}


/* =========================================================
   2. ETIQUETAS DE ESTADO (badge)
   Un solo lugar decide el color de cada estado.
========================================================= */
const COLORES_ESTADO = {
    "Aprobada": "verde", "En curso": "azul", "Vigente": "verde", "Alto": "verde",
    "Pendiente": "ambar", "Próximo a vencer": "ambar", "Medio": "ambar",
    "Rechazada": "rojo", "Vencido": "rojo", "Bajo": "rojo",
    "Requiere corrección": "naranja",
    "Finalizada": "gris"
};

function badge(estado) {
    let clase = COLORES_ESTADO[estado] || "ambar";
    return '<span class="badge badge-' + clase + '">' + escaparHtml(estado) + "</span>";
}


/* =========================================================
   3. SESIÓN Y NAVEGACIÓN
========================================================= */
function sesion() {
    return {
        usuario: sessionStorage.getItem("sigpaUsuario"),
        rol: sessionStorage.getItem("sigpaRol"),
        nombre: sessionStorage.getItem("sigpaNombre"),
        refId: Number(sessionStorage.getItem("sigpaRefId"))
    };
}

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = "../index.html";
}

// Muestra una sola página y oculta las demás. Si no llega el botón, busca el
// del menú que abre esa página para dejarlo activo.
function mostrarPagina(nombre, boton) {
    document.querySelectorAll(".page").forEach(function (p) { p.style.display = "none"; });
    let pagina = document.getElementById(nombre);
    if (pagina) pagina.style.display = "block";

    if (!boton) boton = document.querySelector('.menu button[data-pagina="' + nombre + '"]');
    document.querySelectorAll(".menu button").forEach(function (b) { b.classList.remove("active"); });
    if (boton) boton.classList.add("active");

    cerrarMenuMovil();
    window.scrollTo(0, 0);
}

// Pinta el nombre, el rol y el avatar en la barra superior.
function pintarUsuario() {
    let s = sesion();
    let n = document.getElementById("nombre-usuario");
    let r = document.getElementById("rol-usuario");
    let a = document.getElementById("avatar-usuario");
    if (n) n.textContent = s.nombre || "";
    if (r) r.textContent = s.rol || "";
    if (a) a.textContent = iniciales(s.nombre).toUpperCase();
}


/* =========================================================
   4. MENÚ RESPONSIVE (cajón en celular y tablet)
========================================================= */
function alternarMenuMovil() { document.body.classList.toggle("menu-abierto"); }
function cerrarMenuMovil() { document.body.classList.remove("menu-abierto"); }


/* =========================================================
   5. MENSAJES (toast)
========================================================= */
function mostrarToast(mensaje, tipo) {
    let cont = document.getElementById("toast-contenedor");
    if (!cont) {
        cont = document.createElement("div");
        cont.id = "toast-contenedor";
        document.body.appendChild(cont);
    }
    let toast = document.createElement("div");
    toast.className = "toast toast-" + (tipo || "info");
    toast.setAttribute("role", "status");
    toast.textContent = mensaje;
    cont.appendChild(toast);
    setTimeout(function () { toast.classList.add("saliendo"); }, 3600);
    setTimeout(function () { toast.remove(); }, 4000);
}


/* =========================================================
   6. VENTANAS MODALES (admite una encima de otra)
========================================================= */
function abrirModal(titulo, cuerpoHtml, opciones) {
    opciones = opciones || {};
    let capa = document.querySelectorAll(".modal-fondo").length;
    let fondo = document.createElement("div");
    fondo.className = "modal-fondo";
    fondo.style.zIndex = 1000 + capa * 10;

    let pie = opciones.pie !== undefined ? opciones.pie
        : '<button class="button-secondary" data-cerrar>Cerrar</button>';

    fondo.innerHTML =
        '<div class="modal-caja ' + (opciones.ancho ? "modal-ancho" : "") + '" role="dialog" aria-modal="true">' +
            '<div class="modal-cabecera"><h3>' + escaparHtml(titulo) + "</h3>" +
            '<button class="modal-x" data-cerrar aria-label="Cerrar">\u2715</button></div>' +
            '<div class="modal-cuerpo">' + cuerpoHtml + "</div>" +
            (pie ? '<div class="modal-pie">' + pie + "</div>" : "") +
        "</div>";

    fondo.addEventListener("click", function (e) {
        if (e.target === fondo || e.target.hasAttribute("data-cerrar")) cerrarModal();
    });
    document.body.appendChild(fondo);
    document.body.classList.add("con-modal");

    let foco = fondo.querySelector("input, textarea, select, button");
    if (foco) foco.focus();
    return fondo;
}

function cerrarModal() {
    let modales = document.querySelectorAll(".modal-fondo");
    if (modales.length) modales[modales.length - 1].remove();
    if (!document.querySelectorAll(".modal-fondo").length) document.body.classList.remove("con-modal");
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        if (document.querySelector(".modal-fondo")) cerrarModal();
        else cerrarMenuMovil();
    }
});


/* =========================================================
   7. PESTAÑAS
========================================================= */
function activarPestana(contenedor, nombre) {
    contenedor.querySelectorAll("[data-tab-boton]").forEach(function (b) {
        b.classList.toggle("activa", b.getAttribute("data-tab-boton") === nombre);
    });
    contenedor.querySelectorAll("[data-tab]").forEach(function (p) {
        p.style.display = p.getAttribute("data-tab") === nombre ? "block" : "none";
    });
}


/* =========================================================
   8. AYUDA PARA TABLAS RESPONSIVE
   En celular cada fila se vuelve tarjeta; cada celda muestra su etiqueta.
========================================================= */
function etiquetarCeldas(tabla, etiquetas) {
    tabla.querySelectorAll("tbody tr").forEach(function (tr) {
        tr.querySelectorAll("td").forEach(function (td, i) {
            if (etiquetas[i]) td.setAttribute("data-label", etiquetas[i]);
        });
    });
}
