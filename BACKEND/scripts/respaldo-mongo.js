/**
 * BACKEND/scripts/respaldo-mongo.js
 *
 * Respaldo de SOLO LECTURA de ms_seguimiento: exporta cada colección a un
 * archivo JSON (formato EJSON, conserva ObjectId y fechas) para poder
 * restaurar si algún día se rompe algo.
 *
 * Uso (desde BACKEND):  node scripts/respaldo-mongo.js
 * Salida: BACKEND/scripts/_salida/respaldo-mongo-AAAA-MM-DD.json (ignorada por git).
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { BSON } = require("mongodb");
const { conectarMongo, getDb } = require("../db/mongo");

(async () => {
  try {
    await conectarMongo();
    const db = getDb();
    const respaldo = {};
    for (const { name } of await db.listCollections().toArray()) {
      respaldo[name] = await db.collection(name).find({}).toArray();
      console.log(`${name}: ${respaldo[name].length} documento(s)`);
    }
    const carpeta = path.join(__dirname, "_salida");
    fs.mkdirSync(carpeta, { recursive: true });
    const archivo = path.join(carpeta, `respaldo-mongo-${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(archivo, BSON.EJSON.stringify(respaldo, null, 2, { relaxed: false }), "utf-8");
    console.log("Respaldo guardado en:", archivo);
  } catch (e) {
    console.error("Error al respaldar:", e.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();
