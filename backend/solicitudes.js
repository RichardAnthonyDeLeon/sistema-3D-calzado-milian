"use strict";
const { randomUUID } = require("node:crypto");
const validaciones = require("../js/validaciones");

function lista(value) {
    try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch { return []; }
}
function prepararPedido(data, rows) {
    const error = validaciones.pedido(data);
    if (error) throw new Error(error);
    const productos = data.productos.map(item => {
        const row = rows.find(row => Number(row.id_producto) === item.id_producto);
        if (!row || ![true, 1, "1"].includes(row.disponible)) throw new Error("Un producto ya no está disponible. Actualiza el catálogo.");
        if (!lista(row.tallas).includes(item.talla) || !lista(row.colores).includes(item.color)) throw new Error("Una talla o color ya no está disponible. Actualiza el catálogo.");
        const centavos = Math.round(Number(row.precio) * 100);
        if (!Number.isSafeInteger(centavos) || centavos <= 0) throw new Error("Un producto no tiene precio disponible.");
        return { ...item, nombre: row.nombre, precio: centavos / 100, subtotal: centavos * item.cantidad / 100 };
    });
    return { productos, total: productos.reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0) / 100 };
}
function registrarSolicitudes(app, conexion) {
    const administracion = require("./administracion").registrarAdministracion(app);
    // Limitar envíos por IP sin guardar datos del formulario en memoria.
    const ventanas = new Map();
    function limite(req, res, next) {
        const now = Date.now();
        for (const [key, value] of ventanas) if (value.hasta <= now) ventanas.delete(key);
        const value = ventanas.get(req.ip) || { hasta: now + 60000, cantidad: 0 };
        if (++value.cantidad > 10) return res.status(429).json({ mensaje: "Demasiadas solicitudes. Intenta dentro de un minuto." });
        ventanas.set(req.ip, value); return next();
    }
    app.post("/api/pedidos/validar", limite, async (req, res) => {
        const error = validaciones.pedido(req.body);
        if (error) return res.status(400).json({ mensaje: error });
        try {
            const ids = [...new Set(req.body.productos.map(x => x.id_producto))];
            const [rows] = await conexion.execute(`SELECT id_producto, nombre, precio, tallas, colores, disponible FROM productos WHERE id_producto IN (${ids.map(() => "?").join(",")})`, ids);
            try { res.set("Cache-Control", "no-store").json(prepararPedido(req.body, rows)); }
            catch (error) { res.status(409).json({ mensaje: error.message }); }
        } catch { res.status(503).json({ mensaje: "No se pudo comprobar el pedido. Intenta nuevamente." }); }
    });
    app.post("/api/propuestas", limite, async (req, res) => {
        const error = validaciones.propuesta(req.body);
        if (error) return res.status(400).json({ mensaje: error });
        if (req.body.imagen != null && (typeof req.body.imagen !== "string" || req.body.imagen.length > 700000 || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(req.body.imagen))) return res.status(400).json({ mensaje: "Usa una imagen JPG, PNG o WebP de hasta 500 KB." });
        const folio = randomUUID();
        const values = [folio, ...["nombre", "telefono", "titulo", "descripcion", "talla", "color"].map(key => req.body[key].trim()), req.body.imagen || null];
        try {
            await conexion.execute("INSERT INTO propuestas_disenos (folio, nombre, telefono, titulo, descripcion, talla, color, imagen_referencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", values);
            res.status(201).set("Cache-Control", "no-store").json({ folio, estado: "pendiente", mensaje: "Propuesta guardada. El negocio te contactará para revisar tu diseño." });
        } catch { res.status(503).json({ mensaje: "No se pudo guardar la propuesta. Intenta nuevamente más tarde." }); }
    });
    app.get("/api/propuestas", administracion, async (req, res) => {
        try {
            const [rows] = await conexion.execute("SELECT folio, nombre, telefono, titulo, descripcion, talla, color, imagen_referencia, estado, fecha_registro FROM propuestas_disenos ORDER BY id_propuesta DESC LIMIT 100");
            res.json(rows);
        } catch { res.status(503).json({ mensaje: "No se pudieron consultar las propuestas." }); }
    });
    app.patch("/api/propuestas/:folio", administracion, async (req, res) => {
        const estados = ["pendiente", "en_revision", "cotizada", "aceptada", "rechazada"];
        if (!req.body || !estados.includes(req.body.estado) || !/^[a-f0-9-]{36}$/.test(req.params.folio)) return res.status(400).json({ mensaje: "Estado o folio inválido." });
        try {
            const [result] = await conexion.execute("UPDATE propuestas_disenos SET estado = ? WHERE folio = ?", [req.body.estado, req.params.folio]);
            if (!result.affectedRows) return res.status(404).json({ mensaje: "No se encontró la propuesta." });
            res.json({ mensaje: "Estado actualizado." });
        } catch { res.status(503).json({ mensaje: "No se pudo actualizar el estado." }); }
    });

    require("./gestion").registrarGestion(app, conexion, { administracion, limite, prepararPedido });
}
module.exports = { registrarSolicitudes, prepararPedido };
