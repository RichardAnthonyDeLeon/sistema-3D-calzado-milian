const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../js/compartir.js"), "utf8");
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup({ url = "https://catalogo.example/?producto=14", navigator = {}, id = "14" } = {}) {
    const button = { disabled: true, addEventListener(type, callback) { this.click = callback; } };
    const status = { textContent: "" };
    const input = { hidden: true, addEventListener() {}, focus() {}, select() { this.selected = true; } };
    const message = { hidden: true, textContent: "" };
    const nodes = { ".shop-share": button, ".share-status": status, ".share-link": input };
    const card = { dataset: { name: "Heritage 01", idProducto: id }, querySelector: selector => nodes[selector] };
    let resolve;
    const selected = [];
    const ready = new Promise(done => { resolve = done; });
    vm.runInNewContext(source, {
        URL, navigator,
        document: { querySelectorAll: () => [card], getElementById: () => message },
        window: { location: new URL(url), milianCatalogoReady: ready, verProducto: value => selected.push(value) }
    });
    return { button, status, input, message, card, selected,
        finish: async () => { resolve(id ? [card] : []); await tick(); },
        click: () => button.click({ preventDefault() {}, stopPropagation() {} }) };
}

test("espera MySQL y selecciona el ID real al abrir un enlace", async () => {
    const h = setup();
    assert.equal(h.selected.length, 0);
    await h.finish();
    assert.equal(h.selected[0], h.card);
    assert.equal(h.button.disabled, false);
});

test("ID desconocido y API fallida no seleccionan otro producto", async () => {
    for (const options of [{ url: "https://catalogo.example/?producto=99" }, { id: undefined }, { id: "" }]) {
        if (options.id === undefined && !options.url) options.id = "";
        const h = setup(options);
        await h.finish();
        assert.equal(h.selected.length, 0);
        assert.equal(h.message.hidden, false);
    }
});

test("comparte URL HTTPS del origen actual e ID de MySQL", async () => {
    let shared;
    const h = setup({ navigator: { share: async data => { shared = data; } } });
    await h.finish(); await h.click();
    assert.equal(shared.url, "https://catalogo.example/?producto=14");
    assert.match(shared.title, /Heritage 01/);
});

test("copia cuando no hay compartir nativo y confirma", async () => {
    let copied;
    const h = setup({ navigator: { clipboard: { writeText: async value => { copied = value; } } } });
    await h.finish(); await h.click();
    assert.equal(copied, "https://catalogo.example/?producto=14");
    assert.match(h.status.textContent, /Enlace copiado/);
});

test("permite copia manual si el portapapeles está bloqueado", async () => {
    const h = setup();
    await h.finish(); await h.click();
    assert.equal(h.input.hidden, false);
    assert.equal(h.input.selected, true);
    assert.equal(h.input.value, "https://catalogo.example/?producto=14");
});

test("cancelar compartir no copia sin solicitud", async () => {
    const h = setup({ navigator: { share: async () => { throw { name: "AbortError" }; } } });
    await h.finish(); await h.click();
    assert.equal(h.input.hidden, true);
    assert.equal(h.status.textContent, "");
    assert.equal(h.button.disabled, false);
});

test("no genera enlaces locales ni HTTP", async () => {
    for (const url of ["http://localhost:3000", "https://localhost", "https://127.0.0.1", "https://192.168.1.2", "http://catalogo.example"]) {
        const h = setup({ url, navigator: { share: async () => assert.fail("No debe compartir") } });
        await h.finish(); await h.click();
        assert.match(h.status.textContent, /HTTPS público/);
    }
});
