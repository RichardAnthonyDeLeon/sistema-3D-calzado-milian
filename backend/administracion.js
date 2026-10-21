"use strict";
const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");
function verificar(password, encoded) {
    if (typeof password !== "string" || password.length > 200 || !encoded) return false;
    const [salt, hash] = encoded.split(":");
    if (!salt || !/^[a-f0-9]{128}$/.test(hash || "")) return false;
    const actual = scryptSync(password, salt, 64), expected = Buffer.from(hash, "hex");
    return timingSafeEqual(actual, expected);
}
function registrarAdministracion(app) {
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
        const id = token(req), expires = sesiones.get(id);
        if (!expires || expires < Date.now()) { sesiones.delete(id); return res.status(401).json({ mensaje: "Inicia sesión para acceder al panel." }); }
        if (!["GET", "HEAD"].includes(req.method) && (!origen(req) || req.get("X-Milian-Request") !== "1")) return res.status(403).json({ mensaje: "Solicitud no permitida." });
        return next();
    }
    app.post("/api/admin/login", (req, res) => {
        res.set("Cache-Control", "no-store");
        if (!origen(req) || req.get("X-Milian-Request") !== "1") return res.status(403).json({ mensaje: "Solicitud no permitida." });
        const now = Date.now();
        for (const [id, expiry] of sesiones) if (expiry < now) sesiones.delete(id);
        for (const [ip, value] of intentos) if (value.hasta < now) intentos.delete(ip);
        const tries = intentos.get(req.ip) || { count: 0, hasta: now + 15 * 60000 };
        if (tries.count >= 5) return res.status(429).json({ mensaje: "Demasiados intentos. Espera 15 minutos." });
        const body = req.body || {};
        if (body.usuario !== (process.env.ADMIN_USER || "admin") || !verificar(body.password, process.env.ADMIN_PASSWORD_HASH)) {
            tries.count++; intentos.set(req.ip, tries); return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
        }
        intentos.delete(req.ip); const old = token(req); if (old) sesiones.delete(old);
        const id = randomBytes(32).toString("hex"); sesiones.set(id, now + duracion);
        res.set("Set-Cookie", cookie(req, id, duracion / 1000)).json({ usuario: process.env.ADMIN_USER || "admin" });
    });
    app.get("/api/admin/session", administracion, (req, res) => res.json({ usuario: process.env.ADMIN_USER || "admin" }));
    app.post("/api/admin/logout", administracion, (req, res) => {
        sesiones.delete(token(req)); res.set("Set-Cookie", cookie(req, "", 0)).json({ mensaje: "Sesión cerrada." });
    });
    return administracion;
}
module.exports = { registrarAdministracion, verificar };
