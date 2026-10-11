const express = require("express");
const router = express.Router();
const { getDb } = require("../db/mongo");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
    try {
        const { bitacora_id, estudiante_id, docente_id, texto } = req.body;
        const doc = { bitacora_id: new ObjectId(bitacora_id), estudiante_id, docente_id, texto, fecha: new Date() };
        const db = getDb();
        const r = await db.collection("retroalimentacion").insertOne(doc);
        res.status(201).json({ _id: r.insertedId, ...doc });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al crear retroalimentación" }); }
});

router.get("/estudiante/:id", async (req, res) => {
    try {
        const db = getDb();
        const r = await db.collection("retroalimentacion").find({ estudiante_id: parseInt(req.params.id) }).sort({ fecha: -1 }).toArray();
        res.json(r);
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al consultar" }); }
});

router.delete("/:id", async (req, res) => {
    try {
        const db = getDb();
        await db.collection("retroalimentacion").deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ mensaje: "Retroalimentación eliminada" });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al eliminar" }); }
});

module.exports = router;