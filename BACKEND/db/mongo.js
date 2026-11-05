const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
let db;
let conexion; // guarda la promesa para no conectar dos veces

function conectarMongo() {
    if (!conexion) {
        conexion = client.connect().then(() => {
            db = client.db("ms_seguimiento");
            console.log("MongoDB conectado");
        }).catch(err => {
            conexion = null; // permite reintentar en la siguiente petición
            throw err;
        });
    }
    return conexion;
}

module.exports = {
    conectarMongo,
    getDb: () => db
};