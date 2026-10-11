const express = require("express");
const router = express.Router();
const practicas = require("../db/practicas");

// Traer convenios
router.get("/convenios", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "SELECT id_convenio, nombre, fecha_inicio, fecha_fin, estado FROM convenio ORDER BY id_convenio"
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los convenios" });
    }
});

// Traer grupos de práctica (con tipo y nivel)
router.get("/grupos", async (req, res) => {
    try {
        const resultado = await practicas.query(`
            SELECT g.id_grupo, g.nombre, g.numero_grupo, g.estado,
                   t.nombre AS tipo_practica, n.nombre AS nivel_practica
            FROM grupo_practica g
            JOIN tipo_practica t ON g.tipo_practica_id = t.id_tipo_practica
            JOIN nivel_practica n ON g.nivel_practica_id = n.id_nivel_practica
            ORDER BY g.id_grupo
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los grupos" });
    }
});

// Crear un convenio nuevo
router.post("/convenios", async (req, res) => {
    try {
        const { institucion_id, nombre, fecha_inicio, fecha_fin } = req.body;

        const resultado = await practicas.query(
            `INSERT INTO convenio (institucion_id, nombre, fecha_inicio, fecha_fin)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [institucion_id, nombre, fecha_inicio, fecha_fin]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear el convenio" });
    }
});

// Crear una institución receptora
router.post("/instituciones", async (req, res) => {
    try {
        const { nombre, nit, direccion, tipo } = req.body;

        const resultado = await practicas.query(
            `INSERT INTO institucion_receptora (nombre, nit, direccion, tipo)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [nombre, nit, direccion, tipo]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la institución" });
    }
});

// Crear tipo de práctica
router.post("/tipos", async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        const resultado = await practicas.query(
            `INSERT INTO tipo_practica (nombre, descripcion)
             VALUES ($1, $2)
             RETURNING *`,
            [nombre, descripcion]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear el tipo de práctica" });
    }
});

// Crear nivel de práctica
router.post("/niveles", async (req, res) => {
    try {
        const { nombre, numero } = req.body;

        const resultado = await practicas.query(
            `INSERT INTO nivel_practica (nombre, numero)
             VALUES ($1, $2)
             RETURNING *`,
            [nombre, numero]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear el nivel de práctica" });
    }
});

// Crear grupo de práctica
router.post("/grupos", async (req, res) => {
    try {
        const { tipo_practica_id, nivel_practica_id, numero_grupo, nombre, convenio_id } = req.body;

        const resultado = await practicas.query(
            `INSERT INTO grupo_practica (tipo_practica_id, nivel_practica_id, numero_grupo, nombre, convenio_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [tipo_practica_id, nivel_practica_id, numero_grupo, nombre, convenio_id]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear el grupo de práctica" });
    }
});

// Traer todos los convenios por id (uno solo)
router.get("/convenios/:id", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "SELECT * FROM convenio WHERE id_convenio = $1",
            [req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Convenio no encontrado" });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar el convenio" });
    }
});

// Actualizar un convenio (Update)
router.put("/convenios/:id", async (req, res) => {
    try {
        const { nombre, fecha_inicio, fecha_fin, estado } = req.body;

        const resultado = await practicas.query(
            `UPDATE convenio
             SET nombre = $1, fecha_inicio = $2, fecha_fin = $3, estado = $4
             WHERE id_convenio = $5
             RETURNING *`,
            [nombre, fecha_inicio, fecha_fin, estado, req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Convenio no encontrado" });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el convenio" });
    }
});

// Eliminar un convenio (Delete)
router.delete("/convenios/:id", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "DELETE FROM convenio WHERE id_convenio = $1 RETURNING *",
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Convenio no encontrado" });
        }
        res.json({ mensaje: "Convenio eliminado", convenio: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el convenio" });
    }
});

// Traer todas las instituciones
router.get("/instituciones", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "SELECT * FROM institucion_receptora ORDER BY id_institucion"
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las instituciones" });
    }
});

// Traer una institución por id
router.get("/instituciones/:id", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "SELECT * FROM institucion_receptora WHERE id_institucion = $1",
            [req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Institución no encontrada" });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar la institución" });
    }
});

// Actualizar una institución
router.put("/instituciones/:id", async (req, res) => {
    try {
        const { nombre, nit, direccion, tipo } = req.body;
        const resultado = await practicas.query(
            `UPDATE institucion_receptora
             SET nombre = $1, nit = $2, direccion = $3, tipo = $4
             WHERE id_institucion = $5
             RETURNING *`,
            [nombre, nit, direccion, tipo, req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Institución no encontrada" });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la institución" });
    }
});

// Eliminar una institución
router.delete("/instituciones/:id", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "DELETE FROM institucion_receptora WHERE id_institucion = $1 RETURNING *",
            [req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Institución no encontrada" });
        }
        res.json({ mensaje: "Institución eliminada", institucion: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la institución" });
    }
});

// Traer instituciones con su convenio más reciente (forma combinada para el frontend)
router.get("/instituciones-completas", async (req, res) => {
    try {
        const resultado = await practicas.query(`
            SELECT i.id_institucion, i.nombre, i.tipo, i.direccion, i.contacto,
                   c.id_convenio, c.fecha_inicio, c.fecha_fin
            FROM institucion_receptora i
            LEFT JOIN LATERAL (
                SELECT * FROM convenio
                WHERE convenio.institucion_id = i.id_institucion
                ORDER BY fecha_inicio DESC LIMIT 1
            ) c ON true
            ORDER BY i.id_institucion
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las instituciones" });
    }
});

// Crear institución + su convenio inicial, en un solo paso
router.post("/instituciones-completas", async (req, res) => {
    const cliente = await practicas.connect();
    try {
        const { nombre, tipo, direccion, contacto, convenioInicio, convenioFin } = req.body;
        const tipoDb = tipo.toUpperCase(); // "Oficial" -> "OFICIAL"
        const nit = "AUTO-" + Date.now(); // placeholder, el formulario no pide NIT

        await cliente.query("BEGIN");

        const inst = await cliente.query(
            `INSERT INTO institucion_receptora (nombre, nit, direccion, tipo, contacto)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nombre, nit, direccion, tipoDb, contacto]
        );

        const conv = await cliente.query(
            `INSERT INTO convenio (institucion_id, nombre, fecha_inicio, fecha_fin)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [inst.rows[0].id_institucion, "Convenio " + nombre, convenioInicio, convenioFin]
        );

        await cliente.query("COMMIT");
        res.status(201).json({ institucion: inst.rows[0], convenio: conv.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al crear la institución" });
    } finally {
        cliente.release();
    }
});

// Renovar el convenio más reciente de una institución
router.put("/instituciones-completas/:id/convenio", async (req, res) => {
    try {
        const { nuevaFin } = req.body;
        const resultado = await practicas.query(
            `UPDATE convenio SET fecha_fin = $1
             WHERE institucion_id = $2
             AND id_convenio = (SELECT id_convenio FROM convenio WHERE institucion_id = $2 ORDER BY fecha_inicio DESC LIMIT 1)
             RETURNING *`,
            [nuevaFin, req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "No se encontró el convenio" });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al renovar el convenio" });
    }
});

// Actualizar un grupo de práctica
router.put("/grupos/:id", async (req, res) => {
    try {
        const { nombre, numero_grupo, estado } = req.body;
        const resultado = await practicas.query(
            `UPDATE grupo_practica SET nombre=$1, numero_grupo=$2, estado=$3
             WHERE id_grupo=$4 RETURNING *`,
            [nombre, numero_grupo, estado, req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el grupo" });
    }
});

// Eliminar un grupo de práctica
router.delete("/grupos/:id", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "DELETE FROM grupo_practica WHERE id_grupo = $1 RETURNING *",
            [req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        res.json({ mensaje: "Grupo eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el grupo (puede tener convenio asociado)" });
    }
});

// Traer plazas (con institución)
router.get("/plazas", async (req, res) => {
    try {
        const resultado = await practicas.query(`
            SELECT p.id_plaza, p.institucion_id, p.convenio_id, p.capacidad, p.estado, p.jornada,
                   i.nombre AS institucion
            FROM plaza p JOIN institucion_receptora i ON p.institucion_id = i.id_institucion
            ORDER BY p.id_plaza
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las plazas" });
    }
});

// Crear plaza (busca el convenio más reciente de la institución automáticamente)
router.post("/plazas", async (req, res) => {
    try {
        const { institucion_id, capacidad, jornada } = req.body;

        const conv = await practicas.query(
            `SELECT id_convenio FROM convenio WHERE institucion_id = $1 ORDER BY fecha_inicio DESC LIMIT 1`,
            [institucion_id]
        );
        if (conv.rows.length === 0) {
            return res.status(400).json({ error: "Esta institución no tiene un convenio registrado" });
        }
        const convenioId = conv.rows[0].id_convenio;

        const resultado = await practicas.query(
            `INSERT INTO plaza (institucion_id, convenio_id, capacidad, jornada)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [institucion_id, convenioId, capacidad, jornada]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la plaza" });
    }
});

// Actualizar estado de una plaza (aprobar/rechazar)
router.put("/plazas/:id", async (req, res) => {
    try {
        const { estado } = req.body;
        const resultado = await practicas.query(
            `UPDATE plaza SET estado = $1 WHERE id_plaza = $2 RETURNING *`,
            [estado, req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la plaza" });
    }
});

// Eliminar plaza
router.delete("/plazas/:id", async (req, res) => {
    try {
        const resultado = await practicas.query("DELETE FROM plaza WHERE id_plaza = $1 RETURNING *", [req.params.id]);
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json({ mensaje: "Plaza eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la plaza (puede tener grupos asociados)" });
    }
});

// Traer cupos de todos los docentes
router.get("/docente-cupo", async (req, res) => {
    try {
        const resultado = await practicas.query("SELECT * FROM docente_cupo ORDER BY id_docente");
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los cupos" });
    }
});

// Crear registro de cupo para un docente
router.post("/docente-cupo", async (req, res) => {
    try {
        const { id_docente, cupo_maximo } = req.body;
        const resultado = await practicas.query(
            `INSERT INTO docente_cupo (id_docente, cupo_maximo) VALUES ($1, $2) RETURNING *`,
            [id_docente, cupo_maximo || 6]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear el cupo (verifica que el docente exista en neondb)" });
    }
});

// Actualizar cupo
router.put("/docente-cupo/:id", async (req, res) => {
    try {
        const { cupo_maximo, activo } = req.body;
        const resultado = await practicas.query(
            `UPDATE docente_cupo SET cupo_maximo = $1, activo = $2 WHERE id_docente = $3 RETURNING *`,
            [cupo_maximo, activo, req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el cupo" });
    }
});

// Eliminar cupo
router.delete("/docente-cupo/:id", async (req, res) => {
    try {
        const resultado = await practicas.query("DELETE FROM docente_cupo WHERE id_docente = $1 RETURNING *", [req.params.id]);
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        res.json({ mensaje: "Cupo eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el cupo" });
    }
});

// Traer asignaciones docente-estudiante (con nombres)
router.get("/asignacion-docente", async (req, res) => {
    try {
        const resultado = await practicas.query(`
            SELECT ad.id_asignacion_docente, ad.id_estudiante, ad.id_docente, ad.estado, ad.fecha_asignacion
            FROM asignacion_docente ad ORDER BY ad.id_asignacion_docente
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las asignaciones de docente" });
    }
});

// Crear asignación (estudiante <-> docente)
router.post("/asignacion-docente", async (req, res) => {
    try {
        const { id_estudiante, id_docente } = req.body;
        const resultado = await practicas.query(
            `INSERT INTO asignacion_docente (id_estudiante, id_docente) VALUES ($1, $2) RETURNING *`,
            [id_estudiante, id_docente]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la asignación (verifica que el docente tenga cupo creado en docente_cupo)" });
    }
});

// Actualizar estado (ACTIVO/INACTIVO)
router.put("/asignacion-docente/:id", async (req, res) => {
    try {
        const { estado } = req.body;
        const resultado = await practicas.query(
            `UPDATE asignacion_docente SET estado = $1 WHERE id_asignacion_docente = $2 RETURNING *`,
            [estado, req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la asignación" });
    }
});

// Eliminar asignación
router.delete("/asignacion-docente/:id", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "DELETE FROM asignacion_docente WHERE id_asignacion_docente = $1 RETURNING *", [req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json({ mensaje: "Asignación eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la asignación" });
    }
});

// Traer asignaciones de grupo
router.get("/grupo-estudiante", async (req, res) => {
    try {
        const resultado = await practicas.query("SELECT * FROM grupo_estudiante ORDER BY id_grupo, id_estudiante");
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar grupo_estudiante" });
    }
});

// Crear asignación de grupo
router.post("/grupo-estudiante", async (req, res) => {
    try {
        const { id_grupo, id_estudiante } = req.body;
        const resultado = await practicas.query(
            `INSERT INTO grupo_estudiante (id_grupo, id_estudiante) VALUES ($1, $2) RETURNING *`,
            [id_grupo, id_estudiante]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la asignación de grupo" });
    }
});

// Actualizar estado
router.put("/grupo-estudiante/:idGrupo/:idEstudiante", async (req, res) => {
    try {
        const { estado } = req.body;
        const resultado = await practicas.query(
            `UPDATE grupo_estudiante SET estado = $1 WHERE id_grupo = $2 AND id_estudiante = $3 RETURNING *`,
            [estado, req.params.idGrupo, req.params.idEstudiante]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar grupo_estudiante" });
    }
});

// Eliminar
router.delete("/grupo-estudiante/:idGrupo/:idEstudiante", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "DELETE FROM grupo_estudiante WHERE id_grupo = $1 AND id_estudiante = $2 RETURNING *",
            [req.params.idGrupo, req.params.idEstudiante]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json({ mensaje: "Asignación de grupo eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar grupo_estudiante" });
    }
});

// Traer asignaciones de plaza
router.get("/asignacion-plaza", async (req, res) => {
    try {
        const resultado = await practicas.query("SELECT * FROM asignacion_plaza ORDER BY id_asignacion");
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las asignaciones de plaza" });
    }
});

// Crear asignación de plaza
router.post("/asignacion-plaza", async (req, res) => {
    try {
        const { id_grupo, id_estudiante, plaza_id, fecha_inicio, fecha_fin, horas_requeridas } = req.body;
        const resultado = await practicas.query(
            `INSERT INTO asignacion_plaza (id_grupo, id_estudiante, plaza_id, fecha_inicio, fecha_fin, horas_requeridas)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id_grupo, id_estudiante, plaza_id, fecha_inicio, fecha_fin || null, horas_requeridas || 160]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la asignación de plaza (verifica que exista grupo_estudiante con ese id_grupo+id_estudiante)" });
    }
});

// Actualizar estado
router.put("/asignacion-plaza/:id", async (req, res) => {
    try {
        const { estado, motivo_rechazo } = req.body;
        const resultado = await practicas.query(
            `UPDATE asignacion_plaza SET estado = $1, motivo_rechazo = $2 WHERE id_asignacion = $3 RETURNING *`,
            [estado, motivo_rechazo || null, req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la asignación de plaza" });
    }
});

// Eliminar
router.delete("/asignacion-plaza/:id", async (req, res) => {
    try {
        const resultado = await practicas.query(
            "DELETE FROM asignacion_plaza WHERE id_asignacion = $1 RETURNING *", [req.params.id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json({ mensaje: "Asignación de plaza eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la asignación de plaza" });
    }
});

module.exports = router;