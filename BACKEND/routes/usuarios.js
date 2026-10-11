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

module.exports = router;