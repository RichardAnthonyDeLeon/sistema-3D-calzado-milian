(() => {
    "use strict";

    const endpoint = "/api/productos";
    const cards = Array.from(document.querySelectorAll(".product-card"));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    function lista(value) {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        if (!Array.isArray(parsed) || parsed.some(item =>
            !["string", "number"].includes(typeof item) || !String(item).trim()
        )) throw new Error("Lista inválida");
        return parsed.map(String);
    }

    function ruta(value, folder) {
        if (typeof value !== "string" || !value.trim()) throw new Error("Ruta inválida");
        const url = new URL(value, window.location.href);
        if (url.origin !== window.location.origin || !url.pathname.startsWith(`/${folder}/`)) {
            throw new Error("Recurso fuera de las carpetas públicas");
        }
        return value;
    }

    function opciones(select, values, placeholder) {
        const current = select.value;
        const expected = placeholder ? ["", ...values] : values;
        if (Array.from(select.options).map(option => option.value).join("\u0000") === expected.join("\u0000")) return;
        // Conservar el select y sus eventos; actualizar únicamente sus opciones.
        const options = values.map(value => new Option(value, value));
        if (placeholder) options.unshift(new Option("Seleccionar", ""));
        select.replaceChildren(...options);
        select.value = expected.includes(current) ? current : expected[0];
    }

    async function cargar() {
        try {
            const url = new URL(endpoint, window.location.href);
            if (url.username || url.password ||
                (url.origin !== window.location.origin && url.protocol !== "https:") ||
                (window.location.protocol === "https:" && url.protocol !== "https:")) {
                throw new Error("Configuración de API inválida");
            }
            const response = await fetch(url.href, { signal: controller.signal, cache: "no-store" });
            if (!response.ok) throw new Error("API no disponible");
            const rows = await response.json();
            if (!Array.isArray(rows) || cards.length !== 6) throw new Error("Catálogo inválido");

            // Un registro incorrecto no debe impedir actualizar los otros zapatos.
            const updates = cards.flatMap(card => {
                try {
                    const matches = rows.filter(row => row && String(row.id_producto) === card.dataset.idProducto);
                    if (matches.length !== 1) throw new Error("Producto ausente o duplicado");
                    const row = matches[0];
                    if (!/^[1-9]\d*$/.test(String(row.id_producto)) ||
                        typeof row.nombre !== "string" || !row.nombre.trim() ||
                        typeof row.categoria !== "string" || !row.categoria.trim()) throw new Error("Datos inválidos");
                    const price = row.precio === null ? null : Number(row.precio);
                    if (row.precio !== null && (
                        !["number", "string"].includes(typeof row.precio) ||
                        String(row.precio).trim() === "" || !Number.isFinite(price) || price <= 0
                    )) throw new Error("Precio inválido");
                    const nodes = {
                        name: card.querySelector(".product-data h3"),
                        price: card.querySelector(".product-data strong"),
                        category: card.querySelector(".product-category"),
                        image: card.querySelector(".product-image img"),
                        size: card.querySelector(".shop-size"),
                        color: card.querySelector(".shop-color"),
                        add: card.querySelector(".shop-add")
                    };
                    if (Object.values(nodes).some(node => !node)) throw new Error("Tarjeta incompleta");
                    const optionalList = (value, selector) => {
                        try { return lista(value); } catch {
                            console.warn(`Se conservan las opciones originales de ${row.nombre}.`);
                            return Array.from(card.querySelector(selector).options, option => option.value).filter(Boolean);
                        }
                    };
                    if (![true, false, 1, 0, "1", "0"].includes(row.disponible)) throw new Error("Disponibilidad inválida");
                    return [{
                        card, row, nodes,
                        priceText: price === null ? "Consultar precio" : `Q ${price.toFixed(2)}`,
                        available: [true, 1, "1"].includes(row.disponible),
                        sizes: optionalList(row.tallas, ".shop-size"), colors: optionalList(row.colores, ".shop-color"),
                        image: ruta(row.imagen, "imagenes"),
                        model: ruta(row.modelo_3d, "modelos")
                    }];
                } catch {
                    console.warn(`No se actualizó el producto ${card.dataset.idProducto}: comprobar ID único y datos válidos en la API.`);
                    return [];
                }
            });
            if (new Set(updates.map(update => String(update.row.id_producto))).size !== updates.length) throw new Error("Identificadores duplicados");

            updates.forEach(({ card, row, nodes, priceText, sizes, colors, image, model, available }) => {
                card.dataset.idProducto = String(row.id_producto);
                card.dataset.origen = "mysql";
                card.dataset.name = row.nombre;
                card.dataset.price = priceText;
                card.dataset.category = row.categoria;
                card.dataset.image = image;
                card.dataset.model = model;
                card.dataset.description = row.descripcion == null ? "" : String(row.descripcion);
                card.dataset.sizes = JSON.stringify(sizes);
                card.dataset.colors = JSON.stringify(colors);
                card.dataset.disponible = available ? "1" : "0";
                nodes.name.textContent = row.nombre;
                nodes.price.textContent = priceText;
                nodes.category.textContent = row.categoria;
                nodes.image.setAttribute("src", image);
                nodes.image.setAttribute("alt", row.nombre);
                const arrow = card.querySelector(".product-arrow");
                if (arrow) arrow.setAttribute("aria-label", `Ver ${row.nombre} en 3D`);
                const description = card.querySelector(".product-description");
                if (description) description.textContent = card.dataset.description;
                nodes.add.disabled = !available || sizes.length === 0 || colors.length === 0;
                nodes.add.textContent = nodes.add.disabled ? "No disponible" : "Agregar al carrito";
                opciones(nodes.size, sizes, true);
                opciones(nodes.color, colors, false);
            });
            // Reutilizar la selección existente sin desplazar ni activar AR.
            const selected = cards.find(card => card.classList.contains("selected")) || cards[0];
            if (updates.some(update => update.card === selected)) window.verProducto(selected, { desplazar: false });
            return updates.map(update => update.card);
        } catch {
            console.warn("No se actualizó el catálogo desde la API; se conservan los productos originales.");
            return [];
        } finally {
            clearTimeout(timeout);
        }
    }

    // Compartir espera a que termine la consulta, incluso cuando falle.
    window.milianCatalogoReady = cargar();
})();
