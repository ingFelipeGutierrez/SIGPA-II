/**
 * scripts/semilla-demo.js
 *
 * Carga datos de DEMOSTRACIÓN para que los paneles del estudiante, del
 * docente y del director se vean con información al evaluarlos. Es
 * ADITIVO: solo inserta filas nuevas, no modifica ni borra nada de lo que
 * ya existe, y se puede ejecutar varias veces sin duplicar (cada inserción
 * primero revisa si ya existe).
 *
 * Qué crea:
 *  - 3 estudiantes demo (demo.*@udi.edu.co) en neondb.
 *  - Un grupo de práctica nuevo ("Grupo Clínica I - 02 (UDI)", convenio UDI).
 *  - Matrículas (grupo + plaza + docente asesor) para el estudiante de prueba
 *    y los 3 demo, en estados distintos: 3 en curso/finalizada/pendiente.
 *  - Actividades, bitácoras (aprobadas, pendientes y por corregir),
 *    evidencias (enlaces de ejemplo) y retroalimentación en MongoDB.
 *  - Calificaciones de bitácora y una evaluación final en ms_practicas.
 *
 * Uso (desde la carpeta BACKEND):
 *   node scripts/semilla-demo.js --simular   Ensayo: ejecuta los inserts de
 *                                            Postgres dentro de una transacción
 *                                            y la REVIERTE; no toca MongoDB.
 *   node scripts/semilla-demo.js             Guarda los datos de verdad.
 *
 * Requiere los usuarios de prueba (prueba.estudiante y prueba.docente) y la
 * fila de ese docente en docente_cupo. No imprime credenciales.
 */
require("dotenv").config();
const { ObjectId } = require("mongodb");
const neondb = require("../db/neondb");
const practicas = require("../db/practicas");
const { conectarMongo, getDb } = require("../db/mongo");

const SIMULAR = process.argv.includes("--simular");

// ---------------------------------------------------------------------------
// Fechas relativas a hoy, para que el escenario siempre quede "vigente".
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, "0");
function fechaISO(dias) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const fechaMongo = (dias) => new Date(`${fechaISO(dias)}T00:00:00.000Z`);
const limiteMongo = (dias) => new Date(`${fechaISO(dias)}T23:59:59.000Z`);

// ---------------------------------------------------------------------------
// Datos base que ya existen en la base (ver BACKEND/scripts/_salida/esquemas.txt)
// ---------------------------------------------------------------------------
const GRUPO_HOSPITAL = 2;      // "Grupo Clínica I - 01", convenio 2 (Hospital de Prueba)
const PLAZA_HOSPITAL = 1;      // plaza del convenio 2, capacidad 5
const CONVENIO_UDI = 4;        // "Convenio UDI"
const PLAZA_UDI = 5;           // plaza del convenio 4, capacidad 3
const TIPO_PRACTICA = 1;       // Práctica Clínica
const NIVEL_PRACTICA = 1;      // Práctica I
const NOMBRE_GRUPO_UDI = "Grupo Clínica I - 02 (UDI)";

const ESTUDIANTES_DEMO = [
    { clave: "camila", nombre: "Camila", apellido: "Rojas Prada", email: "demo.camila.rojas@udi.edu.co", programa: "Licenciatura en Matemáticas", semestre: 7 },
    { clave: "daniel", nombre: "Daniel", apellido: "Quintero Mejía", email: "demo.daniel.quintero@udi.edu.co", programa: "Licenciatura en Matemáticas", semestre: 8 },
    { clave: "valentina", nombre: "Valentina", apellido: "Navas Ortiz", email: "demo.valentina.navas@udi.edu.co", programa: "Licenciatura en Matemáticas", semestre: 6 },
];

// Actividades que publica el docente para cada grupo (estilo aula virtual).
const ACTIVIDADES_HOSPITAL = [
    { clave: "s1", titulo: "Semana 1: Observación del servicio", descripcion: "Describe el servicio, la población atendida y las dinámicas que observaste en tu primera semana.", limite: -21, estado: "cerrada" },
    { clave: "s2", titulo: "Semana 2: Acompañamiento en consulta", descripcion: "Registra las consultas que acompañaste y lo que aprendiste de cada una.", limite: -7, estado: "abierta" },
    { clave: "s3", titulo: "Semana 3: Plan de intervención", descripcion: "Plantea un plan de intervención para un caso, con objetivos y estrategias.", limite: 3, estado: "abierta" },
    { clave: "s4", titulo: "Semana 4: Aplicación de la intervención", descripcion: "Cuenta cómo aplicaste el plan de intervención y qué resultados obtuviste.", limite: 10, estado: "abierta" },
];
const ACTIVIDADES_UDI = [
    { clave: "s1", titulo: "Semana 1: Reconocimiento institucional", descripcion: "Describe la institución y el equipo con el que vas a trabajar.", limite: -95, estado: "cerrada" },
    { clave: "s2", titulo: "Semana 2: Diagnóstico inicial", descripcion: "Presenta el diagnóstico inicial de la población con la que trabajas.", limite: -75, estado: "cerrada" },
    { clave: "s3", titulo: "Semana 3: Intervención", descripcion: "Describe las intervenciones realizadas y su resultado.", limite: -55, estado: "cerrada" },
    { clave: "s4", titulo: "Semana 4: Cierre y balance", descripcion: "Haz el balance de tu práctica: logros, dificultades y aprendizajes.", limite: -35, estado: "cerrada" },
];

const RETRO = [
    "Buen registro de lo observado. Sigue profundizando en el análisis de cada situación.",
    "Se nota el avance. Relaciona más lo que viste con los referentes teóricos del curso.",
    "Excelente trabajo, claro y bien organizado. Mantén ese nivel.",
    "Buen cierre del proceso. Tus aprendizajes quedaron bien sustentados.",
];

// Bitácoras por estudiante. `semana` apunta a la actividad (s1..s4) de su grupo.
// `dias` = qué día (relativo a hoy) se registró; `nota` solo si está aprobada.
const BITACORAS = {
    prueba: [
        { semana: "s1", dias: -28, estado: "aprobada", horas: 32, nota: 4.5, titulo: "Bitácora semana 1 - Observación del servicio", descripcion: "Conocí el servicio y su equipo, observé la atención a los pacientes y tomé notas sobre la dinámica diaria." },
        { semana: "s2", dias: -14, estado: "requiere_correccion", horas: 28, titulo: "Bitácora semana 2 - Acompañamiento en consulta", descripcion: "Acompañé varias consultas externas.", motivo: "Detalla qué hiciste en cada consulta y relaciona las horas con cada actividad." },
        { semana: "s3", dias: -3, estado: "pendiente", horas: 24, titulo: "Bitácora semana 3 - Plan de intervención", descripcion: "Diseñé un plan de intervención para un caso, con objetivos y estrategias a aplicar la próxima semana." },
    ],
    camila: [
        { semana: "s1", dias: -28, estado: "aprobada", horas: 36, nota: 4.0, titulo: "Bitácora semana 1 - Observación del servicio", descripcion: "Observé el funcionamiento del servicio y participé en la recepción de los pacientes." },
        { semana: "s2", dias: -14, estado: "aprobada", horas: 30, nota: 3.8, titulo: "Bitácora semana 2 - Acompañamiento en consulta", descripcion: "Acompañé consultas y registré las intervenciones del equipo de salud." },
        { semana: "s3", dias: -3, estado: "pendiente", horas: 24, titulo: "Bitácora semana 3 - Plan de intervención", descripcion: "Preparé el plan de intervención y lo revisé con mi docente asesor." },
    ],
    daniel: [
        { semana: "s1", dias: -98, estado: "aprobada", horas: 40, nota: 4.2, titulo: "Bitácora semana 1 - Reconocimiento institucional", descripcion: "Recorrí la institución, conocí al equipo y revisé los protocolos de atención." },
        { semana: "s2", dias: -78, estado: "aprobada", horas: 40, nota: 4.5, titulo: "Bitácora semana 2 - Diagnóstico inicial", descripcion: "Realicé el diagnóstico inicial de la población y lo presenté al equipo." },
        { semana: "s3", dias: -58, estado: "aprobada", horas: 40, nota: 3.9, titulo: "Bitácora semana 3 - Intervención", descripcion: "Apliqué las intervenciones planeadas y registré los resultados de cada sesión." },
        { semana: "s4", dias: -38, estado: "aprobada", horas: 40, nota: 4.8, titulo: "Bitácora semana 4 - Cierre y balance", descripcion: "Hice el balance del proceso, con logros, dificultades y aprendizajes." },
    ],
};

const resumen = { usuariosNuevos: 0, grupos: 0, matriculas: 0, actividades: 0, bitacoras: 0, evidencias: 0, retros: 0, calificaciones: 0 };

async function main() {
    console.log(SIMULAR ? "== ENSAYO (no guarda nada) ==" : "== CARGA REAL ==");

    const cn = await neondb.connect();
    const cp = await practicas.connect();
    let hayTransaccion = false;
    let matriculas;
    let idDocente;

    try {
        await cn.query("BEGIN");
        await cp.query("BEGIN");
        hayTransaccion = true;

        // 1) Usuarios de prueba que ya deben existir.
        const pruebas = await cn.query(
            "SELECT id_usuario, email FROM usuario WHERE email IN ('prueba.estudiante@udi.edu.co','prueba.docente@udi.edu.co')"
        );
        const idPorEmail = Object.fromEntries(pruebas.rows.map((r) => [r.email, r.id_usuario]));
        const idPrueba = idPorEmail["prueba.estudiante@udi.edu.co"];
        idDocente = idPorEmail["prueba.docente@udi.edu.co"];
        if (!idPrueba || !idDocente) throw new Error("Faltan los usuarios prueba.estudiante y/o prueba.docente en neondb.");

        const cupo = await cp.query("SELECT 1 FROM docente_cupo WHERE id_docente = $1", [idDocente]);
        if (cupo.rows.length === 0) {
            await cp.query("INSERT INTO docente_cupo (id_docente, cupo_maximo, activo) VALUES ($1, 8, true)", [idDocente]);
        }

        // 2) Estudiantes demo (neondb): usuario + fila de estudiante.
        const idDemo = {};
        for (const e of ESTUDIANTES_DEMO) {
            let u = await cn.query("SELECT id_usuario FROM usuario WHERE email = $1", [e.email]);
            if (u.rows.length === 0) {
                u = await cn.query(
                    `INSERT INTO usuario (nombre, apellido, email, google_sub, rol)
                     VALUES ($1, $2, $3, $4, 'ESTUDIANTE') RETURNING id_usuario`,
                    [e.nombre, e.apellido, e.email, `demo-${e.clave}`]
                );
                await cn.query(
                    "INSERT INTO estudiante (id_usuario, programa, semestre) VALUES ($1, $2, $3)",
                    [u.rows[0].id_usuario, e.programa, e.semestre]
                );
                resumen.usuariosNuevos++;
            }
            idDemo[e.clave] = u.rows[0].id_usuario;
        }

        // 3) Verifica que lo que se va a reutilizar exista.
        const base = await cp.query(
            `SELECT (SELECT COUNT(*) FROM grupo_practica WHERE id_grupo = $1 AND convenio_id = 2) AS grupo,
                    (SELECT COUNT(*) FROM plaza WHERE id_plaza = $2 AND convenio_id = 2) AS plaza_hospital,
                    (SELECT COUNT(*) FROM plaza WHERE id_plaza = $3 AND convenio_id = $4) AS plaza_udi`,
            [GRUPO_HOSPITAL, PLAZA_HOSPITAL, PLAZA_UDI, CONVENIO_UDI]
        );
        const b = base.rows[0];
        if (Number(b.grupo) !== 1 || Number(b.plaza_hospital) !== 1 || Number(b.plaza_udi) !== 1) {
            throw new Error("No se encontró el grupo 2 / plaza 1 / plaza 5 esperados en ms_practicas. Revisa esquemas.txt.");
        }

        // 4) Grupo nuevo del convenio UDI.
        let g = await cp.query("SELECT id_grupo FROM grupo_practica WHERE nombre = $1", [NOMBRE_GRUPO_UDI]);
        if (g.rows.length === 0) {
            const n = await cp.query("SELECT obtener_siguiente_numero_grupo($1, $2) AS n", [TIPO_PRACTICA, NIVEL_PRACTICA]);
            g = await cp.query(
                `INSERT INTO grupo_practica (tipo_practica_id, nivel_practica_id, numero_grupo, nombre, convenio_id)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id_grupo`,
                [TIPO_PRACTICA, NIVEL_PRACTICA, n.rows[0].n, NOMBRE_GRUPO_UDI, CONVENIO_UDI]
            );
            resumen.grupos++;
        }
        const grupoUdi = g.rows[0].id_grupo;

        // 5) Matrículas: grupo + asignación de plaza + docente asesor.
        matriculas = [
            { clave: "prueba", est: idPrueba, grupo: GRUPO_HOSPITAL, plaza: PLAZA_HOSPITAL, inicio: -35, fin: 55, estado: "en_curso", docente: idDocente },
            { clave: "camila", est: idDemo.camila, grupo: GRUPO_HOSPITAL, plaza: PLAZA_HOSPITAL, inicio: -35, fin: 55, estado: "en_curso", docente: idDocente },
            { clave: "daniel", est: idDemo.daniel, grupo: grupoUdi, plaza: PLAZA_UDI, inicio: -120, fin: -10, estado: "finalizada", docente: idDocente },
            { clave: "valentina", est: idDemo.valentina, grupo: grupoUdi, plaza: PLAZA_UDI, inicio: 7, fin: 97, estado: "pendiente", docente: null },
        ];
        for (const m of matriculas) {
            await cp.query(
                "INSERT INTO grupo_estudiante (id_grupo, id_estudiante) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [m.grupo, m.est]
            );
            const ya = await cp.query(
                "SELECT id_asignacion FROM asignacion_plaza WHERE id_estudiante = $1 AND id_grupo = $2 ORDER BY id_asignacion DESC LIMIT 1",
                [m.est, m.grupo]
            );
            if (ya.rows.length > 0) {
                m.asignacion = ya.rows[0].id_asignacion;
            } else {
                const a = await cp.query(
                    `INSERT INTO asignacion_plaza (id_grupo, id_estudiante, plaza_id, fecha_inicio, fecha_fin, estado, horas_requeridas)
                     VALUES ($1, $2, $3, $4, $5, $6, 160) RETURNING id_asignacion`,
                    [m.grupo, m.est, m.plaza, fechaISO(m.inicio), fechaISO(m.fin), m.estado]
                );
                m.asignacion = a.rows[0].id_asignacion;
                resumen.matriculas++;
            }
            if (m.docente) {
                const d = await cp.query(
                    "SELECT 1 FROM asignacion_docente WHERE id_estudiante = $1 AND id_docente = $2 AND estado = 'ACTIVO'",
                    [m.est, m.docente]
                );
                if (d.rows.length === 0) {
                    await cp.query(
                        "INSERT INTO asignacion_docente (id_estudiante, id_docente, estado) VALUES ($1, $2, 'ACTIVO')",
                        [m.est, m.docente]
                    );
                }
            }
        }

        if (SIMULAR) {
            await cn.query("ROLLBACK");
            await cp.query("ROLLBACK");
            hayTransaccion = false;
            const totalBitacoras = Object.values(BITACORAS).reduce((s, l) => s + l.length, 0);
            console.log("Postgres: todos los inserts funcionaron y se revirtieron (no quedó nada guardado).");
            console.log(`Resumen que se crearía: ${resumen.usuariosNuevos} usuarios, ${resumen.grupos} grupo, ${resumen.matriculas} matrículas.`);
            console.log(`MongoDB (no se toca en el ensayo): ${ACTIVIDADES_HOSPITAL.length + ACTIVIDADES_UDI.length} actividades y ${totalBitacoras} bitácoras con sus evidencias y retroalimentación.`);
            return;
        }

        await cn.query("COMMIT");
        await cp.query("COMMIT");
        hayTransaccion = false;
        console.log(`Postgres guardado: ${resumen.usuariosNuevos} usuarios, ${resumen.grupos} grupo, ${resumen.matriculas} matrículas.`);
    } catch (error) {
        if (hayTransaccion) {
            await cn.query("ROLLBACK").catch(() => {});
            await cp.query("ROLLBACK").catch(() => {});
            console.error("Postgres revertido: no se guardó nada.");
        }
        throw error;
    } finally {
        cn.release();
        cp.release();
    }

    // 6) MongoDB: actividades, bitácoras, evidencias y retroalimentación.
    await conectarMongo();
    const db = getDb();

    async function actividad(grupoId, a) {
        const existente = await db.collection("actividad").findOne({ grupo_id: grupoId, titulo: a.titulo });
        if (existente) return existente._id;
        const r = await db.collection("actividad").insertOne({
            grupo_id: grupoId, titulo: a.titulo, descripcion: a.descripcion,
            fecha_limite: limiteMongo(a.limite), estado: a.estado,
            creada_por: idDocente, fecha_creacion: fechaMongo(a.limite - 14),
        });
        resumen.actividades++;
        return r.insertedId;
    }

    const idsActividad = {}; // `${grupo}:${semana}` -> ObjectId
    const grupoUdi = matriculas.find((m) => m.clave === "daniel").grupo;
    for (const a of ACTIVIDADES_HOSPITAL) idsActividad[`${GRUPO_HOSPITAL}:${a.clave}`] = await actividad(GRUPO_HOSPITAL, a);
    for (const a of ACTIVIDADES_UDI) idsActividad[`${grupoUdi}:${a.clave}`] = await actividad(grupoUdi, a);

    const aprobadas = []; // para las calificaciones de Postgres
    for (const m of matriculas) {
        for (const [i, b] of (BITACORAS[m.clave] || []).entries()) {
            let doc = await db.collection("bitacora").findOne({ estudiante_id: m.est, titulo: b.titulo });
            if (!doc) {
                const nueva = {
                    actividad_id: idsActividad[`${m.grupo}:${b.semana}`],
                    id_asignacion: m.asignacion, estudiante_id: m.est, titulo: b.titulo,
                    fecha: fechaMongo(b.dias), descripcion: b.descripcion,
                    horas_registradas: b.horas, estado: b.estado, motivo_correccion: b.motivo || null,
                };
                const r = await db.collection("bitacora").insertOne(nueva);
                doc = { _id: r.insertedId, ...nueva };
                resumen.bitacoras++;

                if (b.estado === "aprobada") {
                    await db.collection("evidencia").insertOne({
                        bitacora_id: doc._id, tipo: "link_drive",
                        url_archivo: `https://example.com/evidencias/demo-${m.clave}-${b.semana}`,
                        formato: null, tamano_bytes: 1, fecha_carga: fechaMongo(b.dias),
                    });
                    resumen.evidencias++;
                    await db.collection("retroalimentacion").insertOne({
                        bitacora_id: doc._id, estudiante_id: m.est, docente_id: idDocente,
                        texto: RETRO[i % RETRO.length], fecha: fechaMongo(b.dias + 2),
                    });
                    resumen.retros++;
                }
            }
            if (b.estado === "aprobada") aprobadas.push({ doc, asignacion: m.asignacion, nota: b.nota, dias: b.dias });
        }
    }

    // 7) Calificaciones en Postgres (ms_practicas): una por bitácora aprobada + evaluación final de Daniel.
    for (const a of aprobadas) {
        const r = await practicas.query(
            `INSERT INTO calificacion_bitacora (bitacora_id, id_asignacion, docente_id, nota, observaciones, fecha_registro)
             VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (bitacora_id) DO NOTHING`,
            [String(a.doc._id), a.asignacion, idDocente, a.nota, null, `${fechaISO(a.dias + 2)} 10:00:00`]
        );
        resumen.calificaciones += r.rowCount;
    }
    const daniel = matriculas.find((m) => m.clave === "daniel");
    await practicas.query(
        `INSERT INTO calificacion_evaluacion (id_asignacion, docente_id, nota, observaciones, fecha_evaluacion)
         VALUES ($1, $2, 4.4, 'Buen desempeño durante toda la práctica.', $3) ON CONFLICT (id_asignacion) DO NOTHING`,
        [daniel.asignacion, idDocente, `${fechaISO(-9)} 10:00:00`]
    );

    console.log("MongoDB y calificaciones guardados:", JSON.stringify(resumen));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("ERROR:", error.message);
        process.exit(1);
    });
