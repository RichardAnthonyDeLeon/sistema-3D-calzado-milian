const mysql = require("mysql2/promise");
require("dotenv").config();

const conexion = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function probarConexion() {
    const connection = await conexion.getConnection();

    try {
        await connection.query("SELECT 1");
        console.log("Conexión con MySQL establecida.");
    } finally {
        connection.release();
    }
}

module.exports = {
    conexion,
    probarConexion
};