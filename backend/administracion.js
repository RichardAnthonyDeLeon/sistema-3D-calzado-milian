"use strict";
const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");
function verificar(password, encoded) {
    if (typeof password !== "string" || password.length > 200 || !encoded) return false;
    const [salt, hash] = encoded.split(":");
    if (!salt || !/^[a-f0-9]{128}$/.test(hash || "")) return false;
    const actual = scryptSync(password, salt, 64), expected = Buffer.from(hash, "hex");
    return timingSafeEqual(actual, expected);
}
function registrarAdministracion(app, conexion) {
    const sesiones = new Map(), intentos = new Map();
    const duracion = 8 * 60 * 60 * 1000;
    const cookie = (req, value, age) => `milian_session=${value}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${age}${req.secure ? "; Secure" : ""}`;
    function origen(req) {
        const origin = req.get("Origin");
        return !origin || origin === `${req.protocol}://${req.get("Host")}`;
    }
    function token(req) { return /(?:^|;\s*)milian_session=([a-f0-9]{64})(?:;|$)/.exec(req.get("Cookie") || "")?.[1]; }
    function administracion(req, res, next) {
        res.set("Cache-Control", "no-store");
        const id = token(req), session = sesiones.get(id);
        if (!session || session.expires < Date.now()) { sesiones.delete(id); return res.status(401).json({ mensaje: "Inicia sesión para acceder al panel." }); }
        if (!["GET", "HEAD"].includes(req.method) && (!origen(req) || req.get("X-Milian-Request") !== "1")) return res.status(403).json({ mensaje: "Solicitud no permitida." });
        req.usuarioAdmin = session.usuario;
        return next();
    }
    app.post("/api/admin/login", async (req, res) => {
        res.set("Cache-Control", "no-store");
        if (!origen(req) || req.get("X-Milian-Request") !== "1") return res.status(403).json({ mensaje: "Solicitud no permitida." });
        const now = Date.now();
        for (const [id, session] of sesiones) if (session.expires < now) sesiones.delete(id);
        for (const [ip, value] of intentos) if (value.hasta < now) intentos.delete(ip);
        const tries = intentos.get(req.ip) || { count: 0, hasta: now + 15 * 60000 };
        if (tries.count >= 5) return res.status(429).json({ mensaje: "Demasiados intentos. Espera 15 minutos." });
        const body = req.body || {};
        if (typeof body.usuario !== "string" || !body.usuario.trim() || body.usuario.length > 100 || typeof body.password !== "string" || body.password.length > 200) {
            tries.count++; intentos.set(req.ip, tries); return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
        }
        let usuario;
        try {
            const [rows] = await conexion.execute("SELECT usuario, password_hash, activo, rol FROM usuarios WHERE usuario = ? LIMIT 1", [body.usuario.trim()]);
            usuario = rows[0];
        } catch (error) {
            // Compatibilidad con instalaciones anteriores a la migración 005.
            // Un error de conexión o permisos nunca habilita el acceso alternativo.
            if (error.code !== "ER_NO_SUCH_TABLE") return res.status(503).json({ mensaje: "No se pudo comprobar el acceso. Revisa la conexión y los permisos de MySQL." });
            usuario = { usuario: process.env.ADMIN_USER || "admin", password_hash: process.env.ADMIN_PASSWORD_HASH, activo: 1, rol: "administrador" };
            if (body.usuario.trim() !== usuario.usuario) usuario = null;
        }
        if (!usuario || Number(usuario.activo) !== 1 || usuario.rol !== "administrador" || !verificar(body.password, usuario.password_hash)) {
            tries.count++; intentos.set(req.ip, tries); return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
        }
        intentos.delete(req.ip); const old = token(req); if (old) sesiones.delete(old);
        const id = randomBytes(32).toString("hex"); sesiones.set(id, { usuario: usuario.usuario, expires: now + duracion });
        res.set("Set-Cookie", cookie(req, id, duracion / 1000)).json({ usuario: usuario.usuario });
    });
    app.get("/api/admin/session", administracion, (req, res) => res.json({ usuario: req.usuarioAdmin }));
    app.post("/api/admin/logout", administracion, (req, res) => {
        sesiones.delete(token(req)); res.set("Set-Cookie", cookie(req, "", 0)).json({ mensaje: "Sesión cerrada." });
    });
    return administracion;
}
module.exports = { registrarAdministracion, verificar };
