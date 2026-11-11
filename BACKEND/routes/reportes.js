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

module.exports = router;