const express = require("express");
const router = express.Router();
const { getDb } = require("../db/mongo");
const { ObjectId } = require("mongodb");

// Crear una evidencia (v1 simplificado: solo tipo link_drive)
router.post("/", async (req, res) => {
    try {
        const { bitacora_id, tipo, url_archivo, formato, tamano_bytes } = req.body;

        const doc = {
            bitacora_id: new ObjectId(bitacora_id),
            tipo: tipo || "link_drive",
            url_archivo,
            formato: formato || null,
            tamano_bytes: (tamano_bytes && tamano_bytes >= 1) ? tamano_bytes : 1,
            fecha_carga: new Date()
        };

        const db = getDb();
        const r = await db.collection("evidencia").insertOne(doc);
        res.status(201).json({ _id: r.insertedId, ...doc });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la evidencia" });
    }
});

// Listar las evidencias de una bitácora
router.get("/bitacora/:id", async (req, res) => {
    try {
        const db = getDb();
        const r = await db.collection("evidencia")
            .find({ bitacora_id: new ObjectId(req.params.id) })
            .sort({ fecha_carga: -1 })
            .toArray();
        res.json(r);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar las evidencias" });
    }
});

// Traer una evidencia individual
router.get("/:id", async (req, res) => {
    try {
        const db = getDb();
        const evidencia = await db.collection("evidencia").findOne({ _id: new ObjectId(req.params.id) });
        if (!evidencia) return res.status(404).json({ error: "Evidencia no encontrada" });
        res.json(evidencia);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar la evidencia" });
    }
});

// Eliminar una evidencia
router.delete("/:id", async (req, res) => {
    try {
        const db = getDb();
        const r = await db.collection("evidencia").deleteOne({ _id: new ObjectId(req.params.id) });
        if (r.deletedCount === 0) return res.status(404).json({ error: "Evidencia no encontrada" });
        res.json({ mensaje: "Evidencia eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la evidencia" });
    }
});

module.exports = router;