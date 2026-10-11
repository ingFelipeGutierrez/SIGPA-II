/* =========================================================================
   SIGPA · director/director.js
   Lógica del panel del Director de Programa.

   CU 1 Gestionar prácticas (asignar docente/grupo, decidir resultado)
   CU 2 Registrar plaza de práctica
   CU 3 Gestionar convenios institucionales
   CU 4 Generar reportes e indicadores
   CU 5 Exportar reporte PDF o Excel
   CU 6 Supervisar cumplimiento de horas
   CU 7 Consultar estado general de las prácticas

   Requiere comun.js y datos.js.
   ========================================================================= */

const S = sesion();
pintarUsuario();

function linea(k, v) { return '<p class="dato-linea"><strong>' + k + ":</strong> " + escaparHtml(v) + "</p>"; }
function tarjetaKpi(t, n, sub) { return '<div class="card stat-card"><div class="stat-title">' + t + '</div><div class="stat-number">' + n + "</div>" + (sub ? '<div style="font-size:12px;color:var(--gris-texto)">' + sub + "</div>" : "") + "</div>"; }


/* =========================================================
   INICIO
========================================================= */
async function pintarInicio() {
    document.getElementById("saludo").textContent = "Hola, " + primerNombre(S.nombre);
    let pr = await Datos.obtenerPracticas({});
    let insts = await Datos.obtenerInstituciones();
    let plazas = await Datos.obtenerPlazas({});
    let ests = await Datos.obtenerEstudiantes();

    let enCurso = pr.filter(function (p) { return p.estado === "En curso"; }).length;
    let vigentes = insts.filter(function (i) { return i.estadoConvenio === "Vigente"; }).length;
    let prox = insts.filter(function (i) { return i.estadoConvenio === "Próximo a vencer"; }).length;
    let libres = plazas.filter(function (p) { return p.estado === "Aprobada"; }).reduce(function (s, p) { return s + (p.cupos - p.ocupados); }, 0);
    let activos = pr.filter(function (p) { return ["En curso", "Finalizada"].indexOf(p.estado) !== -1; });
    let promedio = activos.length ? Math.round(activos.reduce(function (s, p) { return s + p.porcentaje; }, 0) / activos.length) : 0;

    document.getElementById("kpis").innerHTML =
        tarjetaKpi("Prácticas en curso", enCurso) +
        tarjetaKpi("Convenios vigentes", vigentes, prox + " próximos a vencer") +
        tarjetaKpi("Plazas disponibles", libres) +
        tarjetaKpi("Cumplimiento promedio", promedio + "%");

    // Alertas
    let conPractica = pr.map(function (p) { return p.estudianteId; });
    let sinDocente = pr.filter(function (p) { return !p.docenteId; }).length;
    let sinGrupo = ests.filter(function (e) { let p = pr.find(function (x) { return x.estudianteId === e.id; }); return !p || !p.grupoId; }).length;
    let plazasPend = plazas.filter(function (p) { return p.estado === "Pendiente"; }).length;
    let finDecidir = pr.filter(function (p) { return p.estado === "Finalizada"; }).length;
    let convAlerta = insts.filter(function (i) { return i.estadoConvenio !== "Vigente"; }).length;
    let bajo = activos.filter(function (p) { return p.porcentaje < 50; }).length;

    let A = [
        ["Estudiantes sin docente asesor", sinDocente, function () { irAccion("docente"); }],
        ["Estudiantes sin grupo", sinGrupo, function () { irAccion("grupo"); }],
        ["Plazas pendientes de decisión", plazasPend, function () { irAccion("plazas"); }],
        ["Prácticas finalizadas por decidir", finDecidir, function () { irAccion("resultado"); }],
        ["Convenios por vencer o vencidos", convAlerta, function () { mostrarPagina("instituciones"); }],
        ["Estudiantes con bajo cumplimiento", bajo, function () { mostrarPagina("supervision"); }]
    ];
    window._alertas = A;
    document.getElementById("alertas").innerHTML = A.map(function (a, i) {
        let cero = a[1] === 0;
        return '<div class="activity" style="display:flex;justify-content:space-between;align-items:center' + (cero ? ";color:var(--gris-texto)" : "") + '">' +
            "<span>" + a[0] + "</span>" + (cero ? "<strong>0</strong>" : '<button class="enlace-accion" onclick="ejecutarAlerta(' + i + ')">' + a[1] + "</button>") + "</div>";
    }).join("");

    // Últimas asignaciones
    let asig = pr.filter(function (p) { return p.fechaAsignacion; }).sort(function (a, b) { return a.fechaAsignacion < b.fechaAsignacion ? 1 : -1; }).slice(0, 5);
    document.getElementById("asignaciones").innerHTML = asig.length
        ? asig.map(function (p) {
            let txt = p.grupo ? "asignado a " + p.grupo : p.docente ? "asignado a docente " + p.docente : "registrado";
            return '<div class="activity">' + escaparHtml(p.estudiante) + " " + escaparHtml(txt) + "<small>" + formatearFecha(p.fechaAsignacion) + "</small></div>";
        }).join("")
        : '<div class="vacio">Sin asignaciones recientes.</div>';
}
function ejecutarAlerta(i) { window._alertas[i][2](); }
function irAccion(cual) {
    mostrarPagina("gestionar", document.querySelector('.menu button[data-pagina="gestionar"]'));
    if (cual === "docente") accionDocente();
    else if (cual === "grupo") accionGrupo();
    else if (cual === "plazas") accionPlazas();
    else if (cual === "resultado") accionResultado();
}


/* =========================================================
   CU 1 · GESTIONAR PRÁCTICAS (página con 4 acciones)
========================================================= */
async function pintarGestionar() {
    document.getElementById("gestionar-inicio").style.display = "block";
    document.getElementById("sub-pagina").style.display = "none";
    let pr = await Datos.obtenerPracticas({});
    let ests = await Datos.obtenerEstudiantes();
    let plazas = await Datos.obtenerPlazas({});
    let sinDocente = pr.filter(function (p) { return !p.docenteId; }).length;
    let sinGrupo = ests.filter(function (e) { let p = pr.find(function (x) { return x.estudianteId === e.id; }); return !p || !p.grupoId; }).length;
    let plazasPend = plazas.filter(function (p) { return p.estado === "Pendiente"; }).length;
    let finDecidir = pr.filter(function (p) { return p.estado === "Finalizada"; }).length;

    document.getElementById("acciones-gestionar").innerHTML =
        accion("Asignar docente asesor", sinDocente + " pendientes", "accionDocente()") +
        accion("Asignar estudiantes a grupo de práctica", sinGrupo + " sin grupo", "accionGrupo()") +
        accion("Plazas de práctica", plazasPend + " pendientes", "accionPlazas()") +
        accion("Decidir resultado de la práctica", finDecidir + " por decidir", "accionResultado()");
}
function accion(titulo, sub, fn) {
    return '<div class="card stat-card tarjeta-accion" onclick="' + fn + '"><div class="stat-title">' + titulo + '</div><div class="conteo" style="font-size:14px;margin-top:8px;color:var(--acento)">' + sub + "</div></div>";
}
function abrirSub(html) {
    document.getElementById("gestionar-inicio").style.display = "none";
    let sp = document.getElementById("sub-pagina");
    sp.style.display = "block";
    sp.innerHTML = '<button class="enlace-accion" style="margin-bottom:16px" onclick="pintarGestionar()">← Gestionar prácticas</button>' + html;
    window.scrollTo(0, 0);
}

/* --- Asignar docente --- */
async function accionDocente() {
    let pr = await Datos.obtenerPracticas({});
    let ests = await Datos.obtenerEstudiantes();
    let docs = await Datos.obtenerDocentes();
    let sinDoc = ests.filter(function (e) { let p = pr.find(function (x) { return x.estudianteId === e.id; }); return !p || !p.docenteId; });

    if (!sinDoc.length) { abrirSub('<div class="page-title"><h1>Asignar docente asesor</h1></div><div class="card vacio">Todos los estudiantes ya tienen docente asesor.</div>'); return; }

    let listaEst = sinDoc.map(function (e) {
        let p = pr.find(function (x) { return x.estudianteId === e.id; });
        return '<li><input type="checkbox" value="' + e.id + '"> <span>' + escaparHtml(e.nombre) + '<small> · ' + (p && p.institucion ? escaparHtml(p.institucion) : "Sin grupo") + "</small></span></li>";
    }).join("");
    let listaDoc = [];
    for (let d of docs) {
        let carga = await Datos.cargaDocente(d.id);
        let lleno = carga >= 6;
        listaDoc.push('<li class="' + (lleno ? "deshabilitada" : "") + '"><input type="radio" name="doc" value="' + d.id + '" ' + (lleno ? "disabled" : "") + '> <span>' + escaparHtml(d.nombre) + "<small> · " + carga + " / 6" + (lleno ? " · Sin disponibilidad" : "") + "</small></span></li>");
    }
    abrirSub('<div class="page-title"><h1>Asignar docente asesor</h1></div>' +
        '<div class="grid-2"><div class="card"><div class="section-title">Estudiantes sin docente asesor</div><ul class="lista-seleccion" id="lista-est-doc">' + listaEst + "</ul></div>" +
        '<div class="card"><div class="section-title">Docentes asesores</div><ul class="lista-seleccion">' + listaDoc.join("") + "</ul></div></div>" +
        '<div style="text-align:right;margin-top:16px"><button class="button-primary" onclick="confirmarDocente()">Asignar</button></div>');
}
async function confirmarDocente() {
    let est = Array.from(document.querySelectorAll("#lista-est-doc input:checked")).map(function (c) { return Number(c.value); });
    let doc = document.querySelector('input[name="doc"]:checked');
    if (!est.length || !doc) { mostrarToast("Selecciona al menos un estudiante y un docente.", "error"); return; }
    try { await Datos.asignarDocente(est, Number(doc.value)); mostrarToast("Docente asesor asignado correctamente.", "ok"); await pintarTodo(); accionDocente(); }
    catch (e) { mostrarToast(e.message || "No se pudo asignar.", "error"); }
}

/* --- Asignar a grupo --- */
async function accionGrupo() {
    let pr = await Datos.obtenerPracticas({});
    let ests = await Datos.obtenerEstudiantes();
    let grupos = await Datos.obtenerGrupos(true);
    let sinGrupo = ests.filter(function (e) { let p = pr.find(function (x) { return x.estudianteId === e.id; }); return !p || !p.grupoId; });

    if (!sinGrupo.length) { abrirSub('<div class="page-title"><h1>Asignar estudiantes a grupo</h1></div><div class="card vacio">No hay estudiantes pendientes de agrupación.</div>'); return; }

    let listaEst = sinGrupo.map(function (e) {
        let p = pr.find(function (x) { return x.estudianteId === e.id; });
        return '<li><input type="checkbox" value="' + e.id + '"> <span>' + escaparHtml(e.nombre) + '<small> · ' + (p && p.docente ? escaparHtml(p.docente) : "Sin docente") + "</small></span></li>";
    }).join("");
    let opciones = grupos.map(function (g) { return '<option value="' + g.id + '">' + escaparHtml(g.nombre) + " · " + escaparHtml(g.institucion) + " · " + g.cuposLibres + " cupos</option>"; }).join("");
    abrirSub('<div class="page-title"><h1>Asignar estudiantes a grupo de práctica</h1></div>' +
        '<div class="card"><div class="section-title">Estudiantes sin grupo</div><ul class="lista-seleccion" id="lista-est-grupo">' + listaEst + "</ul></div>" +
        '<div class="card" style="margin-top:16px"><div class="form-group"><label>Grupo de práctica</label><select id="sel-grupo" onchange="cambioGrupo()"><option value="">Selecciona…</option>' + opciones + '<option value="nuevo">+ Crear nuevo grupo</option></select></div><div id="detalle-grupo"></div></div>' +
        '<div style="text-align:right;margin-top:16px"><button class="button-primary" onclick="confirmarGrupo()">Asignar</button></div>');
}
async function cambioGrupo() {
    let v = document.getElementById("sel-grupo").value;
    let cont = document.getElementById("detalle-grupo");
    if (v === "nuevo") { cont.innerHTML = await formNuevoGrupo(); return; }
    if (!v) { cont.innerHTML = ""; return; }
    let g = (await Datos.obtenerGrupos()).find(function (x) { return x.id === Number(v); });
    cont.innerHTML = '<div class="aviso aviso-info">📋 ' + escaparHtml(g.nombre) + " · " + escaparHtml(g.institucion) + " · " + escaparHtml(g.tipo) + " Nivel " + g.nivel + " · " + formatearFecha(g.fechaInicio) + " a " + formatearFecha(g.fechaFin) + " · " + g.horasRequeridas + " h · " + g.cuposLibres + " cupos libres</div>";
}
async function formNuevoGrupo() {
    let plazas = (await Datos.obtenerPlazas({ estado: "Aprobada" })).filter(function (p) { return p.cupos - p.ocupados > 0; });
    let op = plazas.map(function (p) { return '<option value="' + p.id + '">' + escaparHtml(p.institucion) + " · " + (p.cupos - p.ocupados) + " cupos libres</option>"; }).join("");
    return '<div class="form-grid" id="form-grupo">' +
        '<div class="form-group full"><label>Nombre del grupo</label><input type="text" id="g-nombre"></div>' +
        '<div class="form-group"><label>Plaza</label><select id="g-plaza"><option value="">Selecciona…</option>' + op + "</select></div>" +
        '<div class="form-group"><label>Tipo de práctica</label><select id="g-tipo"><option value="">Selecciona…</option><option>Observación</option><option>Práctica intermedia</option><option>Práctica profesional</option></select></div>' +
        '<div class="form-group"><label>Nivel</label><select id="g-nivel"><option value="">Selecciona…</option><option>1</option><option>2</option><option>3</option></select></div>' +
        '<div class="form-group"><label>Horas requeridas</label><input type="number" id="g-horas" value="160" min="1"></div>' +
        '<div class="form-group"><label>Fecha de inicio</label><input type="date" id="g-inicio"></div>' +
        '<div class="form-group"><label>Fecha de fin</label><input type="date" id="g-fin"></div></div>';
}
async function confirmarGrupo() {
    let est = Array.from(document.querySelectorAll("#lista-est-grupo input:checked")).map(function (c) { return Number(c.value); });
    if (!est.length) { mostrarToast("Selecciona al menos un estudiante.", "error"); return; }
    let v = document.getElementById("sel-grupo").value;
    if (!v) { mostrarToast("Selecciona un grupo.", "error"); return; }
    try {
        let grupoId = v;
        if (v === "nuevo") {
            let g = await Datos.crearGrupo({ nombre: val("g-nombre"), plazaId: val("g-plaza"), tipo: val("g-tipo"),
                nivel: val("g-nivel"), horasRequeridas: val("g-horas"), fechaInicio: val("g-inicio"), fechaFin: val("g-fin") });
            grupoId = g.id;
        }
        await Datos.asignarEstudiantesAGrupo(grupoId, est);
        mostrarToast("Estudiantes asignados al grupo correctamente.", "ok");
        await pintarTodo(); accionGrupo();
    } catch (e) { mostrarToast(traducir(e), "error"); }
}
function val(id) { return document.getElementById(id).value; }

/* --- Plazas --- */
async function accionPlazas(filtroEstado) {
    let plazas = await Datos.obtenerPlazas(filtroEstado ? { estado: filtroEstado } : {});
    let filas = plazas.map(function (p) {
        let acc = p.estado === "Pendiente" ? '<button class="button-primary" onclick="revisarPlaza(' + p.id + ')">Revisar</button>' : '<button class="button-secondary" onclick="revisarPlaza(' + p.id + ')">Ver</button>';
        return "<tr><td data-label='Institución'>" + escaparHtml(p.institucion) + "</td><td data-label='Jornada'>" + escaparHtml(p.jornada) +
            "</td><td data-label='Cupos'>" + p.ocupados + " / " + p.cupos + "</td><td data-label='Convenio'>" + badge(p.convenioEstado) +
            "</td><td data-label='Estado'>" + badge(p.estado) + "</td><td data-label='Acciones'>" + acc + "</td></tr>";
    }).join("");
    abrirSub('<div class="page-title"><h1>Plazas de práctica</h1></div>' +
        '<div class="table-container"><div style="text-align:right;margin-bottom:15px"><button class="button-primary" onclick="abrirFormPlaza()">+ Registrar plaza</button></div>' +
        '<div id="form-plaza"></div>' +
        '<div class="tabla-scroll"><table class="apilable"><thead><tr><th>Institución</th><th>Jornada</th><th>Cupos</th><th>Convenio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + filas + "</tbody></table></div></div>");
}
async function abrirFormPlaza() {
    let insts = await Datos.obtenerInstituciones();
    if (!insts.length) { mostrarToast("Primero registra una institución receptora con su convenio.", "error"); return; }
    let op = insts.map(function (i) { return '<option value="' + i.id + '">' + escaparHtml(i.nombre) + "</option>"; }).join("");
    document.getElementById("form-plaza").innerHTML =
        '<div class="card" style="margin-bottom:16px"><div class="form-grid">' +
        '<div class="form-group"><label>Institución receptora</label><select id="p-inst" onchange="cargarConvenio()"><option value="">Selecciona…</option>' + op + "</select></div>" +
        '<div class="form-group"><label>Convenio asociado</label><input type="text" id="p-convenio" readonly placeholder="Selecciona una institución"></div>' +
        '<div class="form-group"><label>Cupos</label><input type="number" id="p-cupos" min="1"></div>' +
        '<div class="form-group"><label>Jornada</label><select id="p-jornada"><option value="">Selecciona…</option><option>Mañana</option><option>Tarde</option><option>Única</option></select></div>' +
        '<div class="form-group full"><label>Descripción de las funciones (opcional)</label><textarea id="p-desc"></textarea></div></div>' +
        '<div style="text-align:right"><button class="button-secondary" onclick="document.getElementById(\'form-plaza\').innerHTML=\'\'">Cancelar</button> <button class="button-primary" onclick="guardarPlaza()">Guardar plaza</button></div></div>';
}
async function cargarConvenio() {
    let id = Number(document.getElementById("p-inst").value);
    let inst = (await Datos.obtenerInstituciones()).find(function (i) { return i.id === id; });
    document.getElementById("p-convenio").value = inst ? formatearFecha(inst.convenioInicio) + " a " + formatearFecha(inst.convenioFin) + " (" + inst.estadoConvenio + ")" : "";
}
async function guardarPlaza() {
    try {
        let p = await Datos.registrarPlaza({ institucionId: val("p-inst"), cupos: val("p-cupos"), jornada: val("p-jornada"), descripcion: val("p-desc") });
        await pintarInicio();
        revisarPlaza(p.id);
    } catch (e) { mostrarToast(traducir(e), "error"); }
}
async function revisarPlaza(id) {
    let p = (await Datos.obtenerPlazas({})).find(function (x) { return x.id === id; });
    let inst = p.institucionObj;
    let venc = p.convenioEstado === "Vencido";
    let avisoConv = venc ? '<div class="aviso aviso-rojo">⛔ El convenio de la institución está vencido. No puedes aprobar la plaza hasta renovarlo. <button class="enlace-accion" onclick="cerrarModal();mostrarPagina(\'instituciones\')">Renovar convenio</button></div>'
        : p.convenioEstado === "Próximo a vencer" ? '<div class="aviso aviso-ambar">⚠️ El convenio vence el ' + formatearFecha(inst.convenioFin) + ".</div>" : "";
    let cuerpo = avisoConv +
        linea("Institución", p.institucion) + linea("Jornada", p.jornada) + linea("Cupos", p.cupos) +
        linea("Convenio", formatearFecha(inst.convenioInicio) + " a " + formatearFecha(inst.convenioFin)) +
        linea("Dirección", inst.direccion) + linea("Contacto", inst.contacto) + linea("Tipo", inst.tipo) +
        (p.descripcion ? '<p class="dato-linea"><strong>Funciones:</strong><br>' + escaparHtml(p.descripcion) + "</p>" : "") +
        (p.estado === "Rechazada" ? '<div class="bloque-rechazo"><strong>Motivo:</strong> ' + escaparHtml(p.motivoRechazo) + "</div>" : "") +
        '<div id="caja-rechazo-plaza" style="display:none;margin-top:14px"><div class="form-group"><label>Motivo del rechazo</label><textarea id="motivo-plaza"></textarea><div class="campo-error" id="err-plaza" style="display:none"></div></div></div>';
    let pie = p.estado === "Pendiente"
        ? '<button class="button-secondary" onclick="cerrarModal()">Decidir después</button><button class="button-danger" onclick="rechazarPlaza(' + id + ')">Rechazar plaza</button><button class="button-primary" onclick="aprobarPlaza(' + id + ')" ' + (venc ? "disabled" : "") + ">Aprobar plaza</button>"
        : '<button class="button-secondary" data-cerrar>Cerrar</button>';
    abrirModal("Revisión de plaza", cuerpo, { pie: pie });
}
async function aprobarPlaza(id) {
    try { await Datos.decidirPlaza(id, "Aprobada"); cerrarModal(); await pintarTodo(); accionPlazas();
        mostrarToast("Plaza aprobada. Ya está disponible para asignar estudiantes.", "ok"); }
    catch (e) { mostrarToast(traducir(e), "error"); }
}
function rechazarPlaza(id) {
    let caja = document.getElementById("caja-rechazo-plaza");
    if (caja.style.display === "none") { caja.style.display = "block"; return; }
    let motivo = document.getElementById("motivo-plaza").value.trim();
    let err = document.getElementById("err-plaza");
    if (!motivo) { err.style.display = "block"; err.textContent = "Escribe el motivo del rechazo."; return; }
    Datos.decidirPlaza(id, "Rechazada", motivo).then(function () { cerrarModal(); pintarTodo(); accionPlazas(); mostrarToast("Plaza rechazada. Se registró el motivo.", "ok"); });
}

/* --- Decidir resultado --- */
async function accionResultado() {
    let pr = (await Datos.obtenerPracticas({ estado: "Finalizada" }));
    let filas = pr.map(function (p) {
        return "<tr><td data-label='Estudiante'>" + escaparHtml(p.estudiante) + "</td><td data-label='Institución'>" + escaparHtml(p.institucion || "—") +
            "</td><td data-label='Docente'>" + escaparHtml(p.docente || "—") + "</td><td data-label='Horas'>" + formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas +
            "</td><td data-label='Nota promedio'>" + (p.notaPromedio !== null ? p.notaPromedio.toFixed(1) : "—") + "</td><td data-label='Acciones'><button class='button-primary' onclick='revisarResultado(" + p.id + ")'>Revisar</button></td></tr>";
    }).join("");
    abrirSub('<div class="page-title"><h1>Decidir resultado de la práctica</h1></div>' +
        (pr.length ? '<div class="table-container"><div class="tabla-scroll"><table class="apilable"><thead><tr><th>Estudiante</th><th>Institución</th><th>Docente</th><th>Horas</th><th>Nota promedio</th><th>Acciones</th></tr></thead><tbody>' + filas + "</tbody></table></div></div>"
            : '<div class="card vacio">No hay prácticas finalizadas por decidir.</div>'));
}
async function revisarResultado(id) {
    let p = (await Datos.obtenerPracticas({})).find(function (x) { return x.id === id; });
    let bits = await Datos.obtenerBitacoras({ estudianteId: p.estudianteId });
    let pend = bits.filter(function (b) { return b.estado === "Pendiente"; }).length;
    let avisos = "";
    if (p.horasCumplidas < p.horasRequeridas) avisos += '<div class="aviso aviso-ambar">⚠️ El estudiante no alcanzó las horas requeridas (' + formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas + ").</div>";
    if (pend) avisos += '<div class="aviso aviso-ambar">⚠️ Tiene ' + pend + " bitácora(s) pendientes de revisión.</div>";
    let cuerpo = avisos +
        linea("Estudiante", p.estudiante) + linea("Institución", p.institucion || "—") + linea("Docente asesor", p.docente || "—") +
        linea("Tipo y nivel", (p.tipo || "—") + " · Nivel " + (p.nivel || "—")) + linea("Fechas", formatearFecha(p.fechaInicio) + " a " + formatearFecha(p.fechaFin)) +
        linea("Horas", formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas + " (" + p.porcentaje + "%)") +
        linea("Bitácoras", bits.filter(function (b) { return b.estado === "Aprobada"; }).length + " aprobadas · " + pend + " pendientes") +
        linea("Nota promedio", p.notaPromedio !== null ? p.notaPromedio.toFixed(1) : "—") +
        '<div id="caja-rechazo-res" style="display:none;margin-top:14px"><div class="form-group"><label>Motivo del rechazo</label><textarea id="motivo-res"></textarea><div class="campo-error" id="err-res" style="display:none"></div></div></div>';
    abrirModal("Resultado de la práctica", cuerpo,
        { pie: '<button class="button-danger" onclick="rechazarResultado(' + id + ')">Rechazar práctica</button><button class="button-primary" onclick="aprobarResultado(' + id + ')">Aprobar práctica</button>' });
}
async function aprobarResultado(id) {
    try { await Datos.decidirResultado(id, "Aprobada"); cerrarModal(); await pintarTodo(); accionResultado();
        mostrarToast("Práctica aprobada. El estudiante ya puede consultar el resultado.", "ok"); }
    catch (e) { mostrarToast(traducir(e), "error"); }
}
function rechazarResultado(id) {
    let caja = document.getElementById("caja-rechazo-res");
    if (caja.style.display === "none") { caja.style.display = "block"; return; }
    let motivo = document.getElementById("motivo-res").value.trim();
    let err = document.getElementById("err-res");
    if (!motivo) { err.style.display = "block"; err.textContent = "Escribe el motivo del rechazo."; return; }
    Datos.decidirResultado(id, "Rechazada", motivo).then(function () { cerrarModal(); pintarTodo(); accionResultado(); mostrarToast("Práctica rechazada. El estudiante podrá consultar el motivo.", "ok"); });
}


/* =========================================================
   CU 3 · INSTITUCIONES Y CONVENIOS
========================================================= */
async function pintarInstituciones() {
    let insts = await Datos.obtenerInstituciones();
    document.getElementById("tabla-instituciones").innerHTML = insts.map(function (i) {
        return "<tr><td data-label='Institución'>" + escaparHtml(i.nombre) + "</td><td data-label='Tipo'>" + escaparHtml(i.tipo) +
            "</td><td data-label='Convenio'>" + formatearFecha(i.convenioInicio) + " a " + formatearFecha(i.convenioFin) +
            "</td><td data-label='Plazas'>" + i.plazasOcupadas + " / " + i.plazasTotales + "</td><td data-label='Estado'>" + badge(i.estadoConvenio) +
            "</td><td data-label='Acciones'><button class='button-secondary' onclick='verConvenio(" + i.id + ")'>Ver convenio</button></td></tr>";
    }).join("");
}
function abrirFormInstitucion() {
    document.getElementById("form-institucion").innerHTML =
        '<div class="card" style="margin-bottom:16px"><div class="form-grid">' +
        '<div class="form-group"><label>Nombre de la institución</label><input type="text" id="i-nombre"></div>' +
        '<div class="form-group"><label>Tipo de institución</label><select id="i-tipo"><option value="">Selecciona…</option><option>Oficial</option><option>Privada</option></select></div>' +
        '<div class="form-group"><label>Dirección</label><input type="text" id="i-direccion"></div>' +
        '<div class="form-group"><label>Contacto</label><input type="text" id="i-contacto"></div>' +
        '<div class="form-group"><label>Convenio vigente desde</label><input type="date" id="i-inicio"></div>' +
        '<div class="form-group"><label>Convenio vigente hasta</label><input type="date" id="i-fin"></div></div>' +
        '<div id="err-inst" class="campo-error" style="display:none"></div>' +
        '<div style="text-align:right"><button class="button-secondary" onclick="document.getElementById(\'form-institucion\').innerHTML=\'\'">Cancelar</button> <button class="button-primary" onclick="guardarInstitucion()">Guardar institución</button></div></div>';
}
async function guardarInstitucion() {
    try {
        await Datos.registrarInstitucion({ nombre: val("i-nombre"), tipo: val("i-tipo"), direccion: val("i-direccion"),
            contacto: val("i-contacto"), convenioInicio: val("i-inicio"), convenioFin: val("i-fin") });
        document.getElementById("form-institucion").innerHTML = "";
        await pintarTodo();
        mostrarToast("Institución registrada correctamente.", "ok");
    } catch (e) { let err = document.getElementById("err-inst"); err.style.display = "block"; err.textContent = traducir(e); }
}
async function verConvenio(id) {
    let i = (await Datos.obtenerInstituciones()).find(function (x) { return x.id === id; });
    let alerta = i.estadoConvenio === "Vencido" ? '<div class="aviso aviso-rojo">⛔ El convenio venció el ' + formatearFecha(i.convenioFin) + " y no puede respaldar nuevas plazas hasta su renovación.</div>"
        : i.estadoConvenio === "Próximo a vencer" ? '<div class="aviso aviso-ambar">⚠️ El convenio vence en " + ' + i.diasRestantes + ' + " días. Se recomienda iniciar el proceso de renovación.</div>' : "";
    // (corrige comilla) reconstruimos limpio:
    alerta = i.estadoConvenio === "Vencido" ? '<div class="aviso aviso-rojo">⛔ El convenio venció el ' + formatearFecha(i.convenioFin) + " y no puede respaldar nuevas plazas hasta su renovación.</div>"
        : i.estadoConvenio === "Próximo a vencer" ? '<div class="aviso aviso-ambar">⚠️ El convenio vence en ' + i.diasRestantes + " días. Se recomienda iniciar el proceso de renovación.</div>" : "";
    let cuerpo = alerta + linea("Institución", i.nombre) + linea("Tipo", i.tipo) + linea("Dirección", i.direccion) + linea("Contacto", i.contacto) +
        linea("Inicio", formatearFecha(i.convenioInicio)) + linea("Finalización", formatearFecha(i.convenioFin)) +
        linea("Días restantes", i.diasRestantes) + '<p class="dato-linea"><strong>Estado:</strong> ' + badge(i.estadoConvenio) + "</p>" +
        '<div id="caja-renovar" style="display:none;margin-top:14px"><div class="form-group"><label>Nueva fecha de finalización</label><input type="date" id="renovar-fecha"><div class="campo-error" id="err-renovar" style="display:none"></div></div></div>';
    let pie = (i.estadoConvenio !== "Vigente")
        ? '<button class="button-secondary" data-cerrar>Cerrar</button><button class="button-primary" onclick="renovar(' + id + ')">Renovar convenio</button>'
        : '<button class="button-secondary" data-cerrar>Cerrar</button>';
    abrirModal("Convenio institucional", cuerpo, { pie: pie });
}
function renovar(id) {
    let caja = document.getElementById("caja-renovar");
    if (caja.style.display === "none") { caja.style.display = "block"; return; }
    let fecha = document.getElementById("renovar-fecha").value;
    let err = document.getElementById("err-renovar");
    Datos.renovarConvenio(id, fecha).then(function () { cerrarModal(); pintarTodo(); mostrarToast("Convenio renovado correctamente.", "ok"); })
        .catch(function () { err.style.display = "block"; err.textContent = "La nueva fecha debe ser posterior a la fecha de finalización actual."; });
}


/* =========================================================
   CU 7 · ESTADO DE LAS PRÁCTICAS
========================================================= */
let estadoSeleccionado = "Todas";
async function cargarFiltrosEstado() {
    let insts = await Datos.obtenerInstituciones();
    let docs = await Datos.obtenerDocentes();
    document.getElementById("e-institucion").innerHTML = '<option value="">Todas</option>' + insts.map(function (i) { return '<option value="' + i.id + '">' + escaparHtml(i.nombre) + "</option>"; }).join("");
    document.getElementById("e-docente").innerHTML = '<option value="">Todos</option>' + docs.map(function (d) { return '<option value="' + d.id + '">' + escaparHtml(d.nombre) + "</option>"; }).join("");
}
async function pintarEstado() {
    let fi = document.getElementById("e-institucion").value;
    let fd = document.getElementById("e-docente").value;
    let filtros = {};
    if (fi) filtros.institucionId = Number(fi);
    if (fd) filtros.docenteId = Number(fd);
    let pr = await Datos.obtenerPracticas(filtros);

    let estados = ["Todas", "Pendiente", "En curso", "Finalizada", "Aprobada", "Rechazada"];
    document.getElementById("estado-tarjetas").innerHTML = estados.map(function (e) {
        let n = e === "Todas" ? pr.length : pr.filter(function (p) { return p.estado === e; }).length;
        let sel = e === estadoSeleccionado;
        return '<div class="card stat-card tarjeta-accion" style="' + (sel ? "box-shadow:0 2px 14px rgba(23,63,120,0.15);border-top-width:4px" : "") + '" onclick="seleccionarEstado(\'' + e + "')\"><div class=\"stat-title\">" + e + '</div><div class="stat-number">' + n + "</div></div>";
    }).join("");

    let lista = estadoSeleccionado === "Todas" ? pr : pr.filter(function (p) { return p.estado === estadoSeleccionado; });
    document.getElementById("tabla-estado").innerHTML = lista.map(function (p) {
        let acc = "<button class='button-secondary' onclick='verDetallePractica(" + p.id + ")'>Ver detalle</button>";
        if (p.estado === "Finalizada") acc += " <button class='button-primary' onclick='revisarResultado(" + p.id + ")'>Decidir resultado</button>";
        return "<tr><td data-label='Estudiante'>" + escaparHtml(p.estudiante) + "</td><td data-label='Institución'>" + escaparHtml(p.institucion || "—") +
            "</td><td data-label='Docente'>" + escaparHtml(p.docente || "—") + "</td><td data-label='Grupo'>" + escaparHtml(p.grupo || "—") +
            "</td><td data-label='Fechas'>" + (p.fechaInicio ? formatearFecha(p.fechaInicio) + " a " + formatearFecha(p.fechaFin) : "—") +
            "</td><td data-label='Horas'>" + formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas + "</td><td data-label='Estado'>" + badge(p.estado) +
            "</td><td data-label='Acciones'>" + acc + "</td></tr>";
    }).join("");
    let vacio = document.getElementById("vacio-estado");
    if (lista.length) vacio.style.display = "none";
    else { vacio.style.display = "block"; vacio.textContent = pr.length ? "No hay prácticas que coincidan con los filtros seleccionados." : "No hay información disponible para consultar."; }
}
function seleccionarEstado(e) { estadoSeleccionado = e; pintarEstado(); }
function limpiarFiltrosEstado() { document.getElementById("e-institucion").value = ""; document.getElementById("e-docente").value = ""; estadoSeleccionado = "Todas"; pintarEstado(); }
async function verDetallePractica(id) {
    let p = (await Datos.obtenerPracticas({})).find(function (x) { return x.id === id; });
    let cuerpo = linea("Estudiante", p.estudiante) + linea("Programa", p.programa) + linea("Institución", p.institucion || "—") +
        linea("Jornada", p.jornada || "—") + linea("Docente asesor", p.docente || "—") + linea("Grupo", p.grupo || "—") +
        linea("Tipo y nivel", (p.tipo || "—") + " · Nivel " + (p.nivel || "—")) + linea("Fechas", p.fechaInicio ? formatearFecha(p.fechaInicio) + " a " + formatearFecha(p.fechaFin) : "—") +
        linea("Horas", formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas) + '<p class="dato-linea"><strong>Estado:</strong> ' + badge(p.estado) + "</p>" +
        (p.estado === "Rechazada" ? '<div class="bloque-rechazo"><strong>Motivo:</strong> ' + escaparHtml(p.motivoRechazo) + "</div>" : "");
    abrirModal("Detalle de la práctica", cuerpo);
}


/* =========================================================
   CU 6 · SUPERVISIÓN DE HORAS
========================================================= */
async function pintarSupervision() {
    let pr = (await Datos.obtenerPracticas({})).filter(function (p) { return ["En curso", "Finalizada"].indexOf(p.estado) !== -1; });
    let fn = document.getElementById("s-nivel").value;

    let sup = document.getElementById("sup-tarjetas");
    let prom = pr.length ? Math.round(pr.reduce(function (s, p) { return s + p.porcentaje; }, 0) / pr.length) : 0;
    let bajo = pr.filter(function (p) { return p.porcentaje < 50; }).length;
    sup.innerHTML = tarjetaKpi("Estudiantes en práctica", pr.length) + tarjetaKpi("Cumplimiento promedio", prom + "%") + tarjetaKpi("Con bajo cumplimiento", bajo);

    if (!pr.length) { document.getElementById("tabla-supervision").innerHTML = ""; let v = document.getElementById("vacio-supervision"); v.style.display = "block"; v.textContent = "No hay estudiantes en práctica para supervisar."; return; }

    let lista = pr.slice().sort(function (a, b) { return a.porcentaje - b.porcentaje; });
    if (fn) lista = lista.filter(function (p) { return Datos.nivelCumplimiento(p.porcentaje) === fn; });

    document.getElementById("tabla-supervision").innerHTML = lista.map(function (p) {
        let niv = Datos.nivelCumplimiento(p.porcentaje);
        let clase = niv === "Bajo" ? "nivel-bajo" : niv === "Medio" ? "nivel-medio" : "nivel-alto";
        return "<tr><td data-label='Estudiante'>" + escaparHtml(p.estudiante) + "</td><td data-label='Institución'>" + escaparHtml(p.institucion || "—") +
            "</td><td data-label='Docente'>" + escaparHtml(p.docente || "—") + "</td><td data-label='Horas'>" + formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas +
            "</td><td data-label='Cumplimiento'><div style='min-width:120px'><div class='progress'><div class='progress-bar " + clase + "' style='width:" + p.porcentaje + "%'></div></div><small>" + p.porcentaje + "%</small></div>" +
            "</td><td data-label='Nivel'>" + badge(niv) + "</td><td data-label='Acciones'><button class='button-secondary' onclick='verHorasEstudiante(" + p.estudianteId + ")'>Ver detalle</button></td></tr>";
    }).join("");
    let v = document.getElementById("vacio-supervision");
    if (lista.length) v.style.display = "none";
    else { v.style.display = "block"; v.textContent = "No hay estudiantes en este nivel de cumplimiento."; }
}
function limpiarFiltroSup() { document.getElementById("s-nivel").value = ""; pintarSupervision(); }
async function verHorasEstudiante(estudianteId) {
    let p = (await Datos.obtenerPracticas({})).find(function (x) { return x.estudianteId === estudianteId; });
    let bits = await Datos.obtenerBitacoras({ estudianteId: estudianteId });
    let aprob = bits.filter(function (b) { return b.estado === "Aprobada"; });
    let pendHoras = bits.filter(function (b) { return b.estado === "Pendiente"; }).reduce(function (s, b) { return s + b.horas; }, 0);
    let tabla = aprob.length ? '<table class="apilable"><thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th></tr></thead><tbody>' +
        aprob.map(function (b) { return "<tr><td data-label='Fecha'>" + formatearFecha(b.fecha) + "</td><td data-label='Actividad'>" + escaparHtml(b.titulo) + "</td><td data-label='Horas'>" + formatearHoras(b.horas) + "</td></tr>"; }).join("") + "</tbody></table>" : '<p class="dato-linea">Sin bitácoras aprobadas.</p>';
    abrirModal("Horas de " + p.estudiante,
        linea("Cumplidas", formatearHoras(p.horasCumplidas) + " / " + p.horasRequeridas + " (" + p.porcentaje + "%)") +
        linea("Pendientes de aprobación", formatearHoras(pendHoras) + " h") + "<br>" + tabla);
}


/* =========================================================
   CU 4 y 5 · REPORTES Y EXPORTACIÓN
========================================================= */
let reporteActual = null;
async function generarReporte() {
    let tipo = document.getElementById("r-tipo").value;
    let desde = document.getElementById("r-desde").value;
    let hasta = document.getElementById("r-hasta").value;
    let err = document.getElementById("err-reporte");
    err.style.display = "none";
    if (!desde || !hasta) { err.style.display = "block"; err.textContent = "Selecciona el periodo del reporte."; return; }
    if (hasta < desde) { err.style.display = "block"; err.textContent = "La fecha final no puede ser anterior a la inicial."; return; }

    try {
        let r = await Datos.generarReporte(tipo, desde, hasta);
        reporteActual = Object.assign({}, r, { desde: desde, hasta: hasta });
        let cont = document.getElementById("reporte-resultado");
        if (!r.filas.length) { cont.innerHTML = '<div class="card vacio">No hay datos disponibles para los criterios definidos.</div>'; return; }
        cont.innerHTML =
            '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">' +
            "<h3>" + escaparHtml(r.titulo) + " · " + formatearFecha(desde) + " a " + formatearFecha(hasta) + "</h3>" +
            '<button class="button-primary" onclick="abrirExportar()">Exportar</button></div>' +
            '<div class="cards">' + r.indicadores.map(function (ind) { return tarjetaKpi(ind[0], ind[1]); }).join("") + "</div>" +
            '<div class="tabla-scroll" style="margin-top:16px"><table class="apilable"><thead><tr>' + r.columnas.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>" +
            r.filas.map(function (fila) { return "<tr>" + fila.map(function (celda, i) { return "<td data-label='" + r.columnas[i] + "'>" + escaparHtml(celda) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></div>";
    } catch (e) { err.style.display = "block"; err.textContent = traducir(e); }
}

function abrirExportar() {
    abrirModal("Exportar reporte",
        '<div class="form-group"><label>Formato</label><select id="exp-formato"><option value="pdf">PDF</option><option value="excel">Excel</option><option value="ambos">Ambos</option></select></div>',
        { pie: '<button class="button-secondary" data-cerrar>Cancelar</button><button class="button-primary" onclick="exportar()">Exportar</button>' });
}
async function exportar() {
    let fmt = document.getElementById("exp-formato").value;
    cerrarModal();
    try {
        if (fmt === "pdf" || fmt === "ambos") await exportarPDF();
        if (fmt === "excel" || fmt === "ambos") exportarExcel();
        mostrarToast("Reporte exportado correctamente.", "ok");
    } catch (e) {
        if (e && e.name === "AbortError") mostrarToast("Exportación cancelada.", "info");
        else mostrarToast("No se pudo generar el archivo. Intenta nuevamente.", "error");
    }
}
function nombreArchivo(ext) {
    let t = reporteActual.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    return "Reporte_" + t + "_" + fechaHoy() + "." + ext;
}
async function guardarArchivo(blob, nombre) {
    if (window.showSaveFilePicker) {
        let handle = await window.showSaveFilePicker({ suggestedName: nombre });
        let w = await handle.createWritable(); await w.write(blob); await w.close();
    } else {
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = nombre;
        document.body.appendChild(a); a.click(); a.remove();
    }
}
async function exportarPDF() {
    let r = reporteActual;
    let jsPDF = window.jspdf.jsPDF;
    let doc = new jsPDF({ orientation: r.columnas.length > 6 ? "landscape" : "portrait" });
    doc.setFontSize(14); doc.text("SIGPA · " + r.titulo, 14, 16);
    doc.setFontSize(10); doc.text("Periodo: " + formatearFecha(r.desde) + " a " + formatearFecha(r.hasta), 14, 23);
    doc.text("Generado el " + formatearFecha(fechaHoy()) + " por " + S.nombre, 14, 29);
    doc.text(r.indicadores.map(function (i) { return i[0] + ": " + i[1]; }).join("   |   "), 14, 37);
    doc.autoTable({ head: [r.columnas], body: r.filas, startY: 43, headStyles: { fillColor: [201, 130, 15] }, styles: { fontSize: 9 },
        didDrawPage: function (d) { doc.setFontSize(8); doc.text("Página " + doc.internal.getNumberOfPages(), d.settings.margin.left, doc.internal.pageSize.height - 8); } });
    await guardarArchivo(doc.output("blob"), nombreArchivo("pdf"));
}
function exportarExcel() {
    let r = reporteActual;
    let wb = XLSX.utils.book_new();
    let hInd = XLSX.utils.aoa_to_sheet([["Indicador", "Valor"]].concat(r.indicadores));
    XLSX.utils.book_append_sheet(wb, hInd, "Indicadores");
    let hDet = XLSX.utils.aoa_to_sheet([r.columnas].concat(r.filas));
    XLSX.utils.book_append_sheet(wb, hDet, "Detalle");
    XLSX.writeFile(wb, nombreArchivo("xlsx"));
}


/* =========================================================
   TRADUCCIÓN DE ERRORES Y ARRANQUE
========================================================= */
function traducir(e) {
    let m = {
        CAMPOS_INCOMPLETOS: "Completa todos los campos obligatorios.",
        FECHAS_INVALIDAS: "La fecha de fin debe ser posterior a la de inicio.",
        FECHAS_INVALIDAS_INST: "La fecha de finalización debe ser posterior a la de inicio y a la fecha de hoy.",
        NOMBRE_REPETIDO: "Ya existe una institución con ese nombre.",
        CUPOS_INSUFICIENTES: e.message || "El grupo no tiene cupos suficientes.",
        SIN_CUPOS: "La plaza no tiene cupos libres.",
        SIN_CUPOS_DOCENTE: e.message || "El docente no tiene cupos suficientes.",
        CONVENIO_VENCIDO: "El convenio de la institución está vencido.",
        PLAZA_NO_APROBADA: "La plaza debe estar aprobada.",
        HORAS_INVALIDAS: "Ingresa un número de horas mayor que 0.",
        FECHA_INVALIDA: "La fecha no es válida."
    };
    if (e && e.codigo === "FECHAS_INVALIDAS" && e.message && e.message.indexOf("institución") !== -1) return m.FECHAS_INVALIDAS_INST;
    return (e && m[e.codigo]) || (e && e.message) || "Ocurrió un error.";
}

async function pintarTodo() {
    await pintarInicio();
    await pintarInstituciones();
    await cargarFiltrosEstado();
    await pintarEstado();
    await pintarSupervision();
}

(async function () {
    await pintarInicio();
    await pintarGestionar();
    await pintarInstituciones();
    await cargarFiltrosEstado();
    await pintarEstado();
    await pintarSupervision();
})();
