/* =========================================================================
   SIGPA · docente/docente.js
   Lógica del panel del Docente Asesor.

   Requiere que ../js/comun.js se cargue antes, porque de allí salen las
   funciones cargar, guardar, badge, formatearFecha, mostrarPagina y
   cerrarSesion.
   ========================================================================= */

/* =========================================================
   1. SESIÓN
========================================================= */
const miNombre = sessionStorage.getItem("sigpaNombre") || "Laura Sánchez";
document.getElementById("nombre-usuario").textContent = miNombre;
document.getElementById("rol-usuario").textContent = sessionStorage.getItem("sigpaRol") || "Docente Asesor";

const MI_DIRECTOR = "Ricardo Jaime";

/* =========================================================
   2. CAPA DE DATOS (compartida con el panel del Estudiante)
========================================================= */

let bitacoras = cargar("sigpaBitacoras", [
    { id: 1, estudiante: "Laura Fernández", fecha: "2026-05-10", titulo: "Taller de números primos", descripcion: "Actividad lúdica sobre números primos con material concreto.", horas: 3, estado: "Aprobada" },
    { id: 2, estudiante: "Laura Fernández", fecha: "2026-05-18", titulo: "Clase de geometría, grado 8°", descripcion: "Introducción a los ángulos internos de un triángulo con regla y transportador.", horas: 4, estado: "Aprobada" },
    { id: 3, estudiante: "Laura Fernández", fecha: "2026-05-25", titulo: "Refuerzo de fracciones, grado 6°", descripcion: "Taller práctico con material concreto para reforzar la suma de fracciones heterogéneas.", horas: 3, estado: "Pendiente" },
    { id: 4, estudiante: "María Paz Osorio", fecha: "2026-05-20", titulo: "Evaluación diagnóstica, grado 7°", descripcion: "Falta anexar la rúbrica de evaluación.", horas: 3, estado: "Pendiente" },
    { id: 5, estudiante: "Juan Camilo Rey", fecha: "2026-05-18", titulo: "Clase de estadística", descripcion: "Recolección y tabulación de datos con el grupo.", horas: 4, estado: "Aprobada" }
]);

let evaluaciones = cargar("sigpaEvaluaciones", [
    { id: 1, fecha: "2026-05-15", estudiante: "Laura Fernández", evaluador: "Laura Sánchez", criterio: "Seguimiento", calificacion: "4.5 / 5", observaciones: "Buen desarrollo de las actividades." },
    { id: 2, fecha: "2026-05-10", estudiante: "Laura Fernández", evaluador: "Ricardo Jaime", criterio: "Evaluación de dirección", calificacion: "4.0 / 5", observaciones: "Cumple con los objetivos establecidos." }
]);

let reportes = cargar("sigpaReportes", []);

/* =========================================================
   3. RENDER DE TABLAS
========================================================= */

function pintarBitacoras() {
    let pendientes = bitacoras.filter(function (b) { return b.estado === "Pendiente"; });
    document.getElementById("kpi-pendientes").textContent = pendientes.length;

    document.getElementById("tabla-bitacoras").innerHTML = bitacoras.map(function (b) {
        let acciones = b.estado === "Pendiente"
            ? '<button class="button-primary" onclick="revisarBitacora(' + b.id + ', \'Aprobada\')">Aprobar</button> ' +
              '<button class="button-secondary" onclick="revisarBitacora(' + b.id + ', \'Rechazada\')">Rechazar</button>'
            : '<button class="button-secondary" onclick="verBitacora(' + b.id + ')">👁️ Ver</button>';

        return "<tr>" +
            "<td>" + b.estudiante + "</td>" +
            "<td>" + formatearFecha(b.fecha) + "</td>" +
            "<td>" + b.titulo + "</td>" +
            "<td>" + b.descripcion + "</td>" +
            "<td>" + b.horas + "</td>" +
            "<td>" + badge(b.estado) + "</td>" +
            "<td>" + acciones + "</td>" +
            "</tr>";
    }).join("");
}

function verBitacora(id) {
    let b = bitacoras.find(function (x) { return x.id === id; });
    if (!b) return;
    alert("Bitácora de " + b.estudiante + ": " + b.titulo + "\nEstado: " + b.estado + "\n\n" + b.descripcion);
}

function pintarEvaluaciones() {
    let mias = evaluaciones.filter(function (ev) { return ev.evaluador === miNombre; });
    document.getElementById("tabla-evaluaciones").innerHTML = mias.map(function (ev) {
        return "<tr><td>" + formatearFecha(ev.fecha) + "</td><td>" + ev.estudiante + "</td><td>" + ev.criterio + "</td><td>" + ev.calificacion + "</td></tr>";
    }).join("");
}

function pintarReportes() {
    let recibidos = reportes.filter(function (r) { return r.destinatarioRol === "docente"; });
    document.getElementById("kpi-reportes").textContent = recibidos.length;

    document.getElementById("tabla-reportes-recibidos").innerHTML = recibidos.map(function (r) {
        return "<tr>" +
            "<td>" + formatearFecha(r.fecha) + "</td>" +
            "<td>" + r.generadoPor + "</td>" +
            "<td>" + r.tipo + "</td>" +
            "<td>" + r.periodo + "</td>" +
            "<td><button class=\"button-secondary\" onclick=\"alert('Abriendo reporte de ' + '" + r.generadoPor + "'+'...')\">👁️ Ver</button></td>" +
            "</tr>";
    }).join("");

    let enviados = reportes.filter(function (r) { return r.generadoPor === miNombre; });
    document.getElementById("tabla-reportes-enviados").innerHTML = enviados.map(function (r) {
        return "<tr><td>" + formatearFecha(r.fecha) + "</td><td>" + r.tipo + "</td><td>" + r.periodo + "</td><td>" + r.destinatarioNombre + "</td></tr>";
    }).join("");
}

/* =========================================================
   4. ACCIONES
========================================================= */

// RF10: aprobar / rechazar una bitácora
function revisarBitacora(id, nuevoEstado) {
    let b = bitacoras.find(function (x) { return x.id === id; });
    if (!b) return;

    b.estado = nuevoEstado;
    guardar("sigpaBitacoras", bitacoras);

    alert("Bitácora de " + b.estudiante + " (\"" + b.titulo + "\") marcada como " + nuevoEstado.toLowerCase() + ".");
    pintarBitacoras();
}

// RF10: guardar evaluación (queda visible para el estudiante en su propio panel)
function guardarEvaluacion() {
    let estudiante = document.getElementById("ev-estudiante").value;
    let criterio = document.getElementById("ev-criterio").value;
    let calificacion = document.getElementById("ev-calificacion").value;
    let retro = document.getElementById("ev-retro").value.trim();

    if (!calificacion || !retro) {
        alert("Por favor ingresa la calificación y la retroalimentación.");
        return;
    }

    let hoy = new Date().toISOString().split("T")[0];
    evaluaciones.push({
        id: Date.now(),
        fecha: hoy,
        estudiante: estudiante,
        evaluador: miNombre,
        criterio: criterio,
        calificacion: Number(calificacion).toFixed(1) + " / 5",
        observaciones: retro
    });
    guardar("sigpaEvaluaciones", evaluaciones);

    alert("Evaluación guardada correctamente y notificada a " + estudiante + ".");

    document.getElementById("ev-retro").value = "";
    pintarEvaluaciones();
}

// RF13: generar reporte para dirección
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
        generadoPorRol: "docente",
        destinatarioRol: "director",
        destinatarioNombre: MI_DIRECTOR
    });
    guardar("sigpaReportes", reportes);

    alert("Reporte generado correctamente.\nSe envió una copia al director de programa, " + MI_DIRECTOR + ".");

    document.getElementById("rp-inicio").value = "";
    document.getElementById("rp-fin").value = "";
    pintarReportes();
}

/* =========================================================
   5. NAVEGACIÓN
========================================================= */

/* =========================================================
   6. PRIMER DIBUJADO
========================================================= */
pintarBitacoras();
pintarEvaluaciones();
pintarReportes();
