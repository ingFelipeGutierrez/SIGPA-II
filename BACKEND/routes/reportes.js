const express = require("express");
const router = express.Router();
const practicas = require("../db/practicas");
const neondb = require("../db/neondb");
const { getDb } = require("../db/mongo");

// Reporte: Estado de los convenios
router.get("/convenios", async (req, res) => {
    try {
        const resultado = await practicas.query(`
            SELECT
                c.id_convenio,
                i.nombre AS institucion,
                c.fecha_inicio,
                c.fecha_fin,
                p.id_plaza,
                p.capacidad
            FROM convenio c
            JOIN institucion_receptora i ON c.institucion_id = i.id_institucion
            LEFT JOIN plaza p ON p.convenio_id = c.id_convenio
            ORDER BY i.nombre
        `);

        const ocupados = await practicas.query(`
            SELECT plaza_id, COUNT(*) AS ocupados
            FROM asignacion_plaza
            WHERE estado NOT IN ('rechazada', 'cambiada')
            GROUP BY plaza_id
        `);
        const mapaOcupados = {};
        ocupados.rows.forEach(o => { mapaOcupados[o.plaza_id] = parseInt(o.ocupados); });

        const convenios = {};
        for (const fila of resultado.rows) {
            const key = fila.id_convenio;
            if (!convenios[key]) {
                const hoy = new Date();
                const fin = new Date(fila.fecha_fin);
                const diasRestantes = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
                let estadoVigencia;
                if (diasRestantes < 0) estadoVigencia = "Vencido";
                else if (diasRestantes <= 60) estadoVigencia = "Próximo a vencer";
                else estadoVigencia = "Vigente";

                convenios[key] = {
                    id_convenio: fila.id_convenio,
                    institucion: fila.institucion,
                    fecha_inicio: fila.fecha_inicio,
                    fecha_fin: fila.fecha_fin,
                    dias_restantes: diasRestantes,
                    estado_vigencia: estadoVigencia,
                    cupos_totales: 0,
                    cupos_ocupados: 0
                };
            }
            if (fila.id_plaza) {
                convenios[key].cupos_totales += fila.capacidad;
                convenios[key].cupos_ocupados += mapaOcupados[fila.id_plaza] || 0;
            }
        }

        const listado = Object.values(convenios);

        const indicadores = {
            vigentes: listado.filter(c => c.estado_vigencia === "Vigente").length,
            proximos_a_vencer: listado.filter(c => c.estado_vigencia === "Próximo a vencer").length,
            vencidos: listado.filter(c => c.estado_vigencia === "Vencido").length
        };

        res.json({ indicadores, convenios: listado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar el reporte de convenios" });
    }
});

// Reporte: Supervisar Cumplimiento de Horas
router.get("/horas", async (req, res) => {
    try {
        // 1) Todo lo que vive en ms_practicas
        const asignaciones = await practicas.query(`
            SELECT
                ap.id_asignacion,
                ap.id_estudiante,
                i.nombre AS institucion,
                ap.horas_requeridas
            FROM asignacion_plaza ap
            JOIN plaza p ON p.id_plaza = ap.plaza_id
            JOIN institucion_receptora i ON i.id_institucion = p.institucion_id
            WHERE ap.fecha_inicio <= NOW()
              AND ap.estado NOT IN ('aprobada', 'rechazada')
            ORDER BY ap.id_asignacion
        `);

        const asignacionesDocente = await practicas.query(`
            SELECT id_estudiante, id_docente FROM asignacion_docente WHERE estado = 'ACTIVO'
        `);
        const mapaDocentePorEstudiante = {};
        asignacionesDocente.rows.forEach(d => { mapaDocentePorEstudiante[d.id_estudiante] = d.id_docente; });

        // 2) Juntamos los ids de usuario que necesitamos (estudiantes + docentes) y los traemos de neondb en UNA sola consulta
        const idsEstudiantes = asignaciones.rows.map(a => a.id_estudiante);
        const idsDocentes = Object.values(mapaDocentePorEstudiante);
        const idsUsuarios = [...new Set([...idsEstudiantes, ...idsDocentes])];

        const usuarios = idsUsuarios.length
            ? await neondb.query(`SELECT id_usuario, nombre, apellido FROM usuario WHERE id_usuario = ANY($1)`, [idsUsuarios])
            : { rows: [] };
        const mapaUsuarios = {};
        usuarios.rows.forEach(u => { mapaUsuarios[u.id_usuario] = `${u.nombre} ${u.apellido}`; });

        // 3) Horas cumplidas, desde MongoDB
        const db = getDb();
        const sumas = await db.collection("bitacora").aggregate([
            { $match: { estado: "aprobada" } },
            { $group: { _id: "$id_asignacion", horas_cumplidas: { $sum: "$horas_registradas" } } }
        ]).toArray();
        const mapaHoras = {};
        sumas.forEach(s => { mapaHoras[s._id] = s.horas_cumplidas || 0; });

        // 4) Armamos el resultado final cruzando las 3 fuentes en JavaScript
        const estudiantes = asignaciones.rows.map(fila => {
            const cumplidas = mapaHoras[fila.id_asignacion] || 0;
            const requeridas = fila.horas_requeridas || 160;
            const porcentaje = requeridas > 0 ? Math.round((cumplidas / requeridas) * 100) : 0;
            let nivel;
            if (porcentaje < 50) nivel = "Bajo";
            else if (porcentaje < 80) nivel = "Medio";
            else nivel = "Alto";

            const idDocente = mapaDocentePorEstudiante[fila.id_estudiante];

            return {
                id_asignacion: fila.id_asignacion,
                estudiante: mapaUsuarios[fila.id_estudiante] || "Desconocido",
                institucion: fila.institucion,
                docente_asesor: idDocente ? (mapaUsuarios[idDocente] || null) : null,
                horas_cumplidas: cumplidas,
                horas_requeridas: requeridas,
                porcentaje,
                nivel
            };
        });

        estudiantes.sort((a, b) => a.porcentaje - b.porcentaje);

        const indicadores = {
            estudiantes_en_practica: estudiantes.length,
            cumplimiento_promedio: estudiantes.length
                ? Math.round(estudiantes.reduce((acc, e) => acc + e.porcentaje, 0) / estudiantes.length)
                : 0,
            con_bajo_cumplimiento: estudiantes.filter(e => e.nivel === "Bajo").length
        };

        res.json({ indicadores, estudiantes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar el reporte de cumplimiento de horas" });
    }
});

// Helper: valida ?fecha_inicial=YYYY-MM-DD&fecha_final=YYYY-MM-DD en la query
function validarRangoFechas(req, res) {
    const { fecha_inicial, fecha_final } = req.query;
    if (!fecha_inicial || !fecha_final) {
        res.status(400).json({ error: "Se requieren fecha_inicial y fecha_final (formato YYYY-MM-DD)" });
        return null;
    }
    const inicio = new Date(fecha_inicial);
    const fin = new Date(fecha_final);
    if (isNaN(inicio) || isNaN(fin)) {
        res.status(400).json({ error: "fecha_inicial o fecha_final no son fechas válidas" });
        return null;
    }
    if (fin < inicio) {
        res.status(400).json({ error: "fecha_final no puede ser anterior a fecha_inicial" });
        return null;
    }
    return { inicio, fin };
}

// Reporte: Cumplimiento de horas por institución
router.get("/horas-institucion", async (req, res) => {
    try {
        const rango = validarRangoFechas(req, res);
        if (!rango) return;
        const { inicio, fin } = rango;

        const asignaciones = await practicas.query(`
            SELECT ap.id_asignacion, i.nombre AS institucion, ap.horas_requeridas
            FROM asignacion_plaza ap
            JOIN plaza p ON p.id_plaza = ap.plaza_id
            JOIN institucion_receptora i ON i.id_institucion = p.institucion_id
            WHERE ap.fecha_inicio BETWEEN $1 AND $2
        `, [inicio, fin]);

        const db = getDb();
        const sumas = await db.collection("bitacora").aggregate([
            { $match: { estado: "aprobada" } },
            { $group: { _id: "$id_asignacion", horas_cumplidas: { $sum: "$horas_registradas" } } }
        ]).toArray();
        const mapaHoras = {};
        sumas.forEach(s => { mapaHoras[s._id] = s.horas_cumplidas || 0; });

        const porInstitucion = {};
        asignaciones.rows.forEach(fila => {
            const cumplidas = mapaHoras[fila.id_asignacion] || 0;
            const requeridas = fila.horas_requeridas || 160;
            const porcentaje = requeridas > 0 ? Math.round((cumplidas / requeridas) * 100) : 0;

            if (!porInstitucion[fila.institucion]) {
                porInstitucion[fila.institucion] = { institucion: fila.institucion, estudiantes: 0, suma_porcentajes: 0, bajo: 0, medio: 0, alto: 0 };
            }
            const grupo = porInstitucion[fila.institucion];
            grupo.estudiantes += 1;
            grupo.suma_porcentajes += porcentaje;
            if (porcentaje < 50) grupo.bajo += 1;
            else if (porcentaje < 80) grupo.medio += 1;
            else grupo.alto += 1;
        });

        const instituciones = Object.values(porInstitucion).map(g => ({
            institucion: g.institucion,
            estudiantes_en_practica: g.estudiantes,
            cumplimiento_promedio: g.estudiantes ? Math.round(g.suma_porcentajes / g.estudiantes) : 0,
            bajo: g.bajo,
            medio: g.medio,
            alto: g.alto
        })).sort((a, b) => a.cumplimiento_promedio - b.cumplimiento_promedio);

        res.json({ periodo: req.query, instituciones });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar el reporte de horas por institución" });
    }
});

module.exports = router;