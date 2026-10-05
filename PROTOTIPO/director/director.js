/* =========================================================================
   SIGPA · director/director.js
   Lógica del panel del Director de Programa.

   Requiere que ../js/comun.js se cargue antes, porque de allí salen las
   funciones cargar, guardar, badge, formatearFecha, mostrarPagina y
   cerrarSesion.
   ========================================================================= */

/* =========================================================
   1. SESIÓN
========================================================= */
const miNombre = sessionStorage.getItem("sigpaNombre") || "Ricardo Jaime";
document.getElementById("nombre-usuario").textContent = miNombre;
document.getElementById("rol-usuario").textContent = sessionStorage.getItem("sigpaRol") || "Director de Programa";

/* =========================================================
   2. CAPA DE DATOS
========================================================= */

let bitacoras = cargar("sigpaBitacoras", [
    { id: 1, estudiante: "Laura Fernández", fecha: "2026-05-10", titulo: "Taller de números primos", descripcion: "Actividad lúdica sobre números primos con material concreto.", horas: 3, estado: "Aprobada" },
    { id: 2, estudiante: "Laura Fernández", fecha: "2026-05-18", titulo: "Clase de geometría, grado 8°", descripcion: "Introducción a los ángulos internos de un triángulo.", horas: 4, estado: "Aprobada" },
    { id: 3, estudiante: "Laura Fernández", fecha: "2026-05-25", titulo: "Refuerzo de fracciones, grado 6°", descripcion: "Taller práctico con material concreto.", horas: 3, estado: "Pendiente" },
    { id: 4, estudiante: "María Paz Osorio", fecha: "2026-05-20", titulo: "Evaluación diagnóstica, grado 7°", descripcion: "Falta anexar la rúbrica de evaluación.", horas: 3, estado: "Pendiente" },
    { id: 5, estudiante: "Juan Camilo Rey", fecha: "2026-05-18", titulo: "Clase de estadística", descripcion: "Recolección y tabulación de datos con el grupo.", horas: 4, estado: "Aprobada" }
]);

let instituciones = cargar("sigpaInstituciones", [
    { nombre: "I.E. Simón Bolívar", plazasOcupadas: 6, plazasTotal: 8, convenioHasta: "2026-12-15", estado: "Vigente" },
    { nombre: "I.E. Técnica del Norte", plazasOcupadas: 4, plazasTotal: 5, convenioHasta: "2027-08-01", estado: "Vigente" },
    { nombre: "Colegio San Pedro Claver", plazasOcupadas: 3, plazasTotal: 3, convenioHasta: "2026-06-15", estado: "Por renovar" },
    { nombre: "Colegio La Presentación", plazasOcupadas: 2, plazasTotal: 4, convenioHasta: "2026-11-01", estado: "Vigente" }
]);

let asignaciones = cargar("sigpaAsignaciones", [
    { estudiante: "Laura Fernández", institucion: "I.E. Simón Bolívar", docente: "Laura Sánchez", fecha: "2026-03-10", estado: "Activa" },
    { estudiante: "Diego Alarcón", institucion: "Colegio La Presentación", docente: "Laura Sánchez", fecha: "2026-03-10", estado: "Activa" }
]);

let reportes = cargar("sigpaReportes", []);

/* =========================================================
   3. RENDER DE TABLAS
========================================================= */

function pintarInstituciones() {
    document.getElementById("kpi-instituciones").textContent = instituciones.length;

    let plazasLibres = instituciones.reduce(function (total, inst) {
        return total + (inst.plazasTotal - inst.plazasOcupadas);
    }, 0);
    document.getElementById("kpi-plazas").textContent = plazasLibres;

    document.getElementById("tabla-instituciones").innerHTML = instituciones.map(function (inst) {
        return "<tr>" +
            "<td>" + inst.nombre + "</td>" +
            "<td>" + inst.plazasOcupadas + " / " + inst.plazasTotal + "</td>" +
            "<td>" + formatearFecha(inst.convenioHasta) + "</td>" +
            "<td>" + badge(inst.estado) + "</td>" +
            "</tr>";
    }).join("");

    // Refresca también el combo de instituciones en "Asignación de estudiantes"
    document.getElementById("as-institucion").innerHTML = instituciones
        .filter(function (inst) { return inst.plazasOcupadas < inst.plazasTotal; })
        .map(function (inst) {
            let libres = inst.plazasTotal - inst.plazasOcupadas;
            return "<option>" + inst.nombre + " (" + libres + " plaza" + (libres === 1 ? "" : "s") + " disponible" + (libres === 1 ? "" : "s") + ")</option>";
        }).join("");
}

function pintarAsignaciones() {
    document.getElementById("tabla-asignaciones").innerHTML = asignaciones.map(function (a) {
        return "<tr><td>" + a.estudiante + "</td><td>" + a.institucion + "</td><td>" + a.docente + "</td><td>" + formatearFecha(a.fecha) + "</td><td>" + badge(a.estado) + "</td></tr>";
    }).join("");
}

function pintarPracticas() {
    let porEstudiante = {};
    bitacoras.forEach(function (b) {
        if (!porEstudiante[b.estudiante] || b.fecha > porEstudiante[b.estudiante].fecha) {
            porEstudiante[b.estudiante] = b;
        }
    });

    let pendientesTotal = bitacoras.filter(function (b) { return b.estado === "Pendiente"; }).length;
    document.getElementById("kpi-bitacoras").textContent = pendientesTotal;

    document.getElementById("tabla-practicas").innerHTML = Object.keys(porEstudiante).map(function (nombre) {
        let b = porEstudiante[nombre];
        return "<tr><td>" + nombre + "</td><td>" + b.titulo + " (" + formatearFecha(b.fecha) + ")</td><td>" + b.horas + " h registradas</td><td>" + badge(b.estado) + "</td></tr>";
    }).join("");
}

function pintarReportes() {
    let recibidos = reportes.filter(function (r) { return r.destinatarioRol === "director"; });
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

    let propios = reportes.filter(function (r) { return r.generadoPor === miNombre; });
    document.getElementById("tabla-reportes-propios").innerHTML = propios.map(function (r) {
        return "<tr><td>" + formatearFecha(r.fecha) + "</td><td>" + r.tipo + "</td><td>" + r.periodo + "</td></tr>";
    }).join("");
}

/* =========================================================
   4. ACCIONES
========================================================= */

// RF03: registrar institución
function mostrarFormInstitucion() {
    document.getElementById("form-institucion").style.display = "block";
}

function cancelarInstitucion() {
    document.getElementById("form-institucion").style.display = "none";
    document.getElementById("in-nombre").value = "";
    document.getElementById("in-plazas").value = "";
    document.getElementById("in-convenio").value = "";
}

function guardarInstitucion() {
    let nombre = document.getElementById("in-nombre").value.trim();
    let plazas = document.getElementById("in-plazas").value;
    let convenio = document.getElementById("in-convenio").value;

    if (!nombre || !plazas || !convenio) {
        alert("Por favor completa todos los campos de la institución.");
        return;
    }

    instituciones.push({ nombre: nombre, plazasOcupadas: 0, plazasTotal: Number(plazas), convenioHasta: convenio, estado: "Vigente" });
    guardar("sigpaInstituciones", instituciones);

    alert("Institución \"" + nombre + "\" registrada correctamente.");
    cancelarInstitucion();
    pintarInstituciones();
}

// RF05 / RF06: asignar estudiante a una plaza y a un docente asesor
function guardarAsignacion() {
    let estudiante = document.getElementById("as-estudiante").value;
    let institucionTexto = document.getElementById("as-institucion").value;
    let docente = document.getElementById("as-docente").value;
    let fecha = document.getElementById("as-fecha").value;

    if (!institucionTexto || !fecha) {
        alert("Selecciona la institución y la fecha de inicio.");
        return;
    }

    let nombreInstitucion = institucionTexto.split(" (")[0];
    let institucion = instituciones.find(function (i) { return i.nombre === nombreInstitucion; });
    if (institucion) {
        institucion.plazasOcupadas += 1;
        guardar("sigpaInstituciones", instituciones);
    }

    asignaciones.push({ estudiante: estudiante, institucion: nombreInstitucion, docente: docente, fecha: fecha, estado: "Activa" });
    guardar("sigpaAsignaciones", asignaciones);

    alert(estudiante + " fue asignado correctamente a " + nombreInstitucion + " con la docente asesora " + docente + ".");

    document.getElementById("as-fecha").value = "";
    pintarInstituciones();
    pintarAsignaciones();
}

// RF13: generar reporte (nivel dirección, no tiene más destinatario)
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
        generadoPorRol: "director",
        destinatarioRol: null,
        destinatarioNombre: "Archivo de dirección"
    });
    guardar("sigpaReportes", reportes);

    alert("Reporte generado correctamente y archivado en dirección.");

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
pintarInstituciones();
pintarAsignaciones();
pintarPracticas();
pintarReportes();
