const test = require('node:test');
const assert = require('node:assert/strict');
const { scryptSync } = require('node:crypto');
const { registrarAdministracion } = require('../backend/administracion');
const password = 'solo-para-pruebas';
const usuario = { usuario: 'encargado', password_hash: 'sal:' + scryptSync(password, 'sal', 64).toString('hex'), activo: 1, rol: 'administrador' };
function harness(execute) {
    const routes = {};
    const app = {};
    for (const method of ['post', 'get']) app[method] = (ruta, ...handlers) => { routes[method + ' ' + ruta] = handlers; };
    registrarAdministracion(app, { execute });
    return async (body, headers = {}, route = 'post /api/admin/login') => {
        const req = { body, method: route.split(' ')[0].toUpperCase(), ip: '127.0.0.1', protocol: 'http', get: key => headers[key] || ({ Host: 'localhost:3000', 'X-Milian-Request': '1' })[key] };
        const res = { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, set(k, v) { this.headers[k] = v; return this; }, json(body) { this.body = body; return this; } };
        let i = 0;
        const next = () => routes[route][i++]?.(req, res, next);
        await next(); return res;
    };
}
test('consulta parametrizada autentica al usuario MySQL y conserva su identidad en la sesión', async () => {
    const request = harness(async (sql, values) => {
        assert.ok(sql.includes('WHERE usuario = ?')); assert.deepEqual(values, ['encargado']); return [[usuario]];
    });
    const result = await request({ usuario: 'encargado', password });
    assert.equal(result.statusCode, 200); assert.deepEqual(result.body, { usuario: 'encargado' });
    const session = await request(null, { Cookie: result.headers['Set-Cookie'].split(';')[0] }, 'get /api/admin/session');
    assert.deepEqual(session.body, { usuario: 'encargado' });
});
test('rechaza contraseña errónea, usuario ausente, inactivo y rol no autorizado', async () => {
    for (const row of [null, { ...usuario, activo: 0 }, { ...usuario, rol: 'otro' }, { ...usuario, password_hash: 'inválido' }]) {
        const request = harness(async () => [row ? [row] : []]);
        assert.equal((await request({ usuario: 'encargado', password })).statusCode, 401);
    }
    assert.equal((await harness(async () => [[usuario]])({ usuario: 'encargado', password: 'incorrecta' })).statusCode, 401);
});
test('un error MySQL de conexión o permisos responde 503 sin crear sesión', async () => {
    for (const code of ['ECONNREFUSED', 'ER_TABLEACCESS_DENIED_ERROR']) {
        const request = harness(async () => { throw Object.assign(Error('detalle privado'), { code }); });
        const result = await request({ usuario: 'admin', password });
        assert.equal(result.statusCode, 503); assert.equal(result.headers['Set-Cookie'], undefined);
        assert.ok(!JSON.stringify(result.body).includes('privado'));
    }
});
test('compatibilidad de .env se limita a la tabla ausente, nunca a un usuario ausente', async () => {
    const previousUser = process.env.ADMIN_USER, previousHash = process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_USER = 'encargado'; process.env.ADMIN_PASSWORD_HASH = usuario.password_hash;
    try {
        const missing = harness(async () => { throw Object.assign(Error(), { code: 'ER_NO_SUCH_TABLE' }); });
        assert.equal((await missing({ usuario: 'encargado', password })).statusCode, 200);
        assert.equal((await harness(async () => [[]])({ usuario: 'encargado', password })).statusCode, 401);
    } finally {
        if (previousUser === undefined) delete process.env.ADMIN_USER; else process.env.ADMIN_USER = previousUser;
        if (previousHash === undefined) delete process.env.ADMIN_PASSWORD_HASH; else process.env.ADMIN_PASSWORD_HASH = previousHash;
    }
});
test('cinco intentos fallidos bloquean el sexto sin consultar MySQL', async () => {
    let consultas = 0;
    const request = harness(async () => { consultas++; return [[]]; });
    for (let i = 0; i < 5; i++) assert.equal((await request({ usuario: 'ausente', password })).statusCode, 401);
    assert.equal((await request({ usuario: 'ausente', password })).statusCode, 429);
    assert.equal(consultas, 5);
});
