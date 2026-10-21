"use strict";
const { createHash } = require("node:crypto");
const validaciones = require("../js/validaciones");
const defaults = { nombre: "Milián", whatsapp: "50249498131", ubicacion: "", horarios: "", envios: "El costo y la cobertura de entrega se coordinan con el negocio antes de confirmar el pedido.", pagos: "Consulta los métodos disponibles al coordinar tu pedido.", elaboracion: "Cada modelo y diseño puede requerir un tiempo diferente. Confirma el plazo con el negocio.", cambios: "Consulta las condiciones de cambios antes de confirmar tu compra.", cuidados: "", historia: "Calzado elaborado con atención al detalle. Explora nuestra colección, conoce sus acabados y comparte tu idea de un diseño personalizado.", testimonios: [], galeria: [14,15,16,17,18,19] };
const parse = value => typeof value === "string" ? JSON.parse(value) : value;
function normalizarPedido(body) {
    const keys = ["nombre", "telefono", "entrega", "departamento", "municipio", "direccion", "referencia", "pago", "comentarios"];
    const data = Object.fromEntries(keys.map(k => [k, typeof body[k] === "string" ? body[k].trim() : ""]));
    if (data.entrega === "recoger") for (const key of ["departamento", "municipio", "direccion", "referencia"]) data[key] = "";
    data.consentimiento = body.consentimiento;
    data.productos = body.productos.map(x => ({ id_producto: x.id_producto, talla: x.talla, color: x.color, cantidad: x.cantidad })).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return data;
}
function validarConfig(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return "Configuración inválida.";
    for (const key of Object.keys(defaults).filter(x => !["testimonios", "galeria"].includes(x))) if (typeof body[key] !== "string" || body[key].length > (key === "nombre" ? 100 : 2000)) return "Revisa los textos de la configuración.";
    if (!body.nombre.trim() || !/^502[2-7]\d{7}$/.test(body.whatsapp)) return "Indica el nombre y un WhatsApp de Guatemala válido (502 + 8 dígitos).";
    if (!Array.isArray(body.galeria) || body.galeria.length > 12 || body.galeria.some(x => !Number.isInteger(x) || x <= 0)) return "Selecciona hasta 12 productos para la galería.";
    if (!Array.isArray(body.testimonios) || body.testimonios.length > 6 || body.testimonios.some(x => !x || typeof x.nombre !== "string" || !x.nombre.trim() || x.nombre.length > 80 || typeof x.texto !== "string" || !x.texto.trim() || x.texto.length > 500 || x.autorizado !== true)) return "Publica únicamente testimonios reales autorizados, con nombre (hasta 80 caracteres) y texto (hasta 500).";
    return "";
}
function validarProducto(body) {
    if (!body || typeof body !== "object") return "Producto inválido.";
    for (const [key, max] of [["nombre",150],["marca",100],["categoria",100],["descripcion",4000]]) if (typeof body[key] !== "string" || body[key].length > max || (["nombre","categoria"].includes(key) && !body[key].trim())) return "Revisa nombre, marca, categoría y descripción.";
    if (body.precio !== null && (typeof body.precio !== "number" || !Number.isFinite(body.precio) || body.precio <= 0 || body.precio > 999999.99 || Math.abs(body.precio * 100 - Math.round(body.precio * 100)) > .0001)) return "Usa un precio positivo con hasta dos decimales, o déjalo vacío para consultar.";
    for (const key of ["tallas", "colores"]) if (!Array.isArray(body[key]) || body[key].length > 30 || body[key].some(v => typeof v !== "string" || !v.trim() || v.length > 50) || JSON.stringify(body[key]).length > 150) return "Tallas o colores demasiado largos; usa opciones separadas por comas.";
    if (typeof body.disponible !== "boolean") return "Disponibilidad inválida.";
    if (body.disponible && (!body.tallas.length || !body.colores.length)) return "Un producto disponible necesita tallas y colores.";
    for (const [key,folder] of [["imagen","imagenes"],["modelo_3d","modelos"]]) {
        if (typeof body[key] !== "string" || body[key].length > 255) return "Recurso inválido.";
        const value = body[key];
        try { const url = new URL(value, "https://milian.local"); if (!value.startsWith(folder + "/") || url.origin !== "https://milian.local" || !url.pathname.startsWith("/"+folder+"/") || value.includes("\\") || /%2f|%5c/i.test(value)) return "Usa recursos de las carpetas públicas del proyecto."; } catch { return "Recurso inválido."; }
    }
    return "";
}
function registrarGestion(app, db, { administracion, limite, prepararPedido }) {
    app.get("/api/negocio", async (req,res) => {
        try { const [rows] = await db.execute("SELECT contenido FROM negocio_config WHERE id = 1"); res.set("Cache-Control","no-store").json({ ...defaults, ...(rows[0] ? parse(rows[0].contenido) : {}) }); }
        catch { res.status(503).json({ mensaje: "No se pudo consultar la información del negocio." }); }
    });
    app.put("/api/admin/negocio", administracion, async (req,res) => {
        const error = validarConfig(req.body); if(error) return res.status(400).json({ mensaje:error });
        const data = Object.fromEntries(Object.keys(defaults).map(k => [k,req.body[k]]));
        try { await db.execute("INSERT INTO negocio_config (id, contenido) VALUES (1, ?) ON DUPLICATE KEY UPDATE contenido = VALUES(contenido)",[JSON.stringify(data)]); res.json({ mensaje:"Información guardada. Ya está visible en la página." }); }
        catch { res.status(503).json({ mensaje:"No se pudo guardar la información." }); }
    });
    app.put("/api/admin/productos/:id", administracion, async (req,res) => {
        const error = validarProducto(req.body); if(error || !/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ mensaje:error || "Producto inválido." });
        try {
            const fs = require("node:fs"), path = require("node:path");
            for (const key of ["imagen","modelo_3d"]) { const resource = new URL(req.body[key],"https://milian.local").pathname.slice(1); if (!fs.existsSync(path.resolve(__dirname,"..",resource))) return res.status(400).json({ mensaje:"No existe la imagen o el modelo indicado en el proyecto." }); }
            const b=req.body;
            const [result] = await db.execute("UPDATE productos SET nombre=?,marca=?,categoria=?,descripcion=?,precio=?,tallas=?,colores=?,imagen=?,modelo_3d=?,disponible=? WHERE id_producto=?",[b.nombre.trim(),b.marca.trim(),b.categoria.trim(),b.descripcion.trim(),b.precio,JSON.stringify(b.tallas),JSON.stringify(b.colores),b.imagen,b.modelo_3d,b.disponible ? 1:0,req.params.id]);
            if(!result.affectedRows) return res.status(404).json({mensaje:"No se encontró el producto."}); res.json({mensaje:"Producto actualizado. Recarga el catálogo para ver los cambios."});
        } catch { res.status(503).json({mensaje:"No se pudo actualizar el producto."}); }
    });
    function respuesta(row) { return { id_pedido:row.id_pedido, ...parse(row.productos), guardado:true }; }
    app.post("/api/pedidos", limite, async (req,res) => {
        const error = validaciones.pedido(req.body);
        if(error || !/^[a-f0-9-]{36}$/.test(req.body?.solicitud_id || "")) return res.status(400).json({mensaje:error || "Solicitud inválida. Intenta nuevamente."});
        const data = normalizarPedido(req.body), hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
        let connection;
        try {
            connection = await db.getConnection(); await connection.beginTransaction();
            const [existing] = await connection.execute("SELECT id_pedido, hash_solicitud, productos FROM pedidos WHERE solicitud_id = ?",[req.body.solicitud_id]);
            if(existing.length) { await connection.rollback(); if(existing[0].hash_solicitud!==hash) return res.status(409).json({mensaje:"La solicitud cambió. Vuelve a preparar el pedido."}); return res.set("Cache-Control","no-store").json(respuesta(existing[0])); }
            const ids=[...new Set(data.productos.map(x=>x.id_producto))];
            const [rows] = await connection.execute(`SELECT id_producto,nombre,precio,tallas,colores,disponible FROM productos WHERE id_producto IN (${ids.map(()=>"?").join(",")}) FOR SHARE`,ids);
            let pedido; try { pedido=prepararPedido(data,rows); } catch(error) { await connection.rollback(); return res.status(409).json({mensaje:error.message}); }
            const direccion=Object.fromEntries(["departamento","municipio","direccion","referencia"].map(k=>[k,data[k]]));
            const [saved] = await connection.execute("INSERT INTO pedidos (solicitud_id,hash_solicitud,nombre,telefono,entrega,datos_entrega,pago,comentarios,productos,total) VALUES (?,?,?,?,?,?,?,?,?,?)",[req.body.solicitud_id,hash,data.nombre,data.telefono,data.entrega,JSON.stringify(direccion),data.pago,data.comentarios,JSON.stringify(pedido),pedido.total]);
            await connection.commit(); res.status(201).set("Cache-Control","no-store").json({id_pedido:saved.insertId,...pedido,guardado:true});
        } catch(error) {
            if(connection) await connection.rollback().catch(()=>{});
            if(error.code === "ER_DUP_ENTRY") { try {const [rows]=await db.execute("SELECT id_pedido, hash_solicitud, productos FROM pedidos WHERE solicitud_id = ?",[req.body.solicitud_id]);if(rows[0]?.hash_solicitud===hash)return res.set("Cache-Control","no-store").json(respuesta(rows[0]));}catch{} }
            res.status(503).json({mensaje:"No se recibió confirmación del registro. Conserva el formulario e intenta de nuevo para comprobar la misma solicitud."});
        } finally { if(connection)connection.release(); }
    });
    app.get("/api/admin/pedidos", administracion, async (req,res) => {
        const page=Math.max(1,Math.min(10000,Number(req.query.page)||1)); if(!Number.isInteger(page))return res.status(400).json({mensaje:"Página inválida."});
        try { const [rows]=await db.execute(`SELECT id_pedido,nombre,telefono,entrega,datos_entrega,pago,comentarios,productos,total,estado,notas_internas,fecha_registro FROM pedidos ORDER BY id_pedido DESC LIMIT 50 OFFSET ${(page-1)*50}`); const [counts]=await db.execute("SELECT COUNT(*) AS total FROM pedidos");res.json({pedidos:rows.map(r=>({...r,datos_entrega:parse(r.datos_entrega),detalle:parse(r.productos),productos:undefined})),total:counts[0].total,page}); }
        catch {res.status(503).json({mensaje:"No se pudieron consultar los pedidos."});}
    });
    app.patch("/api/admin/pedidos/:id", administracion, async (req,res) => {
        const b=req.body;if(!b||!["recibido","confirmado","en_elaboracion","listo","entregado","cancelado"].includes(b.estado)||typeof b.notas_internas!=="string"||b.notas_internas.length>1000||!/^[1-9]\d*$/.test(req.params.id))return res.status(400).json({mensaje:"Estado o notas inválidos."});
        try {const [r]=await db.execute("UPDATE pedidos SET estado=?,notas_internas=? WHERE id_pedido=?",[b.estado,b.notas_internas,req.params.id]);if(!r.affectedRows)return res.status(404).json({mensaje:"Pedido no encontrado."});res.json({mensaje:"Pedido actualizado."});}catch{res.status(503).json({mensaje:"No se pudo guardar el pedido."});}
    });
    app.get("/api/admin/reportes", administracion, async (req,res) => {
        const {desde,hasta}=req.query;
        const date=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
        if(!date(desde)||!date(hasta)||desde>hasta||Date.parse(hasta)-Date.parse(desde)>366*86400000)return res.status(400).json({mensaje:"Selecciona un período válido de hasta un año."});
        const range=[desde,hasta];
        // Las fechas se agrupan en Guatemala; la conexión MySQL usa UTC.
        const where="fecha_registro >= DATE_ADD(?, INTERVAL 6 HOUR) AND fecha_registro < DATE_ADD(DATE_ADD(?, INTERVAL 1 DAY), INTERVAL 6 HOUR)";
        try {
            const [pedidos]=await db.execute(`SELECT estado,COUNT(*) AS cantidad,COALESCE(SUM(total),0) AS monto FROM pedidos WHERE ${where} GROUP BY estado`,range);
            const [propuestas]=await db.execute(`SELECT estado,COUNT(*) AS cantidad FROM propuestas_disenos WHERE ${where} GROUP BY estado`,range);
            const [dias]=await db.execute(`SELECT DATE(DATE_SUB(fecha_registro,INTERVAL 6 HOUR)) AS dia,COUNT(*) AS cantidad FROM pedidos WHERE ${where} GROUP BY dia ORDER BY dia`,range);
            res.json({desde,hasta,pedidos,propuestas,dias,nota:"Montos de productos solicitados, sin envío. No representan pagos cobrados. Entregados se agrupan por la fecha en que se recibió la solicitud."});
        }catch{res.status(503).json({mensaje:"No se pudieron generar los reportes."});}
    });
}
module.exports={registrarGestion,validarProducto,validarConfig,normalizarPedido,defaults};
