const test = require("node:test");
const assert = require("node:assert/strict");
const validaciones = require("../js/validaciones");
const { prepararPedido, registrarSolicitudes } = require("../backend/solicitudes");
const pedido = () => ({ nombre: "Ana Pérez", telefono: "5555 1234", entrega: "domicilio", departamento: "Guatemala", municipio: "Mixco", direccion: "Zona 1, casa 10", pago: "Por coordinar", consentimiento: true, productos: [{ id_producto: 14, talla: "38", color: "Negro", cantidad: 2 }] });
const producto = () => ({ id_producto: 14, nombre: "Botín", precio: "425.10", tallas: '["38"]', colores: '["Negro"]', disponible: 1 });
const propuesta = () => ({ nombre: "Ana Pérez", telefono: "+502 5555 1234", titulo: "Botín café", descripcion: "Botín de cuero con suela clara y costura visible.", talla: "38", color: "Café", consentimiento: true });
function harness(execute) {
    const routes = {};
    registrarSolicitudes({ put: (path, ...handlers) => routes[`PUT ${path}`] = handlers, post: (path, ...handlers) => routes[`POST ${path}`] = handlers, patch: (path, ...handlers) => routes[`PATCH ${path}`] = handlers, get: (path, ...handlers) => routes[`GET ${path}`] = handlers }, { execute });
    return async (route, body, headers = {}, params = {}) => {
        const res = { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, set(key, value) { this.headers[key] = value; return this; }, json(value) { this.body = value; return this; } };
        const handlers = routes[route];
        let i = 0;
        const next = () => handlers[i++]?.({ body, params, method: route.split(" ")[0], protocol: "http", ip: "127.0.0.1", get: key => headers[key] || (key === "Host" ? "localhost:3000" : "") }, res, next);
        await next(); return res;
    };
}
test("pedido rechaza espacios, teléfono, consentimiento y dirección incompletos", () => {
    for (const patch of [{ nombre: "  " }, { telefono: "123" }, { consentimiento: false }, { direccion: "    " }, { entrega: "otra" }, { pago: "otro" }]) assert.ok(validaciones.pedido({ ...pedido(), ...patch }));
    assert.equal(validaciones.pedido(pedido()), "");
    assert.equal(validaciones.pedido({ ...pedido(), entrega: "recoger", direccion: "" }), "");
});
test("pedido rechaza cantidades inválidas, IDs y duplicados", () => {
    for (const patch of [{ cantidad: 0 }, { cantidad: 100 }, { cantidad: 1.5 }, { id_producto: -1 }, { talla: " " }]) assert.ok(validaciones.pedido({ ...pedido(), productos: [{ ...pedido().productos[0], ...patch }] }));
    const data = pedido(); data.productos.push({ ...data.productos[0] }); assert.ok(validaciones.pedido(data));
});
test("precio y total proceden del catálogo, incluso si el navegador altera precios", () => {
    const data = pedido(); data.productos[0].precio = 1;
    const result = prepararPedido(data, [producto()]);
    assert.equal(result.total, 850.2); assert.equal(result.productos[0].precio, 425.1);
});
test("no prepara pedidos con productos ausentes, no disponibles, sin precio o con opciones inválidas", () => {
    assert.throws(() => prepararPedido(pedido(), []));
    for (const patch of [{ disponible: 0 }, { precio: null }, { precio: "no" }, { tallas: "[]" }, { colores: "inválido" }]) assert.throws(() => prepararPedido(pedido(), [{ ...producto(), ...patch }]));
});
test("propuesta requiere descripción y consentimiento y limita longitudes", () => {
    assert.equal(validaciones.propuesta(propuesta()), "");
    for (const patch of [{ titulo: "  " }, { descripcion: "Corto" }, { descripcion: "a".repeat(2001) }, { consentimiento: false }, { color: " " }]) assert.ok(validaciones.propuesta({ ...propuesta(), ...patch }));
});
test("API no escribe datos inválidos y guarda una propuesta mediante parámetros", async () => {
    const calls = [];
    const request = harness(async (...args) => { calls.push(args); return [{ insertId: 1 }]; });
    const invalid = await request("POST /api/propuestas", { ...propuesta(), consentimiento: false });
    assert.equal(invalid.statusCode, 400); assert.equal(calls.length, 0);
    const data = { ...propuesta(), titulo: "Diseño ' ; DROP TABLE productos; --" };
    const result = await request("POST /api/propuestas", data);
    assert.equal(result.statusCode, 201); assert.match(result.body.folio, /^[a-f0-9-]{36}$/);
    assert.equal(calls.length, 1); assert.ok(!calls[0][0].includes(data.titulo)); assert.equal(calls[0][1][3], data.titulo);
});
test("API comunica fallo de persistencia sin éxito ni detalles internos", async () => {
    const request = harness(async () => { throw Error("contraseña privada"); });
    const result = await request("POST /api/propuestas", propuesta());
    assert.equal(result.statusCode, 503); assert.ok(!JSON.stringify(result.body).includes("privada")); assert.equal(result.body.folio, undefined);
});
test("panel exige sesión, rechaza clave antigua y cierra sesión correctamente", async () => {
    const crypto = require("node:crypto");
    const previous = process.env.ADMIN_PASSWORD_HASH;
    const previousUser = process.env.ADMIN_USER;
    const password = "test-password-de-administracion";
    process.env.ADMIN_PASSWORD_HASH = "salt:" + crypto.scryptSync(password, "salt", 64).toString("hex");
    process.env.ADMIN_USER = "admin";
    try {
        let reads = 0;
        const request = harness(async () => { reads++; return [[]]; });
        assert.equal((await request("GET /api/propuestas", null)).statusCode, 401);
        assert.equal((await request("GET /api/propuestas", null, { Authorization: "Bearer clave-antigua" })).statusCode, 401);
        assert.equal(reads, 0);
        assert.equal((await request("POST /api/admin/login", { usuario: "admin", password }, {})).statusCode, 403);
        assert.equal((await request("POST /api/admin/login", { usuario: "admin", password: "incorrecta" }, { "X-Milian-Request": "1" })).statusCode, 401);
        const login = await request("POST /api/admin/login", { usuario: "admin", password }, { "X-Milian-Request": "1" });
        assert.equal(login.statusCode, 200);
        const cookie = login.headers["Set-Cookie"];
        assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
        const headers = { Cookie: cookie.split(";")[0], "X-Milian-Request": "1" };
        assert.equal((await request("GET /api/propuestas", null, headers)).statusCode, 200);
        assert.equal(reads, 1);
        assert.equal((await request("POST /api/admin/logout", {}, headers)).statusCode, 200);
        assert.equal((await request("GET /api/propuestas", null, headers)).statusCode, 401);
    } finally {
        if (previous === undefined) delete process.env.ADMIN_PASSWORD_HASH; else process.env.ADMIN_PASSWORD_HASH = previous;
        if (previousUser === undefined) delete process.env.ADMIN_USER; else process.env.ADMIN_USER = previousUser;
    }
});
test("imagen inválida no escribe una propuesta", async () => {
    let writes = 0; const request = harness(async () => { writes++; return [{}]; });
    assert.equal((await request("POST /api/propuestas", { ...propuesta(), imagen: "data:image/svg+xml;base64,AA==" })).statusCode, 400);
    assert.equal(writes, 0);
});
test("validación de API rechaza antes de consultar y devuelve conflicto si cambió catálogo", async () => {
    let reads = 0; const request = harness(async () => { reads++; return [[{ ...producto(), disponible: 0 }]]; });
    assert.equal((await request("POST /api/pedidos/validar", { ...pedido(), telefono: "123" })).statusCode, 400); assert.equal(reads, 0);
    assert.equal((await request("POST /api/pedidos/validar", pedido())).statusCode, 409);
});
