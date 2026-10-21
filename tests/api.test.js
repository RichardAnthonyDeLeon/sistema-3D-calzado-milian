const test = require("node:test");
const assert = require("node:assert/strict");
const { leer } = require("../js/api");
const response = (text, status = 200) => ({ text: async () => text, status, ok: status >= 200 && status < 300 });
test("respuesta vacía, HTML o JSON incompleto explica cómo abrir el backend", async () => {
    for (const text of ["", "<html>Live Server</html>", '{"total":']) {
        await assert.rejects(leer(response(text)), /Inicia el backend.*localhost:3000/);
    }
});
test("ruta ausente explica que se requiere el servidor del sistema", async () => {
    for (const status of [404, 405, 501]) await assert.rejects(leer(response('{"mensaje":"Ruta no encontrada"}', status)), /Inicia el backend/);
});
test("conserva mensajes de validación y de base de datos", async () => {
    await assert.rejects(leer(response('{"mensaje":"Una talla ya no está disponible"}', 409)), /Una talla ya no está disponible/);
    await assert.rejects(leer(response('{"mensaje":"No se pudo guardar la propuesta"}', 503)), /No se pudo guardar la propuesta/);
});
test("rechaza valores JSON inesperados y acepta objetos o listas válidos", async () => {
    for (const text of ["null", "42", '"texto"']) await assert.rejects(leer(response(text)), /respuesta inválida/);
    assert.deepEqual(await leer(response('{"total":425}')), { total: 425 });
    assert.deepEqual(await leer(response('[]')), []);
});
