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

module.exports = router;