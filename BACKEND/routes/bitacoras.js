const express = require("express");
const router = express.Router();
const { getDb } = require("../db/mongo");
const { ObjectId } = require("mongodb");
const practicas = require("../db/practicas");

// Resuelve id_asignacion para el estudiante (Plan B: se calcula y guarda al crear)
async function resolverIdAsignacion(idEstudiante) {
    const r = await practicas.query(
        "SELECT id_asignacion FROM asignacion_plaza WHERE id_estudiante=$1 ORDER BY id_asignacion DESC LIMIT 1",
        [idEstudiante]
    );
    return r.rows.length ? r.rows[0].id_asignacion : null;
}

router.post("/", async (req, res) => {
    try {
        const { actividad_id, estudiante_id, titulo, fecha, descripcion, horas_registradas } = req.body;
        const idAsignacion = await resolverIdAsignacion(estudiante_id);
        if (!idAsignacion) return res.status(400).json({ error: "El estudiante no tiene asignación de plaza registrada" });

        const bitacora = {
            actividad_id: new ObjectId(actividad_id), id_asignacion: idAsignacion, estudiante_id,
            titulo, fecha: new Date(fecha), descripcion, horas_registradas, estado: "pendiente", motivo_correccion: null
        };
        const db = getDb();
        const r = await db.collection("bitacora").insertOne(bitacora);
        res.status(201).json({ _id: r.insertedId, ...bitacora });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al crear la bitácora" }); }
});

router.get("/estudiante/:id", async (req, res) => {
    try {
        const db = getDb();
        const bits = await db.collection("bitacora").find({ estudiante_id: parseInt(req.params.id) }).sort({ fecha: -1 }).toArray();
        res.json(bits);
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al consultar bitácoras" }); }
});

router.get("/docente/:idAsignacion", async (req, res) => {
    try {
        const db = getDb();
        const bits = await db.collection("bitacora").find({ id_asignacion: parseInt(req.params.idAsignacion) }).sort({ fecha: -1 }).toArray();
        res.json(bits);
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al consultar bitácoras" }); }
});

router.put("/:id/aprobar", async (req, res) => {
    try {
        const db = getDb();
        await db.collection("bitacora").updateOne({ _id: new ObjectId(req.params.id) }, { $set: { estado: "aprobada", motivo_correccion: null } });
        res.json({ mensaje: "Bitácora aprobada" });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al aprobar" }); }
});

router.put("/:id/correccion", async (req, res) => {
    try {
        const db = getDb();
        await db.collection("bitacora").updateOne({ _id: new ObjectId(req.params.id) }, { $set: { estado: "requiere_correccion", motivo_correccion: req.body.motivo } });
        res.json({ mensaje: "Corrección solicitada" });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al solicitar corrección" }); }
});

router.delete("/:id", async (req, res) => {
    try {
        const db = getDb();
        await db.collection("bitacora").deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ mensaje: "Bitácora eliminada" });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al eliminar" }); }
});

// Bitácoras de todos los estudiantes reales de un docente
router.get("/docente-real/:idDocente", async (req, res) => {
    try {
        const asigs = await practicas.query(
            "SELECT id_estudiante FROM asignacion_docente WHERE id_docente = $1 AND estado = 'ACTIVO'",
            [req.params.idDocente]
        );
        const idsEstudiantes = asigs.rows.map(r => r.id_estudiante);
        if (idsEstudiantes.length === 0) return res.json([]);

        const planRes = await practicas.query(
            "SELECT DISTINCT ON (id_estudiante) id_estudiante, id_asignacion FROM asignacion_plaza WHERE id_estudiante = ANY($1) ORDER BY id_estudiante, id_asignacion DESC",
            [idsEstudiantes]
        );
        const idsAsignacion = planRes.rows.map(r => r.id_asignacion);
        if (idsAsignacion.length === 0) return res.json([]);

        const db = getDb();
        const bits = await db.collection("bitacora").find({ id_asignacion: { $in: idsAsignacion } }).sort({ fecha: -1 }).toArray();
        res.json(bits);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al consultar bitácoras del docente" });
    }
});

module.exports = router;