const express = require("express");
const router = express.Router();
const neondb = require("../db/neondb");

// Crear una solicitud de registro (cuando alguien hace login con Google y no existe como usuario)
router.post("/", async (req, res) => {
    try {
        const { nombre, apellido, email, google_sub, rol_solicitado, datos_rol } = req.body;

        const existente = await neondb.query("SELECT id_usuario FROM usuario WHERE email = $1", [email]);
        if (existente.rows.length > 0) {
            return res.status(400).json({ error: "Ya existe un usuario registrado con ese correo" });
        }

        const pendiente = await neondb.query(
            "SELECT id_solicitud FROM solicitud_registro WHERE email = $1 AND estado = 'PENDIENTE'",
            [email]
        );
        if (pendiente.rows.length > 0) {
            return res.status(400).json({ error: "Ya existe una solicitud pendiente con ese correo" });
        }

        const resultado = await neondb.query(
            `INSERT INTO solicitud_registro (nombre, apellido, email, google_sub, rol_solicitado, datos_rol, estado, fecha_solicitud)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', NOW()) RETURNING *`,
            [nombre, apellido, email, google_sub, rol_solicitado, datos_rol || null]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la solicitud de registro" });
    }
});

// Listar solicitudes (opcionalmente filtradas por estado: ?estado=PENDIENTE)
router.get("/", async (req, res) => {
    try {
        const { estado } = req.query;
        const resultado = estado
            ? await neondb.query("SELECT * FROM solicitud_registro WHERE estado = $1 ORDER BY fecha_solicitud DESC", [estado])
            : await neondb.query("SELECT * FROM solicitud_registro ORDER BY fecha_solicitud DESC");
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las solicitudes" });
    }
});

// Traer una solicitud individual
router.get("/:id", async (req, res) => {
    try {
        const resultado = await neondb.query("SELECT * FROM solicitud_registro WHERE id_solicitud = $1", [req.params.id]);
        if (resultado.rows.length === 0) return res.status(404).json({ error: "Solicitud no encontrada" });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar la solicitud" });
    }
});

// Aprobar: crea el usuario real (+ su rol) y marca la solicitud como APROBADA
router.put("/:id/aprobar", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        const solicitudActual = await cliente.query(
            "SELECT * FROM solicitud_registro WHERE id_solicitud = $1",
            [req.params.id]
        );
        if (solicitudActual.rows.length === 0) return res.status(404).json({ error: "Solicitud no encontrada" });
        const solicitud = solicitudActual.rows[0];

        if (solicitud.estado !== "PENDIENTE") {
            return res.status(400).json({ error: "Esta solicitud ya fue procesada" });
        }

        const datos = solicitud.datos_rol || {};

        await cliente.query("BEGIN");

        const u = await cliente.query(
            `INSERT INTO usuario (nombre, apellido, email, google_sub, rol)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [solicitud.nombre, solicitud.apellido, solicitud.email, solicitud.google_sub, solicitud.rol_solicitado]
        );
        const idUsuario = u.rows[0].id_usuario;

        if (solicitud.rol_solicitado === "ESTUDIANTE") {
            await cliente.query(
                "INSERT INTO estudiante (id_usuario, programa, semestre) VALUES ($1, $2, $3)",
                [idUsuario, datos.programa || null, datos.semestre || null]
            );
        } else if (solicitud.rol_solicitado === "DOCENTE") {
            await cliente.query(
                "INSERT INTO docente_asesor (id_usuario, especialidad) VALUES ($1, $2)",
                [idUsuario, datos.especialidad || null]
            );
        }

        const s = await cliente.query(
            "UPDATE solicitud_registro SET estado = 'APROBADA', fecha_respuesta = NOW() WHERE id_solicitud = $1 RETURNING *",
            [req.params.id]
        );

        await cliente.query("COMMIT");
        res.json({ usuario: u.rows[0], solicitud: s.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al aprobar la solicitud" });
    } finally {
        cliente.release();
    }
});

// Rechazar una solicitud
router.put("/:id/rechazar", async (req, res) => {
    try {
        const { motivo } = req.body;
        const resultado = await neondb.query(
            `UPDATE solicitud_registro
             SET estado = 'RECHAZADA', motivo_rechazo = $1, fecha_respuesta = NOW()
             WHERE id_solicitud = $2 AND estado = 'PENDIENTE' RETURNING *`,
            [motivo || null, req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(400).json({ error: "La solicitud no existe o ya fue procesada" });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al rechazar la solicitud" });
    }
});

module.exports = router;