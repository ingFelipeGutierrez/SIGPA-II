/**
 * BACKEND/scripts/volcar-esquemas.js
 *
 * Herramienta de SOLO LECTURA (no modifica nada): vuelca a un archivo de
 * texto el esquema real de las tres bases del proyecto, para escribir la
 * semilla de datos sin adivinar columnas ni reglas ocultas.
 *
 *  - neondb y ms_practicas (PostgreSQL): columnas, restricciones
 *    (PK/FK/CHECK/UNIQUE), triggers y las filas existentes.
 *  - ms_seguimiento (MongoDB): validadores $jsonSchema, conteos y un
 *    documento de ejemplo por colección.
 *
 * Uso (desde la carpeta BACKEND):  node scripts/volcar-esquemas.js
 * Salida: BACKEND/scripts/_salida/esquemas.txt  (carpeta ignorada por git).
 * No imprime cadenas de conexión ni columnas de identificadores de Google.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const neondb = require("../db/neondb");
const practicas = require("../db/practicas");
const { conectarMongo, getDb } = require("../db/mongo");

const salida = [];
const escribir = (linea = "") => salida.push(linea);
const OCULTAS = /sub|password|clave|token/i; // columnas que no se vuelcan

async function volcarPostgres(nombre, pool) {
  escribir(`\n==================== POSTGRES: ${nombre} ====================`);

  const columnas = await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position`);
  escribir("\n-- COLUMNAS");
  columnas.rows.forEach((c) =>
    escribir(`${c.table_name}.${c.column_name}  ${c.data_type}${c.is_nullable === "NO" ? " NOT NULL" : ""}${c.column_default ? " DEFAULT " + c.column_default : ""}`));

  const restricciones = await pool.query(`
    SELECT conrelid::regclass AS tabla, contype, pg_get_constraintdef(oid) AS definicion
    FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY conrelid::regclass::text, contype`);
  escribir("\n-- RESTRICCIONES (p=PK f=FK c=CHECK u=UNIQUE)");
  restricciones.rows.forEach((r) => escribir(`${r.tabla} [${r.contype}] ${r.definicion}`));

  const triggers = await pool.query(`
    SELECT event_object_table AS tabla, trigger_name, event_manipulation, action_timing, action_statement
    FROM information_schema.triggers WHERE trigger_schema = 'public'`);
  escribir("\n-- TRIGGERS");
  triggers.rows.forEach((t) => escribir(`${t.tabla}: ${t.trigger_name} ${t.action_timing} ${t.event_manipulation} -> ${t.action_statement}`));

  const funciones = await pool.query(`
    SELECT p.proname, pg_get_functiondef(p.oid) AS definicion
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'`);
  escribir("\n-- FUNCIONES");
  funciones.rows.forEach((f) => escribir(`${f.definicion}\n`));

  escribir("\n-- FILAS EXISTENTES (máx. 60 por tabla)");
  const tablas = [...new Set(columnas.rows.map((c) => c.table_name))];
  for (const t of tablas) {
    const cols = columnas.rows.filter((c) => c.table_name === t && !OCULTAS.test(c.column_name)).map((c) => `"${c.column_name}"`);
    const filas = await pool.query(`SELECT ${cols.join(", ")} FROM "${t}" LIMIT 60`);
    escribir(`\n[${t}] ${filas.rows.length} fila(s)`);
    filas.rows.forEach((f) => escribir(JSON.stringify(f)));
  }
}

async function volcarMongo() {
  escribir("\n==================== MONGODB: ms_seguimiento ====================");
  await conectarMongo();
  const db = getDb();
  const infos = await db.listCollections().toArray();
  for (const info of infos) {
    const col = db.collection(info.name);
    escribir(`\n[${info.name}] ${await col.countDocuments()} documento(s)`);
    escribir("validator: " + JSON.stringify(info.options?.validator ?? null, null, 1));
    const ejemplos = await col.find({}).limit(2).toArray();
    ejemplos.forEach((d) => escribir("ejemplo: " + JSON.stringify(d)));
  }
}

(async () => {
  try {
    await volcarPostgres("neondb", neondb);
    await volcarPostgres("ms_practicas", practicas);
    await volcarMongo();
    const carpeta = path.join(__dirname, "_salida");
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(path.join(carpeta, "esquemas.txt"), salida.join("\n"), "utf-8");
    console.log("Listo: BACKEND/scripts/_salida/esquemas.txt");
  } catch (e) {
    console.error("Error al volcar los esquemas:", e.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();
