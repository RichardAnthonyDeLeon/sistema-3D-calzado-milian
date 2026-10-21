(() => {
    "use strict";
    const estados = { pendiente: "Recibida", en_revision: "En revisión", cotizada: "Cotizada", aceptada: "Aceptada", rechazada: "No viable por el momento" };
    function node(tag, text, cls) { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
    function documento(data) {
        const report = node("article", null, "proposal-document");
        const header = node("header", null, "pd-header"), brand = node("div", "MILIAN", "pd-brand"); brand.append(node("span", "CALZADO HECHO A MANO"));
        const title = node("div", null, "pd-title"); title.append(node("span", "DISEÑO PERSONALIZADO"), node("h1", "Propuesta de diseño")); header.append(brand, title); report.append(header);
        const meta = node("div", null, "pd-meta"); meta.append(node("span", estados[data.estado] || "Recibida", "pd-badge"), node("span", new Date(data.fecha_registro || Date.now()).toLocaleString("es-GT", { timeZone: "America/Guatemala", dateStyle: "medium", timeStyle: "short" }) + " · Guatemala")); report.append(meta);
        report.append(node("h2", data.titulo, "pd-design-title"));
        const info = node("dl", null, "pd-info");
        for (const [label, value] of [["CLIENTE", data.nombre], ["CONTACTO", data.telefono], ["TALLA DESEADA", data.talla], ["COLOR", data.color]]) { const block = node("div"); block.append(node("dt", label), node("dd", value)); info.append(block); }
        report.append(info, node("h3", "LA IDEA", "pd-label"), node("p", data.descripcion, "pd-description"));
        const source = data.imagen || data.imagen_referencia;
        if (typeof source === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(source)) { report.append(node("h3", "REFERENCIA VISUAL", "pd-label")); const image = node("img", null, "pd-image"); image.src = source; image.alt = "Imagen de referencia de la propuesta"; report.append(image); }
        const footer = node("footer", null, "pd-footer"); footer.append(node("strong", "Tu idea. Nuestro oficio."), node("p", "Esta propuesta queda sujeta a revisión de viabilidad, materiales, precio y tiempos de entrega. No confirma fabricación, compra ni pago.")); report.append(footer);
        return report;
    }
    function abrir(data) {
        const dialog = node("dialog", null, "proposal-document-dialog"); dialog.setAttribute("aria-label", "Vista previa de propuesta de diseño");
        const toolbar = node("div", null, "pd-toolbar"), label = node("span", "Tu propuesta, lista para compartir.");
        const print = node("button", "Imprimir / Guardar PDF", "pd-print"), close = node("button", "Cerrar", "pd-close"); print.type = close.type = "button";
        toolbar.append(label, print, close); const report = documento(data); dialog.append(toolbar, report); document.body.append(dialog);
        const previous = document.activeElement;
        function cerrar() { dialog.close(); dialog.remove(); document.getElementById("proposalPrintDocument")?.remove(); previous?.focus(); }
        close.addEventListener("click", cerrar); dialog.addEventListener("cancel", event => { event.preventDefault(); cerrar(); });
        print.addEventListener("click", async () => {
            document.getElementById("printOrderReport")?.remove(); document.getElementById("proposalPrintDocument")?.remove();
            const copy = report.cloneNode(true); copy.id = "proposalPrintDocument"; copy.hidden = true; document.body.append(copy);
            await Promise.all(Array.from(copy.querySelectorAll("img"), image => image.decode().catch(() => {})));
            dialog.close();
            window.addEventListener("afterprint", () => { copy.remove(); if (dialog.isConnected) dialog.showModal(); }, { once: true });
            window.print();
        });
        dialog.showModal();
    }
    function boton(data) { const button = node("button", "Ver propuesta / Guardar PDF", "proposal-pdf-button"); button.type = "button"; button.addEventListener("click", () => abrir(data)); return button; }
    window.milianDocumentoPropuesta = { boton };
})();
