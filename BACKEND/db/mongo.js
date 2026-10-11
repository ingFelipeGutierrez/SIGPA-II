const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function conectarMongo() {
    await client.connect();
    db = client.db("ms_seguimiento");
    console.log("MongoDB conectado");
}

module.exports = {
    conectarMongo,
    getDb: () => db
};