const express = require("express");
const router = express.Router();
const { getDb } = require("../db/mongo");
const { ObjectId } = require("mongodb");

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

// Traer una sola actividad por id
router.get("/:id", async (req, res) => {
    try {
        const db = getDb();
        const actividad = await db.collection("actividad").findOne({ _id: new ObjectId(req.params.id) });
        if (!actividad) return res.status(404).json({ error: "Actividad no encontrada" });
        res.json(actividad);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar la actividad" });
    }
});

// Actualizar una actividad (editar título/descripción/fecha, o cambiar estado: abierta/cerrada/reabierta)
router.put("/:id", async (req, res) => {
    try {
        const { titulo, descripcion, fecha_limite, estado } = req.body;
        const cambios = {};
        if (titulo !== undefined) cambios.titulo = titulo;
        if (descripcion !== undefined) cambios.descripcion = descripcion;
        if (fecha_limite !== undefined) cambios.fecha_limite = new Date(fecha_limite);
        if (estado !== undefined) cambios.estado = estado;

        const db = getDb();
        const resultado = await db.collection("actividad").findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: cambios },
            { returnDocument: "after" }
        );
        if (!resultado) return res.status(404).json({ error: "Actividad no encontrada" });
        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la actividad" });
    }
});

// Eliminar una actividad
router.delete("/:id", async (req, res) => {
    try {
        const db = getDb();
        const resultado = await db.collection("actividad").deleteOne({ _id: new ObjectId(req.params.id) });
        if (resultado.deletedCount === 0) return res.status(404).json({ error: "Actividad no encontrada" });
        res.json({ mensaje: "Actividad eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la actividad" });
    }
});

module.exports = router;