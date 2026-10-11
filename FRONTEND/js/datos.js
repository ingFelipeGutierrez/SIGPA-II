/* =========================================================================
   SIGPA · js/datos.js
   CAPA DE DATOS, REGLAS DE NEGOCIO Y SEMILLA DE EJEMPLO

   Toda la información del prototipo vive en localStorage y SOLO se accede a
   través de las funciones de este archivo. Los paneles nunca leen ni
   escriben localStorage directamente.

   Todas las funciones públicas son async (devuelven una promesa), aunque hoy
   resuelvan al instante: así, cuando llegue la API REST, solo cambia este
   archivo y los paneles quedan igual.

   Contenido:
     1. Constantes y utilidades internas
     2. Semilla del semestre 2026-2 (datos de ejemplo)
     3. Acceso a localStorage (privado)
     4. Reglas de negocio y datos derivados
     5. Funciones públicas (sesión, instituciones, plazas, grupos,
        asignación, prácticas, bitácoras, notas, retroalimentación, reportes)
   ========================================================================= */

(function (global) {
"use strict";

/* =========================================================
   1. CONSTANTES
========================================================= */
const VERSION_DATOS = "2026-2.1";     // si cambia, se regenera la semilla
const PREFIJO = "sigpa_";
const HORAS_REQUERIDAS = 160;
const MAX_ESTUDIANTES_DOCENTE = 6;

const NIVELES = {
    1: { requisitos: "Observación participante en aula y registro de la dinámica escolar.",
         ampliados: "El estudiante observa clases del área de matemáticas, registra la dinámica del aula y la gestión del docente, y entrega sus bitácoras con evidencias. Cumple las horas exigidas para este nivel." },
    2: { requisitos: "Acompañamiento en aula con intervención pedagógica supervisada.",
         ampliados: "El estudiante acompaña clases del área de matemáticas, diseña e implementa actividades de refuerzo, registra cada jornada en la bitácora con sus evidencias y cumple las horas exigidas para este nivel." },
    3: { requisitos: "Diseño e implementación autónoma de clases con supervisión del docente asesor.",
         ampliados: "El estudiante planea y orienta clases completas con supervisión, diseña instrumentos de evaluación, registra cada jornada en la bitácora con sus evidencias y cumple las horas exigidas para este nivel." }
};

/* ---- utilidades internas de fecha ---- */
function hoy() {
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
function iso(fecha) {
    let d = new Date(fecha);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
}
function masDias(dias) {
    let d = hoy();
    d.setDate(d.getDate() + dias);
    return iso(d);
}
function diasEntre(isoA, isoB) {
    return Math.round((new Date(isoB) - new Date(isoA)) / 86400000);
}
function hoyIso() { return iso(hoy()); }

/* ---- generador seudoaleatorio con semilla fija (mismos datos siempre) ---- */
function generador(semilla) {
    let s = semilla;
    return function () {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}


/* =========================================================
   2. SEMILLA DEL SEMESTRE 2026-2
   Devuelve el objeto completo con todas las colecciones.
========================================================= */
function construirSemilla() {
    const rnd = generador(20262);

    const directores = [{ id: 1, nombre: "Ricardo Jaime" }];
    const docentes = [{ id: 1, nombre: "Laura Sánchez" }, { id: 2, nombre: "Patricia Nieto" }];

    const estudiantes = [
        { id: 1, nombre: "Laura Fernández", programa: "Licenciatura en Matemáticas" },
        { id: 2, nombre: "María Paz Osorio", programa: "Licenciatura en Matemáticas" },
        { id: 3, nombre: "Juan Camilo Rey", programa: "Licenciatura en Matemáticas" },
        { id: 4, nombre: "Diego Alarcón", programa: "Licenciatura en Matemáticas" },
        { id: 5, nombre: "Sara Higuera", programa: "Licenciatura en Matemáticas" },
        { id: 6, nombre: "Camilo Ortega", programa: "Licenciatura en Matemáticas" },
        { id: 7, nombre: "Valentina Ruiz", programa: "Licenciatura en Matemáticas" },
        { id: 8, nombre: "Andrés Castillo", programa: "Licenciatura en Matemáticas" },
        { id: 9, nombre: "Natalia Pérez", programa: "Licenciatura en Matemáticas" }
    ];

    const instituciones = [
        { id: 1, nombre: "Institución Educativa Simón Bolívar", tipo: "Oficial", direccion: "Carrera 25 # 30-15, Bucaramanga", contacto: "Rectoría · Tel. (607) 555 0142", convenioInicio: masDias(-365), convenioFin: masDias(330) },
        { id: 2, nombre: "Institución Educativa Técnica del Norte", tipo: "Oficial", direccion: "Calle 52 # 14-40, Bucaramanga", contacto: "Coordinación académica · Tel. (607) 555 0178", convenioInicio: masDias(-200), convenioFin: masDias(400) },
        { id: 3, nombre: "Colegio San Pedro Claver", tipo: "Privada", direccion: "Carrera 18 # 41-22, Bucaramanga", contacto: "Rectoría · Tel. (607) 555 0119", convenioInicio: masDias(-700), convenioFin: masDias(40) },
        { id: 4, nombre: "Colegio La Presentación", tipo: "Privada", direccion: "Calle 36 # 22-08, Bucaramanga", contacto: "Secretaría · Tel. (607) 555 0163", convenioInicio: masDias(-730), convenioFin: masDias(-20) }
    ];

    const plazas = [
        { id: 1, institucionId: 1, cupos: 6, jornada: "Mañana", descripcion: "Acompañamiento en las clases de matemáticas de básica secundaria.", estado: "Aprobada", motivoRechazo: "", fechaRegistro: masDias(-160) },
        { id: 2, institucionId: 2, cupos: 3, jornada: "Única", descripcion: "Apoyo en el área de matemáticas de media técnica.", estado: "Aprobada", motivoRechazo: "", fechaRegistro: masDias(-160) },
        { id: 3, institucionId: 3, cupos: 2, jornada: "Tarde", descripcion: "Refuerzo escolar en matemáticas de básica primaria.", estado: "Aprobada", motivoRechazo: "", fechaRegistro: masDias(-50) },
        { id: 4, institucionId: 4, cupos: 2, jornada: "Mañana", descripcion: "Acompañamiento en matemáticas de básica secundaria.", estado: "Pendiente", motivoRechazo: "", fechaRegistro: masDias(-5) },
        { id: 5, institucionId: 1, cupos: 2, jornada: "Tarde", descripcion: "Refuerzo en jornada de la tarde.", estado: "Rechazada", motivoRechazo: "No hay docente de matemáticas disponible en esa jornada para acompañar a los estudiantes.", fechaRegistro: masDias(-120) }
    ];

    const grupos = [
        { id: 0, nombre: "Grupo 2026-1 · Simón Bolívar", plazaId: 1, tipo: "Práctica intermedia", nivel: 2, fechaInicio: masDias(-150), fechaFin: masDias(-8), horasRequeridas: 160 },
        { id: 1, nombre: "Grupo A · Simón Bolívar", plazaId: 1, tipo: "Práctica intermedia", nivel: 2, fechaInicio: masDias(-45), fechaFin: masDias(60), horasRequeridas: 160 },
        { id: 2, nombre: "Grupo B · Técnica del Norte", plazaId: 2, tipo: "Práctica profesional", nivel: 3, fechaInicio: masDias(-45), fechaFin: masDias(60), horasRequeridas: 160 },
        { id: 3, nombre: "Grupo C · San Pedro Claver", plazaId: 3, tipo: "Observación", nivel: 1, fechaInicio: masDias(10), fechaFin: masDias(90), horasRequeridas: 160 }
    ];

    // practica: estudianteId, grupoId, docenteId, resultado, motivoRechazo, fechaResultado, fechaAsignacion
    const practicas = [
        { id: 1, estudianteId: 1, grupoId: 1, docenteId: 1, resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: masDias(-50) },
        { id: 2, estudianteId: 2, grupoId: 1, docenteId: 1, resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: masDias(-50) },
        { id: 3, estudianteId: 3, grupoId: 2, docenteId: 1, resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: masDias(-50) },
        { id: 4, estudianteId: 4, grupoId: 3, docenteId: 1, resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: masDias(-6) },
        { id: 6, estudianteId: 6, grupoId: null, docenteId: 2, resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: masDias(-3) },
        { id: 7, estudianteId: 7, grupoId: 0, docenteId: 2, resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: masDias(-155) },
        { id: 8, estudianteId: 8, grupoId: 0, docenteId: 2, resultado: "Aprobada", motivoRechazo: "", fechaResultado: masDias(-4), fechaAsignacion: masDias(-155) },
        { id: 9, estudianteId: 9, grupoId: 0, docenteId: 2, resultado: "Rechazada", motivoRechazo: "No alcanzó las horas mínimas exigidas para el nivel.", fechaResultado: masDias(-4), fechaAsignacion: masDias(-155) }
    ];
    // estudiante 5 (Sara): sin práctica

    /* ---- Bitácoras, notas y retroalimentaciones ---- */
    const TITULOS = [
        "Taller de números primos", "Clase de geometría: ángulos de un triángulo", "Refuerzo de fracciones",
        "Evaluación diagnóstica de álgebra", "Resolución de problemas con proporcionalidad", "Juego de lógica matemática",
        "Introducción a las ecuaciones lineales", "Taller de áreas y perímetros", "Revisión de tareas y retroalimentación",
        "Clase de estadística básica", "Construcción de tablas de frecuencia", "Actividad con material concreto",
        "Preparación de guía de ejercicios", "Acompañamiento en feria de matemáticas", "Clase sobre funciones",
        "Repaso de operaciones con enteros", "Taller de potenciación", "Uso de regla y transportador",
        "Planeación de clase con el docente titular", "Observación de clase de geometría"
    ];
    const OBSERVACIONES = [
        "Buen desarrollo de la actividad; el material fue pertinente.",
        "Cumple con los objetivos; falta mayor participación de los estudiantes en el cierre.",
        "Excelente manejo del grupo y claridad en la explicación.",
        "Se recomienda profundizar en la evaluación del aprendizaje.",
        "Planeación completa y evidencias claras.", ""
    ];
    const RETROS = [
        "La planeación de clases mejora semana a semana. Te recomiendo incluir actividades de cierre que permitan verificar lo aprendido y registrar con más detalle las dificultades que observes en el grupo.",
        "Tu manejo del grupo es cada vez mejor. Procura dejar registro de las estrategias que usas cuando una explicación no funciona, para que puedas repetir lo que sí da resultado.",
        "Buen trabajo con el material concreto. Para el siguiente periodo, intenta variar las formas de evaluación y documenta cómo responde el grupo a cada una.",
        "Sigue así con la puntualidad en los registros. Te sugiero describir con más detalle la participación de los estudiantes y los aprendizajes alcanzados en cada jornada."
    ];
    const GRADOS = ["6°", "7°", "8°", "9°", "10°", "11°"];

    let bitacoras = [], notas = [], retros = [];
    let idB = 1, idN = 1, idR = 1;

    // Config por estudiante: [aprobadas, pendientes, requiereCorreccion, notas, retroalimentaciones]
    const plan = {
        1: [12, 1, 1, 6, 2], 2: [4, 2, 0, 2, 1], 3: [17, 1, 0, 8, 3],
        7: [19, 1, 0, 10, 3], 8: [20, 0, 0, 15, 3], 9: [8, 0, 0, 4, 2]
    };

    function nuevaBitacora(estId, estado, fechaAct, titulo, descripcion, horas, evidencias, motivo, fechaRev) {
        let b = { id: idB++, estudianteId: estId, fecha: fechaAct, titulo: titulo, descripcion: descripcion,
            horas: horas, estado: estado, motivoCorreccion: motivo || "", evidencias: evidencias || [],
            fechaRegistro: fechaAct, fechaRevision: fechaRev || null };
        bitacoras.push(b);
        return b;
    }

    function evidenciasAleatorias(indice) {
        if (rnd() > 0.7) return [];
        let n = rnd() > 0.6 ? 2 : 1;
        let lista = [];
        for (let i = 0; i < n; i++) {
            let esImagen = rnd() > 0.5;
            let base = esImagen ? "fotos_actividad" : "planeacion_clase";
            let ext = esImagen ? "jpg" : "pdf";
            lista.push({ nombre: base + "_" + String(indice).padStart(2, "0") + "." + ext,
                tipo: ext.toUpperCase(), tamanoKB: 150 + Math.floor(rnd() * 2900) });
        }
        return lista;
    }

    Object.keys(plan).forEach(function (k) {
        let estId = Number(k);
        let [aprob, pend, corr, numNotas, numRetros] = plan[k];
        let pr = practicas.find(function (p) { return p.estudianteId === estId; });
        let g = grupos.find(function (x) { return x.id === pr.grupoId; });
        let ini = new Date(g.fechaInicio);
        let finVentana = new Date(Math.min(hoy().getTime(), new Date(g.fechaFin).getTime()));
        let total = aprob + pend + corr;
        let bitacorasEst = [];

        for (let i = 0; i < total; i++) {
            // fecha repartida entre inicio y la ventana (nunca después de hoy)
            let t = total > 1 ? i / (total - 1) : 0;
            let f = new Date(ini.getTime() + t * (finVentana.getTime() - ini.getTime()));
            let fechaAct = iso(f);
            let titulo = TITULOS[(estId * 3 + i) % TITULOS.length];
            let grado = GRADOS[(estId + i) % GRADOS.length];
            let desc = "Se desarrolló la actividad «" + titulo + "» con el grupo de " + grado +
                ", empleando material concreto y ejercicios guiados; se registraron las dificultades observadas.";
            let estado = i < aprob ? "Aprobada" : i < aprob + pend ? "Pendiente" : "Requiere corrección";
            let fechaRev = estado === "Aprobada" ? iso(new Date(Math.min(hoy().getTime(), f.getTime() + 2 * 86400000))) : null;
            let motivo = estado === "Requiere corrección" ? "La descripción es muy general. Indica los temas, las actividades realizadas y las dificultades observadas." : "";
            let b = nuevaBitacora(estId, estado, fechaAct, titulo, desc, 8, evidenciasAleatorias(idB), motivo, fechaRev);
            bitacorasEst.push(b);
        }

        // Notas: sobre las primeras bitácoras aprobadas
        let aprobadas = bitacorasEst.filter(function (b) { return b.estado === "Aprobada"; });
        for (let i = 0; i < numNotas && i < aprobadas.length; i++) {
            let b = aprobadas[i];
            // valores que rondan el promedio objetivo de la §8.7
            let objetivo = { 1: 4.2, 2: 3.5, 3: 4.1, 7: 4.3, 8: 4.6, 9: 2.8 }[estId];
            let valor = Math.max(0, Math.min(5, objetivo + (rnd() - 0.5)));
            valor = Math.round(valor * 10) / 10;
            notas.push({ id: idN++, bitacoraId: b.id, valor: valor,
                observaciones: OBSERVACIONES[Math.floor(rnd() * OBSERVACIONES.length)],
                fechaRegistro: b.fechaRevision, docenteId: pr.docenteId });
        }

        // Retroalimentaciones: sobre bitácoras aprobadas
        for (let i = 0; i < numRetros && i < aprobadas.length; i++) {
            let b = aprobadas[i];
            retros.push({ id: idR++, bitacoraId: b.id, estudianteId: estId, docenteId: pr.docenteId,
                texto: RETROS[i % RETROS.length], fechaRegistro: b.fechaRevision });
        }
    });

    // --- Bitácoras fijas de Laura Fernández (no aleatorias) ---
    // Reemplazamos su pendiente y su "requiere corrección" por versiones controladas.
    let lauraPend = bitacoras.find(function (b) { return b.estudianteId === 1 && b.estado === "Pendiente"; });
    if (lauraPend) {
        lauraPend.fecha = masDias(-2); lauraPend.fechaRegistro = masDias(-2);
        lauraPend.titulo = "Clase sobre funciones, grado 9°"; lauraPend.horas = 4;
        lauraPend.descripcion = "Se introdujo el concepto de función con ejemplos de la vida diaria y ejercicios guiados en el tablero.";
        lauraPend.evidencias = [{ nombre: "clase_funciones.jpg", tipo: "JPG", tamanoKB: 870 }];
    }
    let lauraCorr = bitacoras.find(function (b) { return b.estudianteId === 1 && b.estado === "Requiere corrección"; });
    if (lauraCorr) {
        lauraCorr.fecha = masDias(-5); lauraCorr.fechaRegistro = masDias(-5);
        lauraCorr.titulo = "Refuerzo de fracciones, grado 6°"; lauraCorr.horas = 3;
        lauraCorr.descripcion = "Se trabajó fracciones.";
        lauraCorr.evidencias = []; lauraCorr.fechaRevision = masDias(-3);
        lauraCorr.motivoCorreccion = "La descripción es muy general. Indica los temas, las actividades realizadas y las dificultades observadas.";
    }

    const usuarios = [
        { usuario: "estudiante", clave: "123456", rol: "Estudiante", nombre: "Laura Fernández", refId: 1 },
        { usuario: "docente", clave: "123456", rol: "Docente Asesor", nombre: "Laura Sánchez", refId: 1 },
        { usuario: "director", clave: "123456", rol: "Director de Programa", nombre: "Ricardo Jaime", refId: 1 }
    ];

    return { usuarios, directores, docentes, estudiantes, instituciones, plazas, grupos, practicas, bitacoras, notas, retroalimentaciones: retros };
}


/* =========================================================
   3. ACCESO A localStorage (privado)
========================================================= */
function leer(col) {
    let d = localStorage.getItem(PREFIJO + col);
    return d ? JSON.parse(d) : [];
}
function escribir(col, arreglo) {
    localStorage.setItem(PREFIJO + col, JSON.stringify(arreglo));
}
function nuevoId(col) {
    let arr = leer(col);
    return arr.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0) + 1;
}

// Regenera la semilla si cambió la versión o cambió el día.
function inicializar() {
    let marca = localStorage.getItem(PREFIJO + "marca");
    let esperado = VERSION_DATOS + "|" + hoyIso();
    if (marca === esperado) return;

    Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf(PREFIJO) === 0) localStorage.removeItem(k);
    });
    let semilla = construirSemilla();
    Object.keys(semilla).forEach(function (col) { escribir(col, semilla[col]); });
    localStorage.setItem(PREFIJO + "marca", esperado);
}
inicializar();


/* =========================================================
   4. REGLAS DE NEGOCIO Y DATOS DERIVADOS
========================================================= */

// Estado de la práctica (R: documento maestro §7.3)
function estadoPractica(practica) {
    if (!practica) return null;
    if (practica.resultado) return practica.resultado;      // Aprobada | Rechazada
    let grupos = leer("grupos");
    let g = grupos.find(function (x) { return x.id === practica.grupoId; });
    if (practica.grupoId === null || practica.grupoId === undefined || !practica.docenteId || !g) return "Pendiente";
    if (hoyIso() < g.fechaInicio) return "Pendiente";
    if (hoyIso() <= g.fechaFin) return "En curso";
    return "Finalizada";
}

function estadoConvenio(institucion) {
    let d = diasEntre(hoyIso(), institucion.convenioFin);
    if (d < 0) return "Vencido";
    if (d <= 60) return "Próximo a vencer";
    return "Vigente";
}

function horasAprobadas(estudianteId) {
    return leer("bitacoras")
        .filter(function (b) { return b.estudianteId === estudianteId && b.estado === "Aprobada"; })
        .reduce(function (s, b) { return s + Number(b.horas); }, 0);
}

function horasRequeridasDe(practica) {
    let g = leer("grupos").find(function (x) { return x.id === practica.grupoId; });
    return g ? g.horasRequeridas : HORAS_REQUERIDAS;
}

function porcentaje(cumplidas, requeridas) {
    if (!requeridas) return 0;
    return Math.round(cumplidas / requeridas * 100);
}

function nivelCumplimiento(pct) {
    return pct < 50 ? "Bajo" : pct < 80 ? "Medio" : "Alto";
}

function cuposOcupados(plazaId) {
    let grupos = leer("grupos").filter(function (g) { return g.plazaId === plazaId; }).map(function (g) { return g.id; });
    return leer("practicas").filter(function (p) { return grupos.indexOf(p.grupoId) !== -1; }).length;
}

function cargaDocente(docenteId) {
    return leer("practicas").filter(function (p) { return p.docenteId === docenteId && !p.resultado; }).length;
}

function notaPromedio(estudianteId) {
    let bits = leer("bitacoras").filter(function (b) { return b.estudianteId === estudianteId; }).map(function (b) { return b.id; });
    let ns = leer("notas").filter(function (n) { return bits.indexOf(n.bitacoraId) !== -1; });
    if (!ns.length) return null;
    return Math.round(ns.reduce(function (s, n) { return s + n.valor; }, 0) / ns.length * 10) / 10;
}

function practicaDeEstudiante(estudianteId) {
    return leer("practicas").find(function (p) { return p.estudianteId === estudianteId; }) || null;
}

// Error de negocio con código reconocible
function ErrorNegocio(codigo, mensaje) {
    let e = new Error(mensaje || codigo);
    e.codigo = codigo;
    return e;
}

const asinc = function (valor) { return Promise.resolve(valor); };


/* =========================================================
   5. FUNCIONES PÚBLICAS
========================================================= */
const API = {

    /* ---- Catálogos y utilidades expuestas ---- */
    NIVELES: NIVELES,
    estadoPractica: function (p) { return estadoPractica(p); },
    estadoConvenio: function (i) { return estadoConvenio(i); },
    nivelCumplimiento: nivelCumplimiento,
    porcentaje: porcentaje,

    /* ---- Sesión ---- */
    validarLogin: function (usuario, clave) {
        let u = leer("usuarios").find(function (x) { return x.usuario === usuario && x.clave === clave; });
        return asinc(u || null);
    },

    /* ---- Estudiantes y docentes ---- */
    obtenerEstudiante: function (id) { return asinc(leer("estudiantes").find(function (e) { return e.id === id; }) || null); },
    obtenerEstudiantes: function () { return asinc(leer("estudiantes")); },
    obtenerDocentes: function () { return asinc(leer("docentes")); },
    cargaDocente: function (id) { return asinc(cargaDocente(id)); },

    /* ---- Instituciones y convenios ---- */
    obtenerInstituciones: function () {
        let insts = leer("instituciones").map(function (i) {
            let plazasInst = leer("plazas").filter(function (p) { return p.institucionId === i.id && p.estado === "Aprobada"; });
            let total = plazasInst.reduce(function (s, p) { return s + p.cupos; }, 0);
            let ocup = plazasInst.reduce(function (s, p) { return s + cuposOcupados(p.id); }, 0);
            return Object.assign({}, i, { estadoConvenio: estadoConvenio(i), plazasTotales: total, plazasOcupadas: ocup,
                diasRestantes: diasEntre(hoyIso(), i.convenioFin) });
        });
        return asinc(insts);
    },
    registrarInstitucion: function (datos) {
        let insts = leer("instituciones");
        let norm = function (s) { return (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
        if (!datos.nombre || !datos.tipo || !datos.direccion || !datos.contacto || !datos.convenioInicio || !datos.convenioFin)
            return Promise.reject(ErrorNegocio("CAMPOS_INCOMPLETOS"));
        if (datos.convenioFin <= datos.convenioInicio || datos.convenioFin <= hoyIso())
            return Promise.reject(ErrorNegocio("FECHAS_INVALIDAS"));
        if (insts.some(function (i) { return norm(i.nombre) === norm(datos.nombre); }))
            return Promise.reject(ErrorNegocio("NOMBRE_REPETIDO"));
        let nueva = { id: nuevoId("instituciones"), nombre: datos.nombre.trim(), tipo: datos.tipo,
            direccion: datos.direccion.trim(), contacto: datos.contacto.trim(),
            convenioInicio: datos.convenioInicio, convenioFin: datos.convenioFin };
        insts.push(nueva); escribir("instituciones", insts);
        return asinc(nueva);
    },
    renovarConvenio: function (id, nuevaFin) {
        let insts = leer("instituciones");
        let i = insts.find(function (x) { return x.id === id; });
        if (!i) return Promise.reject(ErrorNegocio("NO_EXISTE"));
        if (nuevaFin <= i.convenioFin || nuevaFin <= hoyIso())
            return Promise.reject(ErrorNegocio("FECHA_INVALIDA"));
        i.convenioFin = nuevaFin; escribir("instituciones", insts);
        return asinc(i);
    },

    /* ---- Plazas ---- */
    obtenerPlazas: function (filtros) {
        filtros = filtros || {};
        let insts = leer("instituciones");
        let plazas = leer("plazas").map(function (p) {
            let inst = insts.find(function (i) { return i.id === p.institucionId; });
            return Object.assign({}, p, { institucion: inst ? inst.nombre : "—",
                convenioEstado: inst ? estadoConvenio(inst) : "—", convenioFin: inst ? inst.convenioFin : null,
                ocupados: cuposOcupados(p.id), institucionObj: inst });
        });
        if (filtros.estado) plazas = plazas.filter(function (p) { return p.estado === filtros.estado; });
        return asinc(plazas);
    },
    registrarPlaza: function (datos) {
        if (!datos.institucionId || !(Number(datos.cupos) > 0) || !datos.jornada)
            return Promise.reject(ErrorNegocio("CAMPOS_INCOMPLETOS"));
        let plazas = leer("plazas");
        let nueva = { id: nuevoId("plazas"), institucionId: Number(datos.institucionId), cupos: Number(datos.cupos),
            jornada: datos.jornada, descripcion: (datos.descripcion || "").trim(), estado: "Pendiente",
            motivoRechazo: "", fechaRegistro: hoyIso() };
        plazas.push(nueva); escribir("plazas", plazas);
        return asinc(nueva);
    },
    decidirPlaza: function (id, decision, motivo) {
        let plazas = leer("plazas");
        let p = plazas.find(function (x) { return x.id === id; });
        if (!p) return Promise.reject(ErrorNegocio("NO_EXISTE"));
        let inst = leer("instituciones").find(function (i) { return i.id === p.institucionId; });
        if (decision === "Aprobada" && estadoConvenio(inst) === "Vencido")
            return Promise.reject(ErrorNegocio("CONVENIO_VENCIDO"));
        if (decision === "Rechazada" && !(motivo || "").trim())
            return Promise.reject(ErrorNegocio("MOTIVO_VACIO"));
        p.estado = decision; p.motivoRechazo = decision === "Rechazada" ? motivo.trim() : "";
        escribir("plazas", plazas);
        return asinc(p);
    },

    /* ---- Grupos ---- */
    obtenerGrupos: function (soloVigentes) {
        let insts = leer("instituciones"); let plazas = leer("plazas");
        let gs = leer("grupos").map(function (g) {
            let pl = plazas.find(function (p) { return p.id === g.plazaId; });
            let inst = pl ? insts.find(function (i) { return i.id === pl.institucionId; }) : null;
            return Object.assign({}, g, { institucion: inst ? inst.nombre : "—",
                cuposLibres: pl ? pl.cupos - cuposOcupados(pl.id) : 0 });
        });
        if (soloVigentes) gs = gs.filter(function (g) { return g.fechaFin >= hoyIso(); });
        return asinc(gs);
    },
    crearGrupo: function (datos) {
        let plazas = leer("plazas");
        let pl = plazas.find(function (p) { return p.id === Number(datos.plazaId); });
        if (!datos.nombre || !datos.plazaId || !datos.tipo || !datos.nivel || !datos.fechaInicio || !datos.fechaFin || !(Number(datos.horasRequeridas) > 0))
            return Promise.reject(ErrorNegocio("CAMPOS_INCOMPLETOS"));
        if (datos.fechaFin <= datos.fechaInicio) return Promise.reject(ErrorNegocio("FECHAS_INVALIDAS"));
        if (!pl || pl.estado !== "Aprobada") return Promise.reject(ErrorNegocio("PLAZA_NO_APROBADA"));
        if (pl.cupos - cuposOcupados(pl.id) <= 0) return Promise.reject(ErrorNegocio("SIN_CUPOS"));
        let grupos = leer("grupos");
        let nuevo = { id: nuevoId("grupos"), nombre: datos.nombre.trim(), plazaId: Number(datos.plazaId),
            tipo: datos.tipo, nivel: Number(datos.nivel), fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin,
            horasRequeridas: Number(datos.horasRequeridas) };
        grupos.push(nuevo); escribir("grupos", grupos);
        return asinc(nuevo);
    },
    asignarEstudiantesAGrupo: function (grupoId, estudiantesIds) {
        let grupos = leer("grupos"); let plazas = leer("plazas"); let insts = leer("instituciones");
        let g = grupos.find(function (x) { return x.id === Number(grupoId); });
        if (!g) return Promise.reject(ErrorNegocio("NO_EXISTE"));
        let pl = plazas.find(function (p) { return p.id === g.plazaId; });
        let libres = pl.cupos - cuposOcupados(pl.id);
        if (estudiantesIds.length > libres) return Promise.reject(ErrorNegocio("CUPOS_INSUFICIENTES", "El grupo solo tiene " + libres + " cupos libres."));
        let inst = insts.find(function (i) { return i.id === pl.institucionId; });
        if (estadoConvenio(inst) === "Vencido") return Promise.reject(ErrorNegocio("CONVENIO_VENCIDO"));
        let practicas = leer("practicas");
        estudiantesIds.forEach(function (eid) {
            let p = practicas.find(function (x) { return x.estudianteId === eid; });
            if (p) { p.grupoId = g.id; }
            else { practicas.push({ id: nuevoId("practicas"), estudianteId: eid, grupoId: g.id, docenteId: null,
                resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: hoyIso() }); }
        });
        escribir("practicas", practicas);
        return asinc(true);
    },

    /* ---- Asignación de docente ---- */
    asignarDocente: function (estudiantesIds, docenteId) {
        let disponibles = MAX_ESTUDIANTES_DOCENTE - cargaDocente(docenteId);
        if (estudiantesIds.length > disponibles)
            return Promise.reject(ErrorNegocio("SIN_CUPOS_DOCENTE", "El docente asesor solo tiene " + disponibles + " cupos disponibles."));
        let practicas = leer("practicas");
        estudiantesIds.forEach(function (eid) {
            let p = practicas.find(function (x) { return x.estudianteId === eid; });
            if (p) { p.docenteId = docenteId; }
            else { practicas.push({ id: nuevoId("practicas"), estudianteId: eid, grupoId: null, docenteId: docenteId,
                resultado: null, motivoRechazo: "", fechaResultado: null, fechaAsignacion: hoyIso() }); }
        });
        escribir("practicas", practicas);
        return asinc(true);
    },

    /* ---- Prácticas ---- */
    obtenerPracticas: function (filtros) {
        filtros = filtros || {};
        let ests = leer("estudiantes"); let docs = leer("docentes");
        let grupos = leer("grupos"); let plazas = leer("plazas"); let insts = leer("instituciones");
        let lista = leer("practicas").map(function (p) {
            let e = ests.find(function (x) { return x.id === p.estudianteId; });
            let d = docs.find(function (x) { return x.id === p.docenteId; });
            let g = grupos.find(function (x) { return x.id === p.grupoId; });
            let pl = g ? plazas.find(function (x) { return x.id === g.plazaId; }) : null;
            let inst = pl ? insts.find(function (x) { return x.id === pl.institucionId; }) : null;
            let req = g ? g.horasRequeridas : HORAS_REQUERIDAS;
            let hrs = horasAprobadas(p.estudianteId);
            return Object.assign({}, p, {
                estudiante: e ? e.nombre : "—", programa: e ? e.programa : "",
                docente: d ? d.nombre : null, grupo: g ? g.nombre : null, grupoObj: g,
                institucion: inst ? inst.nombre : null, institucionObj: inst, jornada: pl ? pl.jornada : null,
                tipo: g ? g.tipo : null, nivel: g ? g.nivel : null,
                fechaInicio: g ? g.fechaInicio : null, fechaFin: g ? g.fechaFin : null,
                horasRequeridas: req, horasCumplidas: hrs, porcentaje: porcentaje(hrs, req),
                estado: estadoPractica(p), notaPromedio: notaPromedio(p.estudianteId)
            });
        });
        if (filtros.docenteId) lista = lista.filter(function (p) { return p.docenteId === filtros.docenteId; });
        if (filtros.estado) lista = lista.filter(function (p) { return p.estado === filtros.estado; });
        if (filtros.institucionId) lista = lista.filter(function (p) { return p.institucionObj && p.institucionObj.id === filtros.institucionId; });
        return asinc(lista);
    },
    decidirResultado: function (practicaId, decision, motivo) {
        let practicas = leer("practicas");
        let p = practicas.find(function (x) { return x.id === practicaId; });
        if (!p) return Promise.reject(ErrorNegocio("NO_EXISTE"));
        if (estadoPractica(p) !== "Finalizada") return Promise.reject(ErrorNegocio("NO_FINALIZADA"));
        if (decision === "Rechazada" && !(motivo || "").trim()) return Promise.reject(ErrorNegocio("MOTIVO_VACIO"));
        p.resultado = decision; p.motivoRechazo = decision === "Rechazada" ? motivo.trim() : "";
        p.fechaResultado = hoyIso();
        escribir("practicas", practicas);
        return asinc(p);
    },

    /* ---- Bitácoras ---- */
    obtenerBitacoras: function (filtros) {
        filtros = filtros || {};
        let ests = leer("estudiantes"); let notas = leer("notas");
        let lista = leer("bitacoras").map(function (b) {
            let e = ests.find(function (x) { return x.id === b.estudianteId; });
            let n = notas.find(function (x) { return x.bitacoraId === b.id; });
            return Object.assign({}, b, { estudiante: e ? e.nombre : "—", nota: n ? n.valor : null });
        });
        if (filtros.estudianteId) lista = lista.filter(function (b) { return b.estudianteId === filtros.estudianteId; });
        if (filtros.estado) lista = lista.filter(function (b) { return b.estado === filtros.estado; });
        if (filtros.docenteId) {
            let mios = leer("practicas").filter(function (p) { return p.docenteId === filtros.docenteId; }).map(function (p) { return p.estudianteId; });
            lista = lista.filter(function (b) { return mios.indexOf(b.estudianteId) !== -1; });
        }
        lista.sort(function (a, b) { return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id; });
        return asinc(lista);
    },
    registrarBitacora: function (datos) {
        let p = practicaDeEstudiante(datos.estudianteId);
        if (estadoPractica(p) !== "En curso") return Promise.reject(ErrorNegocio("PRACTICA_NO_EN_CURSO"));
        if (!datos.fecha || datos.fecha > hoyIso()) return Promise.reject(ErrorNegocio("FECHA_INVALIDA"));
        if (!(Number(datos.horas) > 0)) return Promise.reject(ErrorNegocio("HORAS_INVALIDAS"));
        if (!datos.titulo || !datos.descripcion) return Promise.reject(ErrorNegocio("CAMPOS_INCOMPLETOS"));
        let bits = leer("bitacoras");
        let nueva = { id: nuevoId("bitacoras"), estudianteId: datos.estudianteId, fecha: datos.fecha,
            titulo: datos.titulo.trim(), descripcion: datos.descripcion.trim(), horas: Number(datos.horas),
            estado: "Pendiente", motivoCorreccion: "", evidencias: datos.evidencias || [],
            fechaRegistro: hoyIso(), fechaRevision: null };
        bits.push(nueva); escribir("bitacoras", bits);
        return asinc(nueva);
    },
    corregirBitacora: function (id, datos) {
        let bits = leer("bitacoras");
        let b = bits.find(function (x) { return x.id === id; });
        if (!b || b.estado !== "Requiere corrección") return Promise.reject(ErrorNegocio("NO_CORREGIBLE"));
        if (!datos.fecha || datos.fecha > hoyIso()) return Promise.reject(ErrorNegocio("FECHA_INVALIDA"));
        if (!(Number(datos.horas) > 0)) return Promise.reject(ErrorNegocio("HORAS_INVALIDAS"));
        if (!datos.titulo || !datos.descripcion) return Promise.reject(ErrorNegocio("CAMPOS_INCOMPLETOS"));
        b.fecha = datos.fecha; b.titulo = datos.titulo.trim(); b.descripcion = datos.descripcion.trim();
        b.horas = Number(datos.horas); b.evidencias = datos.evidencias || [];
        b.estado = "Pendiente"; b.motivoCorreccion = "";
        escribir("bitacoras", bits);
        return asinc(b);
    },
    aprobarBitacora: function (id) {
        let bits = leer("bitacoras");
        let b = bits.find(function (x) { return x.id === id; });
        if (!b || b.estado !== "Pendiente") return Promise.reject(ErrorNegocio("NO_PENDIENTE"));
        b.estado = "Aprobada"; b.fechaRevision = hoyIso();
        escribir("bitacoras", bits);
        return asinc(b);
    },
    solicitarCorreccion: function (id, motivo) {
        if (!(motivo || "").trim()) return Promise.reject(ErrorNegocio("MOTIVO_VACIO"));
        let bits = leer("bitacoras");
        let b = bits.find(function (x) { return x.id === id; });
        if (!b || b.estado !== "Pendiente") return Promise.reject(ErrorNegocio("NO_PENDIENTE"));
        b.estado = "Requiere corrección"; b.motivoCorreccion = motivo.trim(); b.fechaRevision = hoyIso();
        escribir("bitacoras", bits);
        return asinc(b);
    },

    /* ---- Notas ---- */
    obtenerNota: function (bitacoraId) {
        return asinc(leer("notas").find(function (n) { return n.bitacoraId === bitacoraId; }) || null);
    },
    obtenerNotasEstudiante: function (estudianteId) {
        let docs = leer("docentes");
        let bits = leer("bitacoras").filter(function (b) { return b.estudianteId === estudianteId; });
        let ids = bits.map(function (b) { return b.id; });
        let lista = leer("notas").filter(function (n) { return ids.indexOf(n.bitacoraId) !== -1; }).map(function (n) {
            let b = bits.find(function (x) { return x.id === n.bitacoraId; });
            let d = docs.find(function (x) { return x.id === n.docenteId; });
            return Object.assign({}, n, { bitacora: b ? b.titulo : "—", evaluador: d ? d.nombre : "—", fecha: n.fechaRegistro });
        });
        lista.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
        return asinc(lista);
    },
    registrarNota: function (bitacoraId, valor, observaciones, docenteId) {
        let b = leer("bitacoras").find(function (x) { return x.id === bitacoraId; });
        let p = b ? practicaDeEstudiante(b.estudianteId) : null;
        if (!b || b.estado !== "Aprobada" || (p && p.resultado)) return Promise.reject(ErrorNegocio("NO_APROBADA"));
        let v = Number(valor);
        if (isNaN(v) || v < 0 || v > 5) return Promise.reject(ErrorNegocio("NOTA_FUERA_RANGO"));
        if ((observaciones || "").length > 500) return Promise.reject(ErrorNegocio("OBS_LARGA"));
        v = Math.round(v * 10) / 10;
        let notas = leer("notas");
        let n = notas.find(function (x) { return x.bitacoraId === bitacoraId; });
        if (n) { n.valor = v; n.observaciones = observaciones || ""; n.fechaRegistro = hoyIso(); }
        else { notas.push({ id: nuevoId("notas"), bitacoraId: bitacoraId, valor: v,
            observaciones: observaciones || "", fechaRegistro: hoyIso(), docenteId: docenteId }); }
        escribir("notas", notas);
        return asinc(true);
    },

    /* ---- Retroalimentación ---- */
    obtenerRetroalimentaciones: function (filtros) {
        filtros = filtros || {};
        let docs = leer("docentes"); let bits = leer("bitacoras");
        let lista = leer("retroalimentaciones").map(function (r) {
            let b = bits.find(function (x) { return x.id === r.bitacoraId; });
            let d = docs.find(function (x) { return x.id === r.docenteId; });
            return Object.assign({}, r, { bitacora: b ? b.titulo : "—", evaluador: d ? d.nombre : "—", fecha: r.fechaRegistro });
        });
        if (filtros.estudianteId) lista = lista.filter(function (r) { return r.estudianteId === filtros.estudianteId; });
        if (filtros.bitacoraId) lista = lista.filter(function (r) { return r.bitacoraId === filtros.bitacoraId; });
        lista.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
        return asinc(lista);
    },
    registrarRetroalimentacion: function (bitacoraId, texto, docenteId) {
        let palabras = (texto || "").trim().split(/\s+/).filter(Boolean).length;
        if (!(texto || "").trim()) return Promise.reject(ErrorNegocio("TEXTO_VACIO"));
        if (palabras > 200) return Promise.reject(ErrorNegocio("TEXTO_LARGO"));
        let b = leer("bitacoras").find(function (x) { return x.id === bitacoraId; });
        if (!b) return Promise.reject(ErrorNegocio("NO_EXISTE"));
        let rs = leer("retroalimentaciones");
        rs.push({ id: nuevoId("retroalimentaciones"), bitacoraId: bitacoraId, estudianteId: b.estudianteId,
            docenteId: docenteId, texto: texto.trim(), fechaRegistro: hoyIso() });
        escribir("retroalimentaciones", rs);
        return asinc(true);
    },

    /* ---- Reportes ---- */
    generarReporte: function (tipo, desde, hasta) {
        if (!desde || !hasta) return Promise.reject(ErrorNegocio("PERIODO_INCOMPLETO"));
        if (hasta < desde) return Promise.reject(ErrorNegocio("PERIODO_INVALIDO"));
        let r = construirReporte(tipo, desde, hasta);
        return asinc(r);
    }
};


/* ---- construcción de reportes (privado) ---- */
function construirReporte(tipo, desde, hasta) {
    let insts = leer("instituciones"); let bits = leer("bitacoras");
    let practicas = leer("practicas"); let ests = leer("estudiantes"); let docs = leer("docentes");
    let grupos = leer("grupos"); let plazas = leer("plazas"); let notas = leer("notas");

    function enRango(f) { return f && f >= desde && f <= hasta; }
    function instDePractica(p) {
        let g = grupos.find(function (x) { return x.id === p.grupoId; });
        let pl = g ? plazas.find(function (x) { return x.id === g.plazaId; }) : null;
        return pl ? insts.find(function (x) { return x.id === pl.institucionId; }) : null;
    }

    if (tipo === "Cumplimiento de horas por institución") {
        let filas = [];
        insts.forEach(function (inst) {
            let prs = practicas.filter(function (p) { return estadoPractica(p) !== "Pendiente" && (instDePractica(p) || {}).id === inst.id; });
            if (!prs.length) return;
            let req = prs.reduce(function (s, p) { let g = grupos.find(function (x) { return x.id === p.grupoId; }); return s + (g ? g.horasRequeridas : 160); }, 0);
            let periodo = 0, acum = 0;
            prs.forEach(function (p) {
                bits.filter(function (b) { return b.estudianteId === p.estudianteId && b.estado === "Aprobada"; }).forEach(function (b) {
                    if (enRango(b.fecha)) periodo += b.horas;
                    if (b.fecha <= hasta) acum += b.horas;
                });
            });
            filas.push([inst.nombre, prs.length, periodo, acum, req, porcentaje(acum, req) + "%"]);
        });
        let totalEst = filas.reduce(function (s, f) { return s + f[1]; }, 0);
        let totalAcum = filas.reduce(function (s, f) { return s + f[3]; }, 0);
        let totalReq = filas.reduce(function (s, f) { return s + f[4]; }, 0);
        return { titulo: tipo, columnas: ["Institución", "Estudiantes", "Horas del periodo", "Horas acumuladas", "Horas requeridas", "Cumplimiento"],
            filas: filas, indicadores: [["Estudiantes en práctica", totalEst], ["Horas acumuladas", totalAcum], ["Cumplimiento promedio", porcentaje(totalAcum, totalReq) + "%"]] };
    }

    if (tipo === "Bitácoras por docente asesor") {
        let filas = [], totalBit = 0, totalPend = 0;
        docs.forEach(function (d) {
            let misEst = practicas.filter(function (p) { return p.docenteId === d.id; }).map(function (p) { return p.estudianteId; });
            let misBits = bits.filter(function (b) { return misEst.indexOf(b.estudianteId) !== -1 && enRango(b.fecha); });
            if (!misBits.length && !misEst.length) return;
            let pend = misBits.filter(function (b) { return b.estado === "Pendiente"; }).length;
            let aprob = misBits.filter(function (b) { return b.estado === "Aprobada"; }).length;
            let corr = misBits.filter(function (b) { return b.estado === "Requiere corrección"; }).length;
            totalBit += misBits.length; totalPend += pend;
            filas.push([d.nombre, misEst.length, pend, aprob, corr]);
        });
        return { titulo: tipo, columnas: ["Docente asesor", "Estudiantes", "Pendientes", "Aprobadas", "Requieren corrección"],
            filas: filas, indicadores: [["Total de bitácoras", totalBit], ["Pendientes de revisión", totalPend]] };
    }

    if (tipo === "Desempeño y resultado de las prácticas") {
        let filas = [], aprob = 0, rech = 0, finDec = 0, sumaNotas = 0, cntNotas = 0;
        practicas.filter(function (p) { return estadoPractica(p) !== "Pendiente"; }).forEach(function (p) {
            let e = ests.find(function (x) { return x.id === p.estudianteId; });
            let inst = instDePractica(p); let d = docs.find(function (x) { return x.id === p.docenteId; });
            let g = grupos.find(function (x) { return x.id === p.grupoId; });
            let req = g ? g.horasRequeridas : 160; let hrs = horasAprobadas(p.estudianteId);
            let misBits = bits.filter(function (b) { return b.estudianteId === p.estudianteId; }).map(function (b) { return b.id; });
            let ns = notas.filter(function (n) { return misBits.indexOf(n.bitacoraId) !== -1 && enRango(n.fechaRegistro); });
            let prom = ns.length ? Math.round(ns.reduce(function (s, n) { return s + n.valor; }, 0) / ns.length * 10) / 10 : null;
            let est = estadoPractica(p);
            if (est === "Aprobada") aprob++; if (est === "Rechazada") rech++; if (est === "Finalizada") finDec++;
            if (prom !== null) { sumaNotas += prom; cntNotas++; }
            filas.push([e ? e.nombre : "—", inst ? inst.nombre : "—", d ? d.nombre : "—", hrs + " / " + req, ns.length, prom !== null ? prom.toFixed(1) : "—", est]);
        });
        return { titulo: tipo, columnas: ["Estudiante", "Institución", "Docente asesor", "Horas", "Bitácoras calificadas", "Nota promedio", "Estado"],
            filas: filas, indicadores: [["Aprobadas", aprob], ["Rechazadas", rech], ["Finalizadas por decidir", finDec], ["Nota promedio general", cntNotas ? (sumaNotas / cntNotas).toFixed(1) : "—"]] };
    }

    // Estado de los convenios
    let filas = [], vig = 0, prox = 0, venc = 0;
    insts.filter(function (i) { return i.convenioInicio <= hasta && i.convenioFin >= desde; }).forEach(function (i) {
        let est = estadoConvenio(i);
        if (est === "Vigente") vig++; if (est === "Próximo a vencer") prox++; if (est === "Vencido") venc++;
        let plazasInst = plazas.filter(function (p) { return p.institucionId === i.id && p.estado === "Aprobada"; });
        let total = plazasInst.reduce(function (s, p) { return s + p.cupos; }, 0);
        let ocup = plazasInst.reduce(function (s, p) { return s + cuposOcupados(p.id); }, 0);
        filas.push([i.nombre, i.convenioInicio, i.convenioFin, est, ocup + " / " + total]);
    });
    return { titulo: tipo, columnas: ["Institución", "Inicio", "Fin", "Estado", "Plazas"],
        filas: filas, indicadores: [["Vigentes", vig], ["Próximos a vencer", prox], ["Vencidos", venc]] };
}


/* ---- exponer ---- */
global.Datos = API;
global.Datos.reiniciar = function () {
    Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREFIJO) === 0) localStorage.removeItem(k); });
    inicializar();
};

})(typeof window !== "undefined" ? window : this);
