(() => {
    "use strict";
    const cards = Array.from(document.querySelectorAll(".product-card"));

    function enlacePublico(id) {
        const url = new URL(window.location.pathname, window.location.origin);
        const host = url.hostname.toLowerCase();
        const local = host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
            /^(127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.includes(":") || !host.includes(".");
        if (url.protocol !== "https:" || local) return null;
        url.searchParams.set("producto", id);
        return url.href;
    }

    cards.forEach(card => {
        const button = card.querySelector(".shop-share");
        const status = card.querySelector(".share-status");
        const input = card.querySelector(".share-link");
        input.addEventListener("click", event => event.stopPropagation());
        button.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            status.textContent = "";
            input.hidden = true;
            const id = card.dataset.idProducto;
            if (!id) {
                status.textContent = "No se pudo obtener el identificador del producto. Recarga e intenta nuevamente.";
                return;
            }
            const url = enlacePublico(id);
            if (!url) {
                status.textContent = "Abre el catálogo desde su enlace HTTPS público para compartir este zapato.";
                return;
            }
            button.disabled = true;
            try {
                if (typeof navigator.share === "function") {
                    try {
                        await navigator.share({ title: `${card.dataset.name} · Zapatería Milian`, text: `Mira ${card.dataset.name} en nuestro catálogo 3D.`, url });
                        return;
                    } catch (error) {
                        if (error.name === "AbortError") return;
                    }
                }
                try {
                    await navigator.clipboard.writeText(url);
                    status.textContent = "Enlace copiado. Ya puedes compartirlo.";
                } catch {
                    input.value = url;
                    input.hidden = false;
                    input.focus();
                    input.select();
                    status.textContent = "Copia el enlace seleccionado para compartir este zapato.";
                }
            } finally {
                button.disabled = false;
            }
        });
    });

    Promise.resolve(window.milianCatalogoReady).then(updated => {
        cards.forEach(card => { card.querySelector(".shop-share").disabled = false; });
        const requested = new URL(window.location.href).searchParams.get("producto");
        if (requested === null) return;
        const selected = (updated || []).find(card => card.dataset.idProducto === requested);
        if (selected && typeof window.verProducto === "function") {
            // Solo selecciona el modelo; no inicia AR ni solicita cámara.
            window.verProducto(selected);
        } else {
            const message = document.getElementById("sharedProductStatus");
            message.hidden = false;
            message.textContent = "No se pudo encontrar el zapato compartido. Puedes explorar la colección o recargar la página.";
        }
    });
})();
