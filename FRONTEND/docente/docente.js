/* =========================================================================
   SIGPA · docente/docente.js
   Lógica del panel del Docente Asesor.

   CU 1 Consultar estudiantes asignados y avances de horas -> "Mis estudiantes"
   CU 2 Revisar bitácora del estudiante                    -> modal "Revisión"
   CU 3 Registrar nota en bitácora                         -> modal, pestaña Nota
   CU 4 Registrar y consultar retroalimentación            -> modal, pestaña Retro

   Requiere comun.js y datos.js.
   ========================================================================= */

const S = sesion();
const MI_ID = S.refId;
pintarUsuario();


/* =========================================================
   INICIO
========================================================= */
async function pintarInicio() {
    document.getElementById("saludo").textContent = "Hola, " + primerNombre(S.nombre);
    let ests = await Datos.obtenerPracticas({ docenteId: MI_ID });
    let bits = await Datos.obtenerBitacoras({ docenteId: MI_ID });

    let porRevisar = bits.filter(function (b) { return b.estado === "Pendiente"; }).length;
    let sinNota = bits.filter(function (b) { return b.estado === "Aprobada" && b.nota === null; }).length;
    let activos = ests.filter(function (p) { return ["En curso", "Finalizada"].indexOf(p.estado) !== -1; });
    let promedio = activos.length ? Math.round(activos.reduce(function (s, p) { return s + p.porcentaje; }, 0) / activos.length) : 0;

    document.getElementById("kpis").innerHTML =
        tarjeta("Estudiantes a cargo", ests.length, "Ver estudiantes", "estudiantes") +
        tarjeta("Bitácoras por revisar", porRevisar, "Revisar ahora", "bitacoras") +
        tarjeta("Avance promedio de horas", promedio + "%", "Ver detalle", "estudiantes") +
        tarjeta("Bitácoras sin nota", sinNota, "Calificar", "bitacoras");

    let ultimas = bits.slice(0, 5);
    document.getElementById("ultimas-bitacoras").innerHTML = ultimas.length
        ? ultimas.map(function (b) { return '<div class="activity" style="cursor:pointer" onclick="abrirRevision(' + b.id + ')">' + escaparHtml(b.estudiante) + " — " + escaparHtml(b.titulo) + "<small>" + formatearFecha(b.fecha) + " · " + b.estado + "</small></div>"; }).join("")
        : '<div class="vacio">Tus estudiantes aún no han registrado bitácoras.</div>';

    document.getElementById("avance-estudiantes").innerHTML = ests.length
        ? ests.map(function (p) {
            return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px"><span>' + escaparHtml(p.estudiante) + "</span><strong>" + p.porcentaje + '%</strong></div><div class="progress"><div class="progress-bar" style="width:' + p.porcentaje + '%"></div></div></div>';
        }).join("")
        : '<div class="vacio">No tienes estudiantes asignados.</div>';
}

function tarjeta(titulo, numero, enlace, pagina) {
    return '<div class="card stat-card"><div class="stat-title">' + titulo + '</div><div class="stat-number">' + numero + '</div><div class="stat-link" onclick="mostrarPagina(\'' + pagina + "')\">" + enlace + "</div></div>";
}


/* =========================================================
   CU 1 · MIS ESTUDIANTES
========================================================= */
async function cargarFiltros() {
    let ests = await Datos.obtenerPracticas({ docenteId: MI_ID });
    let insts = [];
    ests.forEach(function (p) { if (p.institucion && insts.indexOf(p.institucion) === -1) insts.push(p.institucion); });
    document.getElementById("f-institucion").innerHTML = '<option value="">Todas</option>' + insts.map(function (i) { return "<option>" + escaparHtml(i) + "</option>"; }).join("");
    let sel = document.getElementById("fb-estudiante");
    sel.innerHTML = '<option value="">Todos</option>' + ests.map(function (p) { return '<option value="' + p.estudianteId + '">' + escaparHtml(p.estudiante) + "</option>"; }).join("");
}

async function pintarEstudiantes() {
    let ests = await Datos.obtenerPracticas({ docenteId: MI_ID });
    let fi = document.getElementById("f-institucion").value;
    let fe = document.getElementById("f-estado").value;
    let lista = ests.filter(function (p) { return (!fi || p.institucion === fi) && (!fe || p.estado === fe); });

    document.getElementById("tabla-estudiantes").innerHTML = lista.map(function (p) {
        return "<tr><td data-label='Estudiante'>" + escaparHtml(p.estudiante) + "</td><td data-label='Institución'>" + escaparHtml(p.institucion || "Sin asignar") +
            "</td><td data-label='Horas'>" + formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas + "</td><td data-label='Estado'>" + badge(p.estado) +
            "</td><td data-label='Acciones'><button class='button-secondary' onclick='verAvance(" + p.estudianteId + ")'>Ver avance</button> <button class='button-secondary' onclick='verBitacorasDe(" + p.estudianteId + ")'>Ver bitácoras</button></td></tr>";
    }).join("");
    let vacio = document.getElementById("vacio-estudiantes");
    if (lista.length) vacio.style.display = "none";
    else { vacio.style.display = "block"; vacio.textContent = ests.length ? "No hay estudiantes que coincidan con los filtros seleccionados." : "No tienes estudiantes asignados."; }
}
function limpiarFiltrosEst() { document.getElementById("f-institucion").value = ""; document.getElementById("f-estado").value = ""; document.getElementById("avance-detalle").innerHTML = ""; pintarEstudiantes(); }

async function verAvance(estudianteId) {
    let p = (await Datos.obtenerPracticas({ docenteId: MI_ID })).find(function (x) { return x.estudianteId === estudianteId; });
    let bits = (await Datos.obtenerBitacoras({ estudianteId: estudianteId })).filter(function (b) { return b.estado === "Aprobada"; });
    document.querySelectorAll("#tabla-estudiantes tr").forEach(function (tr) { tr.classList.remove("seleccionada"); });

    let cuerpo = bits.length
        ? '<table class="apilable"><thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th></tr></thead><tbody>' +
            bits.map(function (b) { return "<tr><td data-label='Fecha'>" + formatearFecha(b.fecha) + "</td><td data-label='Actividad'>" + escaparHtml(b.titulo) + "</td><td data-label='Horas'>" + formatearHoras(b.horas) + "</td></tr>"; }).join("") + "</tbody></table>"
        : '<p class="dato-linea">Aún no hay horas registradas para este estudiante.</p>';
    let pend = Math.max(0, p.horasRequeridas - p.horasCumplidas);
    document.getElementById("avance-detalle").innerHTML =
        '<div class="card"><div class="section-title">Avance de horas · ' + escaparHtml(p.estudiante) + "</div>" +
        '<p class="dato-linea">Cumplidas: <strong>' + formatearHoras(p.horasCumplidas) + "</strong> de " + p.horasRequeridas + " · Pendientes: <strong>" + formatearHoras(pend) + "</strong> · Avance: <strong>" + p.porcentaje + "%</strong></p>" +
        '<div class="progress" style="margin:10px 0 16px"><div class="progress-bar" style="width:' + p.porcentaje + '%"></div></div>' + cuerpo + "</div>";
    document.getElementById("avance-detalle").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function verBitacorasDe(estudianteId) {
    document.getElementById("fb-estudiante").value = String(estudianteId);
    mostrarPagina("bitacoras");
    pintarRevisar();
}


/* =========================================================
   CU 2, 3, 4 · BITÁCORAS POR REVISAR
========================================================= */
const ORDEN_ESTADO = { "Pendiente": 0, "Requiere corrección": 1, "Aprobada": 2 };

async function pintarRevisar() {
    let fe = document.getElementById("fb-estudiante").value;
    let fs = document.getElementById("fb-estado").value;
    let bits = await Datos.obtenerBitacoras({ docenteId: MI_ID });
    let total = bits.length;
    if (fe) bits = bits.filter(function (b) { return b.estudianteId === Number(fe); });
    if (fs) bits = bits.filter(function (b) { return b.estado === fs; });
    bits.sort(function (a, b) {
        let oa = ORDEN_ESTADO[a.estado] !== undefined ? ORDEN_ESTADO[a.estado] : 3;
        let ob = ORDEN_ESTADO[b.estado] !== undefined ? ORDEN_ESTADO[b.estado] : 3;
        if (oa !== ob) return oa - ob;
        return a.fecha < b.fecha ? 1 : -1;
    });

    document.getElementById("tabla-revisar").innerHTML = bits.map(function (b) {
        let n = (b.evidencias || []).length;
        let boton = b.estado === "Pendiente" ? '<button class="button-primary" onclick="abrirRevision(' + b.id + ')">Revisar</button>' : '<button class="button-secondary" onclick="abrirRevision(' + b.id + ')">Ver</button>';
        return "<tr><td data-label='Estudiante'>" + escaparHtml(b.estudiante) + "</td><td data-label='Fecha'>" + formatearFecha(b.fecha) +
            "</td><td data-label='Título'>" + escaparHtml(b.titulo) + "</td><td data-label='Descripción'>" + escaparHtml(b.descripcion.slice(0, 40)) + (b.descripcion.length > 40 ? "…" : "") +
            "</td><td data-label='Evid.'>" + (n ? "📎 " + n : "—") + "</td><td data-label='Horas'>" + formatearHoras(b.horas) +
            "</td><td data-label='Estado'>" + badge(b.estado) + "</td><td data-label='Nota'>" + (b.nota !== null ? formatearNota(b.nota) : "—") +
            "</td><td data-label='Acciones'>" + boton + "</td></tr>";
    }).join("");

    let vacio = document.getElementById("vacio-revisar");
    if (bits.length) vacio.style.display = "none";
    else { vacio.style.display = "block"; vacio.textContent = total ? "No hay bitácoras que coincidan con los filtros seleccionados." : "Tus estudiantes aún no han registrado bitácoras."; }
}
function limpiarFiltrosRev() { document.getElementById("fb-estudiante").value = ""; document.getElementById("fb-estado").value = ""; pintarRevisar(); }

// --- Modal de revisión con 3 pestañas ---
async function abrirRevision(id) {
    let b = (await Datos.obtenerBitacoras({ docenteId: MI_ID })).find(function (x) { return x.id === id; });
    if (!b) return;
    let pr = (await Datos.obtenerPracticas({})).find(function (p) { return p.estudianteId === b.estudianteId; });
    let cerrada = pr && pr.resultado;         // práctica con resultado → solo consulta
    let nota = await Datos.obtenerNota(id);
    let retros = await Datos.obtenerRetroalimentaciones({ estudianteId: b.estudianteId });

    let cuerpo =
        '<div class="tabs">' +
            '<button data-tab-boton="detalle" class="activa" onclick="pestana(\'detalle\')">Detalle</button>' +
            '<button data-tab-boton="nota" onclick="pestana(\'nota\')">Nota</button>' +
            '<button data-tab-boton="retro" onclick="pestana(\'retro\')">Retroalimentación</button>' +
        "</div>" +
        '<div data-tab="detalle">' + vistaDetalle(b, cerrada) + "</div>" +
        '<div data-tab="nota" style="display:none">' + vistaNota(b, nota, cerrada) + "</div>" +
        '<div data-tab="retro" style="display:none">' + vistaRetro(b, retros, cerrada) + "</div>";

    abrirModal("Revisión de bitácora · " + b.estudiante + " · " + b.titulo, cuerpo, { ancho: true, pie: "" });
    window._bitRevision = b;
}
function pestana(nombre) { activarPestana(document.querySelector(".modal-fondo"), nombre); }

function vistaDetalle(b, cerrada) {
    let evid = (b.evidencias || []).length
        ? '<ul class="lista-archivos">' + b.evidencias.map(function (e, i) { return "<li><span>📄 " + escaparHtml(e.nombre) + "<small>" + e.tipo + " · " + formatearTamano(e.tamanoKB) + "</small></span><button class='button-secondary' onclick='abrirEvidencia(" + i + ")'>Abrir</button></li>"; }).join("") + "</ul>"
        : '<p class="dato-linea" style="color:var(--gris-texto)">Sin evidencias adjuntas.</p>';
    let correccion = b.estado === "Requiere corrección" ? '<div class="bloque-rechazo"><strong>Motivo de la corrección:</strong><br>' + escaparHtml(b.motivoCorreccion) + "</div>" : "";
    let acciones = (b.estado === "Pendiente" && !cerrada)
        ? '<div class="modal-pie" style="margin:16px -22px -20px"><button class="button-danger" onclick="mostrarCajaCorreccion()">Solicitar corrección</button><button class="button-primary" onclick="aprobar(' + b.id + ')">Aprobar</button></div>' +
          '<div id="caja-correccion" style="display:none;margin-top:14px"><div class="form-group"><label>Motivo de la corrección</label><textarea id="motivo-correccion"></textarea><div class="campo-error" id="err-motivo" style="display:none"></div></div><div style="text-align:right"><button class="button-secondary" onclick="ocultarCajaCorreccion()">Cancelar</button> <button class="button-primary" onclick="enviarCorreccion(' + b.id + ')">Guardar</button></div></div>'
        : (cerrada ? '<p class="dato-linea" style="color:var(--gris-texto);margin-top:14px">La práctica ya tiene resultado: la bitácora está en modo consulta.</p>' : "");
    return "<p class='dato-linea'><strong>Fecha:</strong> " + formatearFecha(b.fecha) + " · <strong>Horas:</strong> " + formatearHoras(b.horas) + " · <strong>Estado:</strong> " + badge(b.estado) + "</p>" +
        "<p class='dato-linea'><strong>Descripción:</strong><br>" + escaparHtml(b.descripcion) + "</p>" + correccion +
        "<p class='dato-linea'><strong>Evidencias:</strong></p>" + evid + acciones;
}
function vistaNota(b, nota, cerrada) {
    if (b.estado !== "Aprobada" || cerrada) return '<p class="dato-linea">La nota solo se puede registrar cuando la bitácora está aprobada.</p>';
    let v = nota ? nota.valor : "";
    let obs = nota ? nota.observaciones : "";
    return '<div class="form-group"><label>Nota (0.0 a 5.0)</label><input type="number" id="nota-valor" min="0" max="5" step="0.1" value="' + v + '"><div class="campo-error" id="err-nota" style="display:none"></div></div>' +
        '<div class="form-group"><label>Observaciones (opcional)</label><textarea id="nota-obs" maxlength="600">' + escaparHtml(obs) + '</textarea><div class="contador" id="cont-obs"></div><div class="campo-error" id="err-obs" style="display:none"></div></div>' +
        '<div style="text-align:right"><button class="button-primary" onclick="guardarNota(' + b.id + ')">Guardar</button></div>';
}
function vistaRetro(b, retros, cerrada) {
    let historial = retros.length
        ? retros.map(function (r) { return '<div class="retro-item"><small>' + formatearFecha(r.fecha) + " · " + escaparHtml(r.bitacora) + "</small>" + escaparHtml(r.texto) + "</div>"; }).join("")
        : '<div class="vacio">Aún no has registrado retroalimentaciones para este estudiante.</div>';
    let form = cerrada ? '<p class="dato-linea" style="color:var(--gris-texto)">La práctica ya tiene resultado: no se registran nuevas retroalimentaciones.</p>'
        : '<div class="form-group"><label>Retroalimentación</label><textarea id="retro-texto"></textarea><div class="contador" id="cont-retro">0 / 200 palabras</div><div class="campo-error" id="err-retro" style="display:none"></div></div><div style="text-align:right"><button class="button-primary" onclick="guardarRetro(' + b.id + ')">Guardar</button></div>';
    return form + '<h3 style="margin:18px 0 10px">Retroalimentaciones registradas para este estudiante</h3>' + historial;
}

// Contadores en vivo (delegado)
document.addEventListener("input", function (e) {
    if (e.target.id === "nota-obs") {
        let c = document.getElementById("cont-obs"); c.textContent = e.target.value.length + " / 500";
        c.classList.toggle("excedido", e.target.value.length > 500);
    }
    if (e.target.id === "retro-texto") {
        let p = contarPalabras(e.target.value); let c = document.getElementById("cont-retro");
        c.textContent = p + " / 200 palabras"; c.classList.toggle("excedido", p > 200);
    }
});

// Evidencias
function abrirEvidencia(i) {
    let e = window._bitRevision.evidencias[i];
    let icono = ["JPG", "PNG"].indexOf(e.tipo) !== -1 ? "🖼️" : "📄";
    abrirModal("Evidencia", '<div class="visor-previa">' + icono + "</div>" + linea("Nombre", e.nombre) + linea("Tipo", e.tipo) + linea("Tamaño", formatearTamano(e.tamanoKB)),
        { pie: '<button class="button-secondary" data-cerrar>Cerrar</button><button class="button-primary" onclick="descargarEvidencia(\'' + escaparHtml(e.nombre).replace(/'/g, "\\'") + "')\">Descargar</button>" });
}
function descargarEvidencia(nombre) { mostrarToast("Descargando " + nombre, "info"); }
function linea(k, v) { return '<p class="dato-linea"><strong>' + k + ":</strong> " + escaparHtml(v) + "</p>"; }

// Acciones
async function aprobar(id) {
    try { await Datos.aprobarBitacora(id); cerrarModal(); await refrescar();
        mostrarToast("Bitácora aprobada. Las horas se sumaron al avance del estudiante.", "ok"); }
    catch (e) { mostrarToast("No se pudo aprobar la bitácora.", "error"); }
}
function mostrarCajaCorreccion() { document.getElementById("caja-correccion").style.display = "block"; }
function ocultarCajaCorreccion() { document.getElementById("caja-correccion").style.display = "none"; }
async function enviarCorreccion(id) {
    let motivo = document.getElementById("motivo-correccion").value.trim();
    let err = document.getElementById("err-motivo");
    if (!motivo) { err.style.display = "block"; err.textContent = "Escribe el motivo de la corrección."; return; }
    try { await Datos.solicitarCorreccion(id, motivo); cerrarModal(); await refrescar();
        mostrarToast("Solicitud de corrección registrada. El estudiante podrá corregir la bitácora.", "ok"); }
    catch (e) { mostrarToast("No se pudo registrar la solicitud.", "error"); }
}
async function guardarNota(id) {
    let valor = document.getElementById("nota-valor").value;
    let obs = document.getElementById("nota-obs").value;
    let errN = document.getElementById("err-nota"), errO = document.getElementById("err-obs");
    errN.style.display = "none"; errO.style.display = "none";
    if (valor === "" || isNaN(Number(valor)) || Number(valor) < 0 || Number(valor) > 5) { errN.style.display = "block"; errN.textContent = "Ingresa una nota entre 0.0 y 5.0."; return; }
    if (obs.length > 500) { errO.style.display = "block"; errO.textContent = "Las observaciones no pueden superar los 500 caracteres."; return; }
    try { await Datos.registrarNota(id, valor, obs, MI_ID); cerrarModal(); await refrescar(); mostrarToast("Nota registrada correctamente.", "ok"); }
    catch (e) { mostrarToast("No se pudo registrar la nota.", "error"); }
}
async function guardarRetro(id) {
    let texto = document.getElementById("retro-texto").value.trim();
    let err = document.getElementById("err-retro");
    err.style.display = "none";
    if (!texto) { err.style.display = "block"; err.textContent = "Escribe la retroalimentación antes de guardar."; return; }
    if (contarPalabras(texto) > 200) { err.style.display = "block"; err.textContent = "La retroalimentación no puede superar las 200 palabras."; return; }
    try { await Datos.registrarRetroalimentacion(id, texto, MI_ID); cerrarModal(); await refrescar(); mostrarToast("Retroalimentación registrada correctamente.", "ok"); }
    catch (e) { mostrarToast("No se pudo registrar la retroalimentación.", "error"); }
}

async function refrescar() { await pintarInicio(); await pintarRevisar(); await pintarEstudiantes(); }


/* =========================================================
   ARRANQUE
========================================================= */
(async function () {
    await cargarFiltros();
    await pintarInicio();
    await pintarEstudiantes();
    await pintarRevisar();
})();
