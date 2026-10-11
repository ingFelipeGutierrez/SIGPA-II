const { Pool } = require("pg");
require("dotenv").config();

module.exports = new Pool({
    connectionString: process.env.NEONDB_URL,
    ssl: { rejectUnauthorized: false }
});