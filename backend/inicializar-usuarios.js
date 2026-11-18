"use strict";
const path = require("node:path");
const fs = require("node:fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { conexion } = require("./conexion");
async function inicializar() {
    const usuario = process.env.ADMIN_USER || "admin";
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!usuario.trim() || usuario.length > 100 || !/^[a-f0-9]+:[a-f0-9]{128}$/.test(hash || "")) {
        throw new Error("Configura ADMIN_USER y ADMIN_PASSWORD_HASH (scrypt sal:hash) en backend/.env antes de inicializar.");
    }
    const sql = fs.readFileSync(path.join(__dirname, "../database/005_usuarios.sql"), "utf8");
    // La conexión ya selecciona DB_NAME; no ejecutar el USE del ejemplo SQL.
    await conexion.execute(sql.slice(sql.indexOf("-- Usuarios")));
    await conexion.execute("INSERT INTO usuarios (usuario, nombre, password_hash) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id_usuario = id_usuario", [usuario, "Administrador del negocio", hash]);
    console.log("Tabla usuarios preparada. Administrador: " + usuario);
    console.log("Conserva su contraseña de .env al crearlo; no se modifica ningún usuario existente.");
}
if (require.main === module) {
    inicializar().catch(error => {
        console.error("No se pudo preparar usuarios:", error.code || error.message);
        process.exitCode = 1;
    }).finally(() => conexion.end());
}
module.exports = { inicializar };
