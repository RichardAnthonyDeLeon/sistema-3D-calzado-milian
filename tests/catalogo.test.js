const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../js/catalogo.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const originals = [...html.matchAll(/<article\s+class="product-card[\s\S]*?<\/article>/g)].map(([article]) =>
    Object.fromEntries([...article.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value])));

function rows() {
    return originals.map((card, i) => ({ id_producto: Number(card.idProducto), nombre: `Nombre nuevo ${i}`,
        categoria: `Categoría nueva ${i}`, descripcion: `Descripción ${i}`, precio: String(425 + i),
        imagen: `imagenes/nueva-${i}.jpeg`, modelo_3d: `modelos/nuevo-${i}.glb?v=2`,
        tallas: '["38","40"]', colores: ["Negro"], disponible: 1 }));
}

async function load(data, { offline = false, selected = 0 } = {}) {
    function node() { return { textContent: "original", setAttribute(key, value) { this[key] = value; } }; }
    const cards = originals.map((dataset, i) => {
        const nodes = Object.fromEntries([".product-data h3", ".product-data strong", ".product-category", ".product-image img", ".shop-add", ".product-description", ".product-arrow"].map(key => [key, node()]));
        for (const key of [".shop-size", ".shop-color"]) nodes[key] = { value: "", options: [{ value: "" }], replaceChildren(...options) { this.options = options; } };
        return { dataset: { ...dataset }, nodes, querySelector: key => nodes[key], classList: { contains: () => i === selected } };
    });
    const viewerCalls = [];
    const window = { location: new URL("https://catalogo.example/"), verProducto: (card, options) => viewerCalls.push({ card, options }) };
    vm.runInNewContext(source, { window, document: { querySelectorAll: () => cards }, URL, AbortController,
        setTimeout, clearTimeout, console: { warn() {} }, Option: function (text, value) { this.text = text; this.value = value; },
        fetch: async () => { if (offline) throw Error("offline"); return { ok: true, json: async () => data }; } });
    const updated = await window.milianCatalogoReady;
    return { cards, viewerCalls, updated };
}

test("HTML vincula las seis tarjetas a IDs 14–19 en el orden original", () => {
    assert.deepEqual(originals.map(card => card.idProducto), ["14", "15", "16", "17", "18", "19"]);
});

test("todos los nombres y precios cambian por ID aunque la API esté desordenada", async () => {
    for (const prefix of ["Nombre nuevo", "Segundo cambio"]) {
        const data = rows().map((row, i) => ({ ...row, nombre: `${prefix} ${i}`, precio: `${425 + i}.00` })).reverse();
        const { cards, updated } = await load(data);
        assert.equal(updated.length, 6);
        cards.forEach((card, i) => {
            assert.equal(card.dataset.name, `${prefix} ${i}`);
            assert.equal(card.nodes[".product-data h3"].textContent, card.dataset.name);
            assert.equal(card.dataset.price, `Q ${(425 + i).toFixed(2)}`);
            assert.equal(card.nodes[".product-data strong"].textContent, card.dataset.price);
            assert.equal(card.dataset.idProducto, String(14 + i));
        });
    }
});

test("criterio ID 14: Botín Casual de Cuero Negro, Q425.00", async () => {
    const data = rows(); data[0].nombre = "Botín Casual de Cuero Negro"; data[0].precio = "425.00";
    const { cards } = await load(data);
    assert.equal(cards[0].dataset.name, data[0].nombre);
    assert.equal(cards[0].dataset.price, "Q 425.00");
});

test("sincroniza descripción, categoría, recursos, opciones y disponibilidad", async () => {
    const data = rows(); data[0].disponible = 0; data[1].precio = null;
    const { cards, viewerCalls } = await load(data, { selected: 2 });
    const card = cards[0];
    assert.equal(card.nodes[".product-description"].textContent, data[0].descripcion);
    assert.equal(card.dataset.category, data[0].categoria);
    assert.equal(card.nodes[".product-image img"].src, data[0].imagen);
    assert.equal(card.dataset.model, data[0].modelo_3d);
    assert.deepEqual(JSON.parse(card.dataset.sizes), ["38", "40"]);
    assert.deepEqual(JSON.parse(card.dataset.colors), ["Negro"]);
    assert.equal(card.dataset.disponible, "0");
    assert.equal(card.nodes[".shop-add"].disabled, true);
    assert.equal(cards[1].dataset.price, "Consultar precio");
    assert.equal(viewerCalls[0].card, cards[2]);
    assert.equal(viewerCalls[0].options.desplazar, false);
});

test("fallo de API conserva los datos originales", async () => {
    const { cards, updated, viewerCalls } = await load(null, { offline: true });
    assert.equal(updated.length, 0); assert.equal(viewerCalls.length, 0);
    cards.forEach((card, i) => assert.deepEqual(card.dataset, originals[i]));
});

test("ID ausente/duplicado no cruza productos aunque sus nombres coincidan", async () => {
    const data = rows(); data[1].nombre = data[0].nombre; data.push({ ...data[0] });
    const { cards } = await load(data);
    assert.equal(cards[0].dataset.name, originals[0].name);
    assert.equal(cards[1].dataset.name, data[1].nombre);
    assert.equal(cards[1].dataset.price, "Q 426.00");
});
