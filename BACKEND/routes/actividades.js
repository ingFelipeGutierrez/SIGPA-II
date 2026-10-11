const express = require("express");
const router = express.Router();
const { getDb } = require("../db/mongo");

// Crear una actividad
router.post("/", async (req, res) => {
    try {
        const { grupo_id, titulo, descripcion, fecha_limite, creada_por } = req.body;

        const actividad = {
            grupo_id,
            titulo,
            descripcion,
            fecha_limite: new Date(fecha_limite),
            estado: "abierta",
            creada_por,
            fecha_creacion: new Date()
        };

        const db = getDb();
        const resultado = await db.collection("actividad").insertOne(actividad);

        res.status(201).json({ _id: resultado.insertedId, ...actividad });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la actividad" });
    }
});

// Traer actividades de un grupo
router.get("/grupo/:id_grupo", async (req, res) => {
    try {
        const idGrupo = parseInt(req.params.id_grupo);
        const db = getDb();

        const actividades = await db
            .collection("actividad")
            .find({ grupo_id: idGrupo })
            .sort({ fecha_creacion: -1 })
            .toArray();

        res.json(actividades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las actividades" });
    }
});

module.exports = router;