/* =========================================================================
   SIGPA · estudiante/estudiante.js
   Lógica del panel del Estudiante.

   Requiere que ../js/comun.js se cargue antes, porque de allí salen las
   funciones cargar, guardar, badge, formatearFecha, mostrarPagina y
   cerrarSesion.
   ========================================================================= */

/* =========================================================
   1. SESIÓN
========================================================= */
const miNombre = sessionStorage.getItem("sigpaNombre") || "Laura Fernández";
document.getElementById("nombre-usuario").textContent = miNombre;
document.getElementById("rol-usuario").textContent = sessionStorage.getItem("sigpaRol") || "Estudiante";

const MI_DOCENTE = "Laura Sánchez"; // docente asesor asignado a este estudiante

/* =========================================================
   2. CAPA DE DATOS (localStorage)
   Estos mismos arreglos también los lee/escribe el panel del
   Docente, para que aprobar/rechazar y los reportes se vean
   reflejados de un panel a otro sin necesidad de un backend.
========================================================= */

let bitacoras = cargar("sigpaBitacoras", [
    { id: 1, estudiante: "Laura Fernández", fecha: "2026-05-10", titulo: "Taller de números primos", descripcion: "Actividad lúdica sobre números primos con material concreto.", horas: 3, estado: "Aprobada" },
    { id: 2, estudiante: "Laura Fernández", fecha: "2026-05-18", titulo: "Clase de geometría, grado 8°", descripcion: "Introducción a los ángulos internos de un triángulo con regla y transportador.", horas: 4, estado: "Aprobada" },
    { id: 3, estudiante: "Laura Fernández", fecha: "2026-05-25", titulo: "Refuerzo de fracciones, grado 6°", descripcion: "Taller práctico con material concreto para reforzar la suma de fracciones heterogéneas.", horas: 3, estado: "Pendiente" },
    { id: 4, estudiante: "María Paz Osorio", fecha: "2026-05-20", titulo: "Evaluación diagnóstica, grado 7°", descripcion: "Falta anexar la rúbrica de evaluación.", horas: 3, estado: "Pendiente" },
    { id: 5, estudiante: "Juan Camilo Rey", fecha: "2026-05-18", titulo: "Clase de estadística", descripcion: "Recolección y tabulación de datos con el grupo.", horas: 4, estado: "Aprobada" }
]);

let evidencias = cargar("sigpaEvidencias", [
    { id: 1, estudiante: "Laura Fernández", fecha: "2026-05-20", titulo: "Planeación de clase", tipo: "Documento", archivo: "planeacion_clase.pdf", estado: "Aprobada" },
    { id: 2, estudiante: "Laura Fernández", fecha: "2026-05-18", titulo: "Material didáctico", tipo: "Presentación", archivo: "material.pptx", estado: "Aprobada" },
    { id: 3, estudiante: "Laura Fernández", fecha: "2026-05-15", titulo: "Fotografías actividad", tipo: "Imagen", archivo: "actividad.zip", estado: "Pendiente" }
]);

let evaluaciones = cargar("sigpaEvaluaciones", [
    { id: 1, fecha: "2026-05-15", estudiante: "Laura Fernández", evaluador: "Laura Sánchez", criterio: "Seguimiento", calificacion: "4.5 / 5", observaciones: "Buen desarrollo de las actividades." },
    { id: 2, fecha: "2026-05-10", estudiante: "Laura Fernández", evaluador: "Ricardo Jaime", criterio: "Evaluación de dirección", calificacion: "4.0 / 5", observaciones: "Cumple con los objetivos establecidos." }
]);

let reportes = cargar("sigpaReportes", []); // bandeja compartida entre roles

/* =========================================================
   3. RENDER DE TABLAS
========================================================= */

function pintarBitacoras() {
    let mias = bitacoras.filter(function (b) { return b.estudiante === miNombre; });
    document.getElementById("kpi-bitacoras").textContent = mias.length;

    document.getElementById("tabla-bitacoras").innerHTML = mias.map(function (b) {
        return "<tr>" +
            "<td>" + formatearFecha(b.fecha) + "</td>" +
            "<td>" + b.titulo + "</td>" +
            "<td>" + b.descripcion + "</td>" +
            "<td>" + b.horas + "</td>" +
            "<td>" + badge(b.estado) + "</td>" +
            "<td><button class=\"button-secondary\" onclick=\"verBitacora(" + b.id + ")\">👁️ Ver</button></td>" +
            "</tr>";
    }).join("");

    pintarHoras(mias);
}

function pintarHoras(mias) {
    document.getElementById("tabla-horas").innerHTML = mias
        .filter(function (b) { return b.estado === "Aprobada"; })
        .map(function (b) {
            return "<tr><td>" + formatearFecha(b.fecha) + "</td><td>" + b.titulo + "</td><td>" + b.horas + "</td><td>" + miNombre + "</td><td>" + badge(b.estado) + "</td></tr>";
        }).join("");
}

function pintarEvidencias() {
    let mias = evidencias.filter(function (e) { return e.estudiante === miNombre; });
    document.getElementById("kpi-evidencias").textContent = mias.length;

    document.getElementById("tabla-evidencias").innerHTML = mias.map(function (e) {
        return "<tr>" +
            "<td>" + formatearFecha(e.fecha) + "</td>" +
            "<td>" + e.titulo + "</td>" +
            "<td>" + e.tipo + "</td>" +
            "<td>" + e.archivo + "</td>" +
            "<td>" + badge(e.estado) + "</td>" +
            "<td><button class=\"button-secondary\" onclick=\"descargarEvidencia('" + e.archivo + "')\">⬇️ Descargar</button></td>" +
            "</tr>";
    }).join("");
}

function pintarEvaluaciones() {
    let mias = evaluaciones.filter(function (ev) { return ev.estudiante === miNombre; });
    document.getElementById("tabla-evaluaciones").innerHTML = mias.map(function (ev, i) {
        return "<tr>" +
            "<td>" + formatearFecha(ev.fecha) + "</td>" +
            "<td>" + ev.evaluador + "</td>" +
            "<td>" + ev.criterio + "</td>" +
            "<td>" + ev.calificacion + "</td>" +
            "<td>" + ev.observaciones + "</td>" +
            "<td><button class=\"button-secondary\" onclick=\"verEvaluacion(" + i + ")\">👁️ Ver</button></td>" +
            "</tr>";
    }).join("");
}

function pintarReportes() {
    let mios = reportes.filter(function (r) { return r.generadoPor === miNombre; });
    document.getElementById("tabla-reportes").innerHTML = mios.map(function (r) {
        return "<tr>" +
            "<td>" + formatearFecha(r.fecha) + "</td>" +
            "<td>" + r.tipo + "</td>" +
            "<td>" + r.periodo + "</td>" +
            "<td>" + r.generadoPor + "</td>" +
            "<td>" + r.destinatarioNombre + "</td>" +
            "<td><button class=\"button-secondary\" onclick=\"alert('Descargando ' + '" + r.tipo + "'+'...')\">⬇️ Descargar</button></td>" +
            "</tr>";
    }).join("");
}

/* =========================================================
   4. ACCIONES (todas guardan en localStorage y refrescan)
========================================================= */

// ---- Bitácoras ----
function guardarBitacora() {
    let fecha = document.getElementById("nb-fecha").value;
    let horas = document.getElementById("nb-horas").value;
    let titulo = document.getElementById("nb-titulo").value.trim();
    let descripcion = document.getElementById("nb-descripcion").value.trim();

    if (!fecha || !horas || !titulo || !descripcion) {
        alert("Por favor completa todos los campos antes de guardar.");
        return;
    }

    bitacoras.push({
        id: Date.now(),
        estudiante: miNombre,
        fecha: fecha,
        titulo: titulo,
        descripcion: descripcion,
        horas: Number(horas),
        estado: "Pendiente"
    });
    guardar("sigpaBitacoras", bitacoras);

    alert("Bitácora guardada correctamente. Quedó pendiente de revisión por tu docente asesor, " + MI_DOCENTE + ".");

    document.getElementById("nb-fecha").value = "";
    document.getElementById("nb-horas").value = "";
    document.getElementById("nb-titulo").value = "";
    document.getElementById("nb-descripcion").value = "";

    pintarBitacoras();
    mostrarPagina("bitacoras");
}

function cancelarBitacora() {
    document.getElementById("nb-fecha").value = "";
    document.getElementById("nb-horas").value = "";
    document.getElementById("nb-titulo").value = "";
    document.getElementById("nb-descripcion").value = "";
    mostrarPagina("bitacoras");
}

function verBitacora(id) {
    let b = bitacoras.find(function (x) { return x.id === id; });
    if (!b) return;
    alert("Bitácora: " + b.titulo + "\nFecha: " + formatearFecha(b.fecha) + "\nHoras: " + b.horas + "\nEstado: " + b.estado + "\n\n" + b.descripcion);
}

// ---- Evidencias ----
function mostrarFormEvidencia() {
    document.getElementById("form-evidencia").style.display = "block";
}

function cancelarEvidencia() {
    document.getElementById("form-evidencia").style.display = "none";
    document.getElementById("ev-titulo").value = "";
    document.getElementById("ev-archivo").value = "";
}

function guardarEvidencia() {
    let titulo = document.getElementById("ev-titulo").value.trim();
    let tipo = document.getElementById("ev-tipo").value;
    let archivoInput = document.getElementById("ev-archivo");
    let archivo = archivoInput.files.length ? archivoInput.files[0].name : "sin_nombre.archivo";

    if (!titulo) {
        alert("Por favor ingresa un título para la evidencia.");
        return;
    }

    let hoy = new Date().toISOString().split("T")[0];
    evidencias.push({ id: Date.now(), estudiante: miNombre, fecha: hoy, titulo: titulo, tipo: tipo, archivo: archivo, estado: "Pendiente" });
    guardar("sigpaEvidencias", evidencias);

    alert("Evidencia subida correctamente. Quedó pendiente de revisión.");
    cancelarEvidencia();
    pintarEvidencias();
}

function descargarEvidencia(nombreArchivo) {
    alert("Descargando " + nombreArchivo + "...");
}

// ---- Evaluaciones ----
function verEvaluacion(indice) {
    let mias = evaluaciones.filter(function (ev) { return ev.estudiante === miNombre; });
    let ev = mias[indice];
    if (!ev) return;
    alert("Evaluación de " + ev.evaluador + "\nCriterio: " + ev.criterio + "\nCalificación: " + ev.calificacion + "\n\n" + ev.observaciones);
}

// ---- Reportes (RF13): se envían al docente asesor ----
function generarReporte() {
    let tipo = document.getElementById("rp-tipo").value;
    let inicio = document.getElementById("rp-inicio").value;
    let fin = document.getElementById("rp-fin").value;

    if (!inicio || !fin) {
        alert("Selecciona la fecha inicial y la fecha final del reporte.");
        return;
    }

    let hoy = new Date().toISOString().split("T")[0];
    reportes.push({
        id: Date.now(),
        fecha: hoy,
        tipo: tipo,
        periodo: formatearFecha(inicio) + " - " + formatearFecha(fin),
        generadoPor: miNombre,
        generadoPorRol: "estudiante",
        destinatarioRol: "docente",
        destinatarioNombre: MI_DOCENTE
    });
    guardar("sigpaReportes", reportes);

    alert("Reporte generado correctamente.\nSe envió una copia a tu docente asesor, " + MI_DOCENTE + ".");

    document.getElementById("rp-inicio").value = "";
    document.getElementById("rp-fin").value = "";
    pintarReportes();
}

/* =========================================================
   5. NAVEGACIÓN ENTRE PÁGINAS
========================================================= */

/* =========================================================
   6. PRIMER DIBUJADO AL CARGAR LA PÁGINA
========================================================= */
pintarBitacoras();
pintarEvidencias();
pintarEvaluaciones();
pintarReportes();
