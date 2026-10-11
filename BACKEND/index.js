const express = require("express");
const cors = require("cors");
require("dotenv").config();

const neondb = require("./db/neondb");
const practicas = require("./db/practicas");
const { conectarMongo, getDb } = require("./db/mongo");
const usuariosRouter = require("./routes/usuarios");
const practicasRouter = require("./routes/practicas");
const actividadesRouter = require("./routes/actividades");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/usuarios", usuariosRouter);
app.use("/api/practicas", practicasRouter);
app.use("/api/actividades", actividadesRouter);

app.get("/api/ping/neondb", async (req, res) => {
    try {
        const r = await neondb.query("SELECT NOW()");
        res.json({ conectado: true, base: "neondb", hora: r.rows[0].now });
    } catch (e) {
        res.status(500).json({ conectado: false, base: "neondb", error: e.message });
    }
});

app.get("/api/ping/practicas", async (req, res) => {
    try {
        const r = await practicas.query("SELECT NOW()");
        res.json({ conectado: true, base: "ms_practicas", hora: r.rows[0].now });
    } catch (e) {
        res.status(500).json({ conectado: false, base: "ms_practicas", error: e.message });
    }
});

app.get("/api/ping/mongo", async (req, res) => {
    try {
        const db = getDb();
        const colecciones = await db.listCollections().toArray();
        res.json({ conectado: true, base: "ms_seguimiento", colecciones: colecciones.map(c => c.name) });
    } catch (e) {
        res.status(500).json({ conectado: false, base: "ms_seguimiento", error: e.message });
    }
});

const PORT = process.env.PORT || 4000;

conectarMongo().then(() => {
    app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
});