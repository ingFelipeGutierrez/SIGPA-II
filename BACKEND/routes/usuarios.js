const express = require("express");
const router = express.Router();
const neondb = require("../db/neondb");

// Traer todos los usuarios
router.get("/", async (req, res) => {
    try {
        const resultado = await neondb.query(
            "SELECT id_usuario, nombre, apellido, email, rol FROM usuario ORDER BY id_usuario"
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los usuarios" });
    }
});

// Traer estudiantes (con sus datos de usuario)
router.get("/estudiantes", async (req, res) => {
    try {
        const resultado = await neondb.query(`
            SELECT u.id_usuario, u.nombre, u.apellido, u.email, e.programa, e.semestre
            FROM usuario u
            JOIN estudiante e ON u.id_usuario = e.id_usuario
            ORDER BY u.id_usuario
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los estudiantes" });
    }
});

// Traer docentes asesores (con sus datos de usuario)
router.get("/docentes", async (req, res) => {
    try {
        const resultado = await neondb.query(`
            SELECT u.id_usuario, u.nombre, u.apellido, u.email, d.especialidad
            FROM usuario u
            JOIN docente_asesor d ON u.id_usuario = d.id_usuario
            ORDER BY u.id_usuario
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los docentes" });
    }
});

// Traer todos los docentes (combinado)
router.get("/docentes-completos", async (req, res) => {
    try {
        const resultado = await neondb.query(`
            SELECT u.id_usuario, u.nombre, u.apellido, u.email, d.especialidad
            FROM usuario u JOIN docente_asesor d ON u.id_usuario = d.id_usuario
            ORDER BY u.id_usuario
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los docentes" });
    }
});

// Crear un docente (usuario + docente_asesor)
router.post("/docentes-completos", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        const { nombre, apellido, email, especialidad } = req.body;
        const googleSub = "prueba-" + Date.now();

        await cliente.query("BEGIN");
        const u = await cliente.query(
            `INSERT INTO usuario (nombre, apellido, email, google_sub, rol)
             VALUES ($1, $2, $3, $4, 'DOCENTE') RETURNING *`,
            [nombre, apellido, email, googleSub]
        );
        const d = await cliente.query(
            `INSERT INTO docente_asesor (id_usuario, especialidad) VALUES ($1, $2) RETURNING *`,
            [u.rows[0].id_usuario, especialidad]
        );
        await cliente.query("COMMIT");
        res.status(201).json({ usuario: u.rows[0], docente: d.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al crear el docente" });
    } finally {
        cliente.release();
    }
});

// Actualizar un docente
router.put("/docentes-completos/:id", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        const { nombre, apellido, email, especialidad } = req.body;
        await cliente.query("BEGIN");
        const u = await cliente.query(
            `UPDATE usuario SET nombre=$1, apellido=$2, email=$3 WHERE id_usuario=$4 RETURNING *`,
            [nombre, apellido, email, req.params.id]
        );
        const d = await cliente.query(
            `UPDATE docente_asesor SET especialidad=$1 WHERE id_usuario=$2 RETURNING *`,
            [especialidad, req.params.id]
        );
        if (u.rows.length === 0) { await cliente.query("ROLLBACK"); return res.status(404).json({ error: "No encontrado" }); }
        await cliente.query("COMMIT");
        res.json({ usuario: u.rows[0], docente: d.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el docente" });
    } finally {
        cliente.release();
    }
});

// Eliminar un docente
router.delete("/docentes-completos/:id", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        await cliente.query("BEGIN");
        await cliente.query("DELETE FROM docente_asesor WHERE id_usuario = $1", [req.params.id]);
        const resultado = await cliente.query(
            "DELETE FROM usuario WHERE id_usuario = $1 RETURNING *",
            [req.params.id]
        );
        if (resultado.rows.length === 0) { await cliente.query("ROLLBACK"); return res.status(404).json({ error: "No encontrado" }); }
        await cliente.query("COMMIT");
        res.json({ mensaje: "Docente eliminado" });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el docente (puede tener prácticas o grupos asociados)" });
    } finally {
        cliente.release();
    }
});

// Traer todos los estudiantes (combinado)
router.get("/estudiantes-completos", async (req, res) => {
    try {
        const resultado = await neondb.query(`
            SELECT u.id_usuario, u.nombre, u.apellido, u.email, e.programa, e.semestre
            FROM usuario u JOIN estudiante e ON u.id_usuario = e.id_usuario
            ORDER BY u.id_usuario
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los estudiantes" });
    }
});

// Crear un estudiante
router.post("/estudiantes-completos", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        const { nombre, apellido, email, programa, semestre } = req.body;
        const googleSub = "prueba-" + Date.now();

        await cliente.query("BEGIN");
        const u = await cliente.query(
            `INSERT INTO usuario (nombre, apellido, email, google_sub, rol)
             VALUES ($1, $2, $3, $4, 'ESTUDIANTE') RETURNING *`,
            [nombre, apellido, email, googleSub]
        );
        const e = await cliente.query(
            `INSERT INTO estudiante (id_usuario, programa, semestre) VALUES ($1, $2, $3) RETURNING *`,
            [u.rows[0].id_usuario, programa, semestre]
        );
        await cliente.query("COMMIT");
        res.status(201).json({ usuario: u.rows[0], estudiante: e.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al crear el estudiante" });
    } finally {
        cliente.release();
    }
});

// Actualizar un estudiante
router.put("/estudiantes-completos/:id", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        const { nombre, apellido, email, programa, semestre } = req.body;
        await cliente.query("BEGIN");
        const u = await cliente.query(
            `UPDATE usuario SET nombre=$1, apellido=$2, email=$3 WHERE id_usuario=$4 RETURNING *`,
            [nombre, apellido, email, req.params.id]
        );
        const e = await cliente.query(
            `UPDATE estudiante SET programa=$1, semestre=$2 WHERE id_usuario=$3 RETURNING *`,
            [programa, semestre, req.params.id]
        );
        if (u.rows.length === 0) { await cliente.query("ROLLBACK"); return res.status(404).json({ error: "No encontrado" }); }
        await cliente.query("COMMIT");
        res.json({ usuario: u.rows[0], estudiante: e.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el estudiante" });
    } finally {
        cliente.release();
    }
});

// Eliminar un estudiante
router.delete("/estudiantes-completos/:id", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        await cliente.query("BEGIN");
        await cliente.query("DELETE FROM estudiante WHERE id_usuario = $1", [req.params.id]);
        const resultado = await cliente.query(
            "DELETE FROM usuario WHERE id_usuario = $1 RETURNING *",
            [req.params.id]
        );
        if (resultado.rows.length === 0) { await cliente.query("ROLLBACK"); return res.status(404).json({ error: "No encontrado" }); }
        await cliente.query("COMMIT");
        res.json({ mensaje: "Estudiante eliminado" });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el estudiante" });
    } finally {
        cliente.release();
    }
});

// ===== DIRECTOR =====

router.get("/directores-completos", async (req, res) => {
    try {
        const resultado = await neondb.query(`
            SELECT u.id_usuario, u.nombre, u.apellido, u.email
            FROM usuario u JOIN director d ON u.id_usuario = d.id_usuario
            ORDER BY u.id_usuario
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los directores" });
    }
});

router.post("/directores-completos", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        const { nombre, apellido, email } = req.body;
        const googleSub = "prueba-" + Date.now();

        await cliente.query("BEGIN");
        const u = await cliente.query(
            `INSERT INTO usuario (nombre, apellido, email, google_sub, rol)
             VALUES ($1, $2, $3, $4, 'DIRECTOR') RETURNING *`,
            [nombre, apellido, email, googleSub]
        );
        const d = await cliente.query(
            `INSERT INTO director (id_usuario) VALUES ($1) RETURNING *`,
            [u.rows[0].id_usuario]
        );
        await cliente.query("COMMIT");
        res.status(201).json({ usuario: u.rows[0], director: d.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al crear el director" });
    } finally {
        cliente.release();
    }
});

router.put("/directores-completos/:id", async (req, res) => {
    try {
        const { nombre, apellido, email } = req.body;
        const u = await neondb.query(
            `UPDATE usuario SET nombre=$1, apellido=$2, email=$3 WHERE id_usuario=$4 RETURNING *`,
            [nombre, apellido, email, req.params.id]
        );
        if (u.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        res.json(u.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el director" });
    }
});

router.delete("/directores-completos/:id", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        await cliente.query("BEGIN");
        await cliente.query("DELETE FROM director WHERE id_usuario = $1", [req.params.id]);
        const resultado = await cliente.query(
            "DELETE FROM usuario WHERE id_usuario = $1 RETURNING *",
            [req.params.id]
        );
        if (resultado.rows.length === 0) { await cliente.query("ROLLBACK"); return res.status(404).json({ error: "No encontrado" }); }
        await cliente.query("COMMIT");
        res.json({ mensaje: "Director eliminado" });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el director" });
    } finally {
        cliente.release();
    }
});

// ===== ADMIN SISTEMA =====

router.get("/admins-completos", async (req, res) => {
    try {
        const resultado = await neondb.query(`
            SELECT u.id_usuario, u.nombre, u.apellido, u.email
            FROM usuario u JOIN admin_sistema a ON u.id_usuario = a.id_usuario
            ORDER BY u.id_usuario
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar los administradores" });
    }
});

router.post("/admins-completos", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        const { nombre, apellido, email } = req.body;
        const googleSub = "prueba-" + Date.now();

        await cliente.query("BEGIN");
        const u = await cliente.query(
            `INSERT INTO usuario (nombre, apellido, email, google_sub, rol)
             VALUES ($1, $2, $3, $4, 'ADMIN_SISTEMA') RETURNING *`,
            [nombre, apellido, email, googleSub]
        );
        const a = await cliente.query(
            `INSERT INTO admin_sistema (id_usuario) VALUES ($1) RETURNING *`,
            [u.rows[0].id_usuario]
        );
        await cliente.query("COMMIT");
        res.status(201).json({ usuario: u.rows[0], admin: a.rows[0] });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al crear el administrador" });
    } finally {
        cliente.release();
    }
});

router.put("/admins-completos/:id", async (req, res) => {
    try {
        const { nombre, apellido, email } = req.body;
        const u = await neondb.query(
            `UPDATE usuario SET nombre=$1, apellido=$2, email=$3 WHERE id_usuario=$4 RETURNING *`,
            [nombre, apellido, email, req.params.id]
        );
        if (u.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        res.json(u.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el administrador" });
    }
});

router.delete("/admins-completos/:id", async (req, res) => {
    const cliente = await neondb.connect();
    try {
        await cliente.query("BEGIN");
        await cliente.query("DELETE FROM admin_sistema WHERE id_usuario = $1", [req.params.id]);
        const resultado = await cliente.query(
            "DELETE FROM usuario WHERE id_usuario = $1 RETURNING *",
            [req.params.id]
        );
        if (resultado.rows.length === 0) { await cliente.query("ROLLBACK"); return res.status(404).json({ error: "No encontrado" }); }
        await cliente.query("COMMIT");
        res.json({ mensaje: "Administrador eliminado" });
    } catch (error) {
        await cliente.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el administrador" });
    } finally {
        cliente.release();
    }
});

module.exports = router;