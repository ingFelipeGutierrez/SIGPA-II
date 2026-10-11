/* =========================================================================
   SIGPA · estudiante/estudiante.js
   Lógica del panel del Estudiante.

   CU 1 Consultar plaza asignada y estado de aprobación  -> "Mi práctica"
   CU 2 Consultar retroalimentación y observaciones       -> "Evaluaciones"
   CU 3 Registrar bitácora de práctica (con evidencias)   -> "Bitácoras"

   Los datos se piden a Datos.* (ver js/datos.js). Requiere comun.js.
   ========================================================================= */

const S = sesion();
const MI_ID = S.refId;
pintarUsuario();

const EXTENSIONES = ["pdf", "jpg", "jpeg", "png", "docx", "pptx", "xlsx"];
const MAX_MB = 5;


/* =========================================================
   INICIO
========================================================= */
async function pintarInicio() {
    document.getElementById("saludo").textContent = "Hola, " + primerNombre(S.nombre);

    let pr = (await Datos.obtenerPracticas({})).find(function (p) { return p.estudianteId === MI_ID; });
    let bits = await Datos.obtenerBitacoras({ estudianteId: MI_ID });
    let notas = await Datos.obtenerNotasEstudiante(MI_ID);
    let retros = await Datos.obtenerRetroalimentaciones({ estudianteId: MI_ID });

    document.getElementById("kpis").innerHTML =
        tarjeta("Práctica asignada", pr ? badge(pr.estado) : "Sin asignar", pr ? pr.institucion : "", "Ver práctica", "practica") +
        tarjeta("Horas cumplidas", pr ? formatearHoras(pr.horasCumplidas) + " / " + pr.horasRequeridas : "—", "", "Ver avance de horas", "practica") +
        tarjeta("Bitácoras registradas", bits.length, "", "Ver bitácoras", "bitacoras") +
        tarjeta("Evaluaciones recibidas", notas.length, "", "Ver evaluaciones", "evaluaciones");

    // Últimas actividades (movimientos reales)
    let mov = [];
    bits.forEach(function (b) {
        mov.push({ f: b.fechaRegistro, t: "Registraste la bitácora", d: b.titulo });
        if (b.estado === "Aprobada") mov.push({ f: b.fechaRevision, t: "Bitácora aprobada", d: b.titulo });
        if (b.estado === "Requiere corrección") mov.push({ f: b.fechaRevision, t: "Corrección solicitada", d: b.titulo });
    });
    notas.forEach(function (n) { mov.push({ f: n.fecha, t: "Nota recibida (" + formatearNota(n.valor) + ")", d: n.bitacora }); });
    retros.forEach(function (r) { mov.push({ f: r.fecha, t: "Retroalimentación recibida", d: r.bitacora }); });
    mov = mov.filter(function (m) { return m.f; }).sort(function (a, b) { return a.f < b.f ? 1 : -1; }).slice(0, 5);
    document.getElementById("actividades").innerHTML = mov.length
        ? mov.map(function (m) { return '<div class="activity">' + escaparHtml(m.t) + "<small>" + escaparHtml(m.d) + " · " + formatearFecha(m.f) + "</small></div>"; }).join("")
        : '<div class="vacio">Aún no tienes actividad.</div>';

    // Mi práctica en fechas
    let cont = document.getElementById("fechas");
    if (!pr) { cont.innerHTML = '<div class="vacio">Aún no tienes una práctica asignada.</div>'; return; }
    let pendientes = Math.max(0, pr.horasRequeridas - pr.horasCumplidas);
    let corr = bits.filter(function (b) { return b.estado === "Requiere corrección"; }).length;
    cont.innerHTML =
        '<p class="dato-linea"><strong>Inicio:</strong> ' + formatearFecha(pr.fechaInicio) + "</p>" +
        '<p class="dato-linea"><strong>Fin:</strong> ' + formatearFecha(pr.fechaFin) + "</p>" +
        '<p class="dato-linea"><strong>Horas pendientes:</strong> ' + formatearHoras(pendientes) + " h</p>" +
        (corr ? '<div class="aviso aviso-naranja" style="margin-top:10px">⚠️ Tienes ' + corr + " bitácora(s) que requieren corrección. <button class='enlace-accion' onclick=\"mostrarPagina('bitacoras')\">Ver bitácoras</button></div>" : "");
}

function tarjeta(titulo, numero, sub, enlace, pagina) {
    return '<div class="card stat-card"><div class="stat-title">' + titulo + '</div>' +
        '<div class="stat-number">' + numero + "</div>" +
        (sub ? '<div style="font-size:12px;color:var(--gris-texto);margin-bottom:6px">' + escaparHtml(sub) + "</div>" : "") +
        '<div class="stat-link" onclick="mostrarPagina(\'' + pagina + "')\">" + enlace + "</div></div>";
}


/* =========================================================
   CU 1 · MI PRÁCTICA
========================================================= */
async function pintarPractica() {
    let cont = document.getElementById("practica-contenido");
    let pr = (await Datos.obtenerPracticas({})).find(function (p) { return p.estudianteId === MI_ID; });

    if (!pr) {
        cont.innerHTML = '<div class="card vacio">Aún no tienes una plaza de práctica asignada. Cuando el director de programa te la asigne, la verás aquí.</div>';
        return;
    }

    let bits = await Datos.obtenerBitacoras({ estudianteId: MI_ID });
    let aprobadas = bits.filter(function (b) { return b.estado === "Aprobada"; });
    let pct = pr.porcentaje;
    let pendientes = Math.max(0, pr.horasRequeridas - pr.horasCumplidas);
    let nivel = Datos.NIVELES[pr.nivel] || {};

    // estado + última actualización
    let detalleEstado = '<p class="dato-linea" style="margin-top:12px;color:var(--gris-texto)">Última actualización: ' + formatearFecha(fechaUltimoEstado(pr)) + "</p>";
    if (pr.estado === "Finalizada") detalleEstado += '<p class="dato-linea">Pendiente de la decisión del director.</p>';
    if (pr.estado === "Rechazada") detalleEstado += '<button class="enlace-detalle" onclick="verMotivo(\'' + escaparHtml(pr.motivoRechazo).replace(/'/g, "\\'") + "')\">Ver detalle</button>";

    let cuerpoHoras = aprobadas.length === 0
        ? '<div class="hours-number">0</div><p>de ' + pr.horasRequeridas + ' horas requeridas</p><div class="progress"><div class="progress-bar" style="width:0%"></div></div><p class="dato-linea" style="margin-top:12px">Aún no hay horas registradas.</p>'
        : '<div class="hours-number">' + formatearHoras(pr.horasCumplidas) + '</div><p>de ' + pr.horasRequeridas + ' horas requeridas</p>' +
          '<div class="progress"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
          '<p class="dato-linea" style="margin-top:12px">Avance: <strong>' + pct + "%</strong> · Pendientes: <strong>" + formatearHoras(pendientes) + " h</strong></p>" +
          '<button class="enlace-detalle" id="boton-detalle-horas" onclick="alternarDetalleHoras()">Ver detalle</button>';

    let filasHoras = aprobadas.map(function (b) {
        return "<tr><td data-label='Fecha'>" + formatearFecha(b.fecha) + "</td><td data-label='Actividad'>" + escaparHtml(b.titulo) + "</td><td data-label='Horas'>" + formatearHoras(b.horas) + "</td><td data-label='Estado'>" + badge(b.estado) + "</td></tr>";
    }).join("");

    cont.innerHTML =
        '<div class="grid-2" style="margin-bottom:20px">' +
            '<div class="card"><div class="section-title">Plaza asignada</div>' +
                "<h3>" + escaparHtml(pr.institucion) + "</h3><br>" +
                linea("Programa", pr.programa) + linea("Docente asesor", pr.docente || "Sin asignar") +
                linea("Fecha de inicio", formatearFecha(pr.fechaInicio)) + linea("Fecha de finalización", formatearFecha(pr.fechaFin)) +
                '<br><button class="enlace-detalle" onclick="verInstitucion(' + pr.institucionObj.id + ')">Ver más detalles</button></div>' +
            '<div class="card"><div class="section-title">Tipo y nivel de práctica</div>' +
                linea("Tipo", pr.tipo) + linea("Nivel", "Nivel " + pr.nivel) +
                '<p class="dato-linea" style="color:var(--gris-texto)">' + escaparHtml(nivel.requisitos || "") + "</p><br>" +
                '<button class="enlace-detalle" onclick="verNivel(' + pr.nivel + ')">Ver requisitos del nivel</button></div>' +
        "</div>" +
        '<div class="grid-2">' +
            '<div class="card"><div class="section-title">Estado de la práctica</div>' + badge(pr.estado) + detalleEstado + "</div>" +
            '<div class="card"><div class="section-title">Avance de horas</div>' + cuerpoHoras + "</div>" +
        "</div>" +
        '<div class="table-container" id="detalle-horas" style="display:none; margin-top:20px"><h3 style="margin-bottom:12px">Horas por bitácora aprobada</h3>' +
            '<table class="apilable"><thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th><th>Estado</th></tr></thead><tbody>' + filasHoras + "</tbody></table></div>";
}

function linea(k, v) { return '<p class="dato-linea"><strong>' + k + ":</strong> " + escaparHtml(v) + "</p>"; }

function fechaUltimoEstado(pr) {
    if (pr.resultado) return pr.fechaResultado;
    if (pr.estado === "En curso") return pr.fechaInicio;
    if (pr.estado === "Finalizada") return pr.fechaFin;
    return pr.fechaAsignacion;
}

async function verInstitucion(id) {
    let inst = (await Datos.obtenerInstituciones()).find(function (i) { return i.id === id; });
    abrirModal(inst.nombre,
        linea("Dirección", inst.direccion) + linea("Contacto", inst.contacto) + linea("Tipo de institución", inst.tipo));
}
function verNivel(n) {
    let nv = Datos.NIVELES[n] || {};
    abrirModal("Nivel " + n, "<p>" + escaparHtml(nv.ampliados || nv.requisitos || "") + "</p>");
}
function verMotivo(motivo) {
    abrirModal("Motivo del rechazo", '<div class="bloque-rechazo" style="margin-top:0">' + escaparHtml(motivo || "No se registraron observaciones.") + "</div>");
}
function alternarDetalleHoras() {
    let caja = document.getElementById("detalle-horas");
    let b = document.getElementById("boton-detalle-horas");
    let visible = caja.style.display !== "none";
    caja.style.display = visible ? "none" : "block";
    b.textContent = visible ? "Ver detalle" : "Ocultar detalle";
}


/* =========================================================
   CU 3 · BITÁCORAS (historial)
========================================================= */
let practicaActual = null;

async function pintarBitacoras() {
    let bits = await Datos.obtenerBitacoras({ estudianteId: MI_ID });
    practicaActual = (await Datos.obtenerPracticas({})).find(function (p) { return p.estudianteId === MI_ID; });
    let enCurso = practicaActual && practicaActual.estado === "En curso";
    let sinResultado = practicaActual && !practicaActual.resultado;

    document.getElementById("boton-nueva").disabled = !enCurso;
    document.getElementById("aviso-no-curso").style.display = enCurso ? "none" : (practicaActual ? "flex" : "none");

    document.getElementById("tabla-bitacoras").innerHTML = bits.map(function (b) {
        let n = (b.evidencias || []).length;
        let acc = '<button class="button-secondary" onclick="verBitacora(' + b.id + ')">👁️ Ver</button>';
        if (b.estado === "Requiere corrección" && sinResultado) acc += ' <button class="button-primary" onclick="corregir(' + b.id + ')">✏️ Corregir</button>';
        return "<tr><td data-label='Fecha'>" + formatearFecha(b.fecha) + "</td><td data-label='Título'>" + escaparHtml(b.titulo) +
            "</td><td data-label='Descripción'>" + escaparHtml(b.descripcion) + "</td><td data-label='Horas'>" + formatearHoras(b.horas) +
            "</td><td data-label='Evidencias'>" + (n ? "📎 " + n : "—") + "</td><td data-label='Estado'>" + badge(b.estado) +
            "</td><td data-label='Acciones'>" + acc + "</td></tr>";
    }).join("");
    document.getElementById("vacio-bitacoras").style.display = bits.length ? "none" : "block";
    if (!bits.length) document.getElementById("vacio-bitacoras").textContent = 'Aún no has registrado bitácoras.';
}

async function verBitacora(id) {
    let b = (await Datos.obtenerBitacoras({ estudianteId: MI_ID })).find(function (x) { return x.id === id; });
    if (!b) return;
    let evid = (b.evidencias || []).length
        ? '<ul class="lista-archivos">' + b.evidencias.map(function (e) { return "<li><span>📄 " + escaparHtml(e.nombre) + "<small>" + e.tipo + " · " + formatearTamano(e.tamanoKB) + "</small></span></li>"; }).join("") + "</ul>"
        : '<p class="dato-linea" style="color:var(--gris-texto)">Sin evidencias adjuntas.</p>';
    let correccion = b.estado === "Requiere corrección" ? '<div class="bloque-rechazo"><strong>Motivo de la corrección:</strong><br>' + escaparHtml(b.motivoCorreccion) + "</div>" : "";
    abrirModal(b.titulo,
        linea("Fecha", formatearFecha(b.fecha)) + linea("Horas dedicadas", formatearHoras(b.horas)) +
        '<p class="dato-linea"><strong>Estado:</strong> ' + badge(b.estado) + "</p>" +
        '<p class="dato-linea"><strong>Descripción:</strong><br>' + escaparHtml(b.descripcion) + "</p>" + correccion +
        '<p class="dato-linea"><strong>Evidencias:</strong></p>' + evid);
}


/* =========================================================
   CU 3 · FORMULARIO POR PASOS
========================================================= */
const PASOS = ["Actividad", "Descripción", "Evidencias", "Revisión"];
let borrador = vacio();
let pasoActual = 1, pasoMaximo = 1, modoCorreccion = null;

function vacio() { return { fecha: "", horas: "", titulo: "", descripcion: "", evidencias: [] }; }

function abrirNuevaBitacora() {
    modoCorreccion = null;
    borrador = vacio();
    pasoActual = 1; pasoMaximo = 1;
    document.getElementById("nb-titulo-pagina").textContent = "Nueva bitácora";
    document.getElementById("boton-guardar").textContent = "Guardar bitácora";
    document.getElementById("nb-aviso-correccion").style.display = "none";
    ["nb-fecha", "nb-horas", "nb-titulo", "nb-descripcion"].forEach(function (id) { document.getElementById(id).value = ""; });
    document.getElementById("nb-fecha").max = fechaHoy();
    limpiarErrores();
    renderWizard();
    mostrarPagina("nueva-bitacora", document.getElementById("menu-bitacoras"));
}

async function corregir(id) {
    let b = (await Datos.obtenerBitacoras({ estudianteId: MI_ID })).find(function (x) { return x.id === id; });
    if (!b) return;
    modoCorreccion = id;
    borrador = { fecha: b.fecha, horas: b.horas, titulo: b.titulo, descripcion: b.descripcion, evidencias: (b.evidencias || []).slice() };
    pasoActual = 1; pasoMaximo = 4;
    document.getElementById("nb-titulo-pagina").textContent = "Corregir bitácora";
    document.getElementById("boton-guardar").textContent = "Guardar corrección";
    let aviso = document.getElementById("nb-aviso-correccion");
    aviso.style.display = "flex";
    aviso.innerHTML = "⚠️ <span><strong>Motivo de la corrección:</strong> " + escaparHtml(b.motivoCorreccion) + "</span>";
    document.getElementById("nb-fecha").value = b.fecha;
    document.getElementById("nb-horas").value = b.horas;
    document.getElementById("nb-titulo").value = b.titulo;
    document.getElementById("nb-descripcion").value = b.descripcion;
    document.getElementById("nb-fecha").max = fechaHoy();
    limpiarErrores();
    renderWizard();
    mostrarPagina("nueva-bitacora", document.getElementById("menu-bitacoras"));
}

function cancelarBitacora() { borrador = vacio(); mostrarPagina("bitacoras"); }

function leerCampos() {
    borrador.fecha = document.getElementById("nb-fecha").value;
    borrador.horas = document.getElementById("nb-horas").value;
    borrador.titulo = document.getElementById("nb-titulo").value.trim();
    borrador.descripcion = document.getElementById("nb-descripcion").value.trim();
}
function marcar(id, msg) {
    document.getElementById("grupo-" + id).classList.toggle("con-error", !!msg);
    document.getElementById("err-" + id).textContent = msg || "";
    return !msg;
}
function limpiarErrores() {
    ["nb-fecha", "nb-horas", "nb-titulo", "nb-descripcion"].forEach(function (id) { marcar(id, ""); });
    document.getElementById("err-evidencias").textContent = "";
}
function validarPaso(n) {
    leerCampos();
    if (n === 1) {
        let f = marcar("nb-fecha", !borrador.fecha ? "Selecciona la fecha de la actividad." : borrador.fecha > fechaHoy() ? "La fecha no puede ser posterior a hoy." : "");
        let h = marcar("nb-horas", Number(borrador.horas) > 0 ? "" : "Ingresa un número de horas mayor que 0.");
        let t = marcar("nb-titulo", borrador.titulo ? "" : "Escribe un título para la actividad.");
        return f && h && t;
    }
    if (n === 2) return marcar("nb-descripcion", borrador.descripcion ? "" : "Describe la actividad realizada.");
    return true;
}
function siguientePaso(n) { if (!validarPaso(n)) return; pasoActual = n + 1; pasoMaximo = Math.max(pasoMaximo, pasoActual); renderWizard(); }
function irAPaso(n) { if (n > pasoMaximo) return; leerCampos(); pasoActual = n; renderWizard(); }

document.getElementById("nb-archivos").addEventListener("change", function (e) { agregarArchivos(e.target.files); e.target.value = ""; });

function agregarArchivos(archivos) {
    let errores = [];
    Array.from(archivos).forEach(function (f) {
        let ext = f.name.split(".").pop().toLowerCase();
        let kb = Math.max(1, Math.round(f.size / 1024));
        if (EXTENSIONES.indexOf(ext) === -1) errores.push(f.name + ": formato no permitido.");
        else if (f.size > MAX_MB * 1024 * 1024) errores.push(f.name + ": supera los " + MAX_MB + " MB.");
        else if (borrador.evidencias.some(function (x) { return x.nombre === f.name && x.tamanoKB === kb; })) errores.push(f.name + ": ya estaba adjunto.");
        else borrador.evidencias.push({ nombre: f.name, tipo: ext.toUpperCase().replace("JPEG", "JPG"), tamanoKB: kb });
    });
    if (errores.length) {
        document.getElementById("err-evidencias").textContent = "No se adjuntó: " + errores.join(" ") + " Formatos permitidos: PDF, JPG, PNG, DOCX, PPTX y XLSX (máximo " + MAX_MB + " MB).";
        mostrarToast("Algún archivo no cumple el formato o el tamaño permitido.", "error");
    } else document.getElementById("err-evidencias").textContent = "";
    renderWizard();
}
function quitarEvidencia(i) { borrador.evidencias.splice(i, 1); document.getElementById("err-evidencias").textContent = ""; renderWizard(); }

async function guardarBitacora() {
    leerCampos();
    let p1 = validarPaso(1), p2 = validarPaso(2);
    if (!p1 || !p2) {
        let faltan = [];
        if (!borrador.fecha) faltan.push("Fecha");
        if (!(Number(borrador.horas) > 0)) faltan.push("Horas dedicadas");
        if (!borrador.titulo) faltan.push("Título");
        if (!borrador.descripcion) faltan.push("Descripción");
        pasoActual = !p1 ? 1 : 2; pasoMaximo = Math.max(pasoMaximo, pasoActual);
        renderWizard();
        mostrarToast(faltan.length ? "Faltan campos obligatorios: " + faltan.join(", ") + "." : "Revisa los campos marcados en rojo.", "error");
        return;
    }
    try {
        let datos = { estudianteId: MI_ID, fecha: borrador.fecha, horas: Number(borrador.horas),
            titulo: borrador.titulo, descripcion: borrador.descripcion, evidencias: borrador.evidencias.slice() };
        if (modoCorreccion) { await Datos.corregirBitacora(modoCorreccion, datos); mostrarToast("Bitácora corregida y enviada nuevamente a revisión.", "ok"); }
        else { await Datos.registrarBitacora(datos); mostrarToast("Bitácora guardada correctamente. Quedó pendiente de revisión por tu docente asesor.", "ok"); }
        borrador = vacio();
        await pintarInicio(); await pintarBitacoras();
        mostrarPagina("bitacoras");
    } catch (e) {
        mostrarToast("No se pudo guardar la bitácora.", "error");
    }
}

function resumenPaso(n) {
    if (n === 1) return formatearFecha(borrador.fecha) + " · " + formatearHoras(Number(borrador.horas)) + " h · " + borrador.titulo;
    if (n === 2) return borrador.descripcion.length > 90 ? borrador.descripcion.slice(0, 90) + "…" : borrador.descripcion;
    if (n === 3) { let c = borrador.evidencias.length; return c ? c + (c === 1 ? " evidencia adjunta" : " evidencias adjuntas") : "Sin evidencias adjuntas"; }
    return "";
}

function renderWizard() {
    document.getElementById("stepper").innerHTML = PASOS.map(function (nombre, i) {
        let n = i + 1;
        let clase = n < pasoActual ? "hecho" : n === pasoActual ? "actual" : "";
        let linea = i < PASOS.length - 1 ? '<div class="paso-linea ' + (n < pasoActual ? "hecha" : "") + '"></div>' : "";
        return '<div class="paso ' + clase + '"><span class="paso-num">' + (n < pasoActual ? "✓" : n) + "</span>" + nombre + "</div>" + linea;
    }).join("");
    document.getElementById("stepper-movil").textContent = "Paso " + pasoActual + " de 4 · " + PASOS[pasoActual - 1];

    for (let n = 1; n <= 4; n++) {
        let t = document.getElementById("paso-" + n);
        t.classList.toggle("actual", n === pasoActual);
        t.classList.toggle("bloqueada", n > pasoMaximo);
        let completado = n < pasoActual;
        document.getElementById("resumen-" + n).textContent = completado ? resumenPaso(n) : "";
        let ed = document.getElementById("editar-" + n);
        if (ed) ed.style.display = completado ? "inline" : "none";
    }
    document.getElementById("resumen-4").textContent = pasoActual === 4 ? "Verifica la información antes de guardar." : "";

    document.getElementById("lista-evidencias").innerHTML = borrador.evidencias.map(function (e, i) {
        return "<li><span>📄 " + escaparHtml(e.nombre) + "<small>" + e.tipo + " · " + formatearTamano(e.tamanoKB) + "</small></span>" +
            '<button class="quitar" onclick="quitarEvidencia(' + i + ')" aria-label="Quitar">✕</button></li>';
    }).join("");

    let evid = borrador.evidencias.length
        ? '<ul class="lista-archivos">' + borrador.evidencias.map(function (e) { return "<li><span>📄 " + escaparHtml(e.nombre) + "<small>" + e.tipo + "</small></span></li>"; }).join("") + "</ul>"
        : '<p class="dato-linea" style="color:var(--gris-texto)">Sin evidencias adjuntas.</p>';
    document.getElementById("revision-contenido").innerHTML =
        linea("Fecha", borrador.fecha ? formatearFecha(borrador.fecha) : "—") +
        linea("Horas dedicadas", borrador.horas ? formatearHoras(Number(borrador.horas)) : "—") +
        linea("Título", borrador.titulo || "—") +
        '<p class="dato-linea"><strong>Descripción:</strong><br>' + escaparHtml(borrador.descripcion || "—") + "</p>" +
        '<p class="dato-linea"><strong>Evidencias:</strong></p>' + evid +
        '<p class="dato-linea" style="color:var(--gris-texto);margin-top:12px">Al guardar, la bitácora quedará en estado «Pendiente» hasta que tu docente asesor la revise.</p>';

    actualizarBarra();
}
function actualizarBarra() {
    document.getElementById("res-fecha").textContent = borrador.fecha ? formatearFecha(borrador.fecha) : "—";
    document.getElementById("res-horas").textContent = borrador.horas ? formatearHoras(Number(borrador.horas)) + " h" : "—";
    document.getElementById("res-evidencias").textContent = borrador.evidencias.length;
}
["nb-fecha", "nb-horas", "nb-titulo", "nb-descripcion"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function () { leerCampos(); actualizarBarra(); });
});


/* =========================================================
   CU 2 · EVALUACIONES
========================================================= */
function enRango(fecha) {
    let d = document.getElementById("ev-desde").value, h = document.getElementById("ev-hasta").value;
    return (!d || fecha >= d) && (!h || fecha <= h);
}
async function pintarEvaluaciones() {
    let d = document.getElementById("ev-desde").value, h = document.getElementById("ev-hasta").value;
    if (d && h && d > h) { mostrarToast("La fecha inicial no puede ser posterior a la fecha final.", "error"); return; }

    let todasNotas = await Datos.obtenerNotasEstudiante(MI_ID);
    let todasRetro = await Datos.obtenerRetroalimentaciones({ estudianteId: MI_ID });
    let notas = todasNotas.filter(function (n) { return enRango(n.fecha); });
    let retros = todasRetro.filter(function (r) { return enRango(r.fecha); });
    let hayFiltro = d || h;

    document.getElementById("tabla-evaluaciones").innerHTML = notas.map(function (n) {
        return "<tr><td data-label='Fecha'>" + formatearFecha(n.fecha) + "</td><td data-label='Bitácora'>" + escaparHtml(n.bitacora) +
            "</td><td data-label='Evaluador'>" + escaparHtml(n.evaluador) + "</td><td data-label='Nota'><strong>" + formatearNota(n.valor) +
            "</strong></td><td data-label='Observaciones'>" + escaparHtml(n.observaciones || "—") + "</td>" +
            "<td data-label='Acciones'><button class='button-secondary' onclick='verEvaluacion(" + JSON.stringify(n).replace(/'/g, "&#39;") + ")'>👁️ Ver</button></td></tr>";
    }).join("");

    let vn = document.getElementById("vacio-notas");
    if (notas.length) vn.style.display = "none";
    else {
        vn.style.display = "block";
        vn.textContent = (!todasNotas.length && !todasRetro.length) ? "Aún no hay retroalimentación ni evaluaciones disponibles para consultar."
            : hayFiltro ? "No hay notas en el periodo seleccionado." : "Aún no tienes notas registradas por tu docente asesor.";
    }

    let cont = document.getElementById("lista-retroalimentaciones");
    cont.innerHTML = retros.length
        ? retros.map(function (r) { return '<div class="retro-item"><small>' + formatearFecha(r.fecha) + " · " + escaparHtml(r.evaluador) + " · " + escaparHtml(r.bitacora) + "</small>" + escaparHtml(r.texto) + "</div>"; }).join("")
        : '<div class="vacio">' + (hayFiltro && todasRetro.length ? "No hay retroalimentaciones en el periodo seleccionado." : "Tu docente asesor aún no ha registrado retroalimentaciones.") + "</div>";
}
function limpiarFiltroEvaluaciones() { document.getElementById("ev-desde").value = ""; document.getElementById("ev-hasta").value = ""; pintarEvaluaciones(); }
function verEvaluacion(n) {
    abrirModal("Evaluación de la bitácora",
        linea("Evaluador", n.evaluador) + linea("Bitácora", n.bitacora) + linea("Fecha de la evaluación", formatearFecha(n.fecha)) +
        linea("Nota", formatearNota(n.valor)) + '<p class="dato-linea"><strong>Observaciones:</strong><br>' + escaparHtml(n.observaciones || "—") + "</p>");
}


/* =========================================================
   ARRANQUE
========================================================= */
(async function () {
    await pintarInicio();
    await pintarPractica();
    await pintarBitacoras();
    await pintarEvaluaciones();
})();
