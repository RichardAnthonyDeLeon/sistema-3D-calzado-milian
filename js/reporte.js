(() => {
    "use strict";
    const money = value => `Q ${value.toFixed(2)}`;
    function limpiar() {
        document.getElementById("clientOrderReport")?.remove();
        document.getElementById("printOrderReport")?.remove();
    }
    function node(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }
    function campo(parent, label, value) {
        const field = node("div", "report-field");
        field.append(node("dt", "", label), node("dd", "", value)); parent.append(field);
    }
    function crear(data, result) {
        limpiar();
        const report = node("section", "client-order-report"); report.id = "clientOrderReport";
        const header = node("div", "report-header");
        const brand = node("div", "report-brand");
        brand.append(node("div", "report-wordmark", "MILIAN"), node("div", "report-kicker", "CALZADO HECHO A MANO"));
        const heading = node("div", "report-heading");
        heading.append(node("span", "report-kicker", "RESUMEN PARA EL CLIENTE"), node("h3", "", "Solicitud de pedido"));
        header.append(brand, heading); report.append(header);
        const meta = node("div", "report-meta");
        meta.append(node("span", "report-status", "PENDIENTE DE CONFIRMACIÓN"), node("span", "report-date", new Date().toLocaleString("es-GT", { timeZone: "America/Guatemala", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " · Guatemala"));
        report.append(meta);
        const info = node("div", "report-info");
        const client = node("div", "report-info-block"); client.append(node("h4", "report-section-title", "01 / CLIENTE"));
        const clientFields = node("dl", "report-fields");
        campo(clientFields, "Nombre completo", data.nombre.trim()); campo(clientFields, "Teléfono", data.telefono.trim()); client.append(clientFields);
        const delivery = node("div", "report-info-block"); delivery.append(node("h4", "report-section-title", "02 / ENTREGA Y PAGO"));
        const deliveryFields = node("dl", "report-fields");
        campo(deliveryFields, "Modalidad", data.entrega === "domicilio" ? "Envío a domicilio" : "Recoger en tienda");
        if (data.entrega === "domicilio") {
            campo(deliveryFields, "Dirección", `${data.direccion.trim()}, ${data.municipio.trim()}, ${data.departamento.trim()}`);
            if (data.referencia?.trim()) campo(deliveryFields, "Referencia", data.referencia.trim());
        }
        campo(deliveryFields, "Pago preferido", data.pago); delivery.append(deliveryFields); info.append(client, delivery); report.append(info);
        report.append(node("h4", "report-section-title report-products-title", "03 / DETALLE DEL PEDIDO"));
        const wrap = node("div", "report-table-wrap");
        const table = node("table", "report-table");
        const caption = node("caption", "report-sr-only", "Productos solicitados y precios en quetzales"); table.append(caption);
        const head = node("thead"); const headRow = node("tr");
        for (const label of ["Producto", "Cant.", "Precio", "Subtotal"]) { const th = node("th", "", label); th.scope = "col"; headRow.append(th); }
        head.append(headRow); table.append(head);
        const tbody = node("tbody");
        for (const item of result.productos) {
            const row = node("tr"); const product = node("td", "report-product");
            product.append(node("strong", "", item.nombre), node("span", "report-variant", `Talla ${item.talla} · ${item.color}`));
            row.append(product, node("td", "report-number", String(item.cantidad)), node("td", "report-number", money(item.precio)), node("td", "report-number report-subtotal", money(item.subtotal))); tbody.append(row);
        }
        table.append(tbody); wrap.append(table); report.append(wrap);
        const summary = node("div", "report-summary");
        const note = node("p", "report-shipping-note", "Envío no incluido. El negocio confirmará disponibilidad, costo final y fecha de entrega.");
        const total = node("div", "report-total"); total.append(node("span", "report-kicker", "TOTAL DE PRODUCTOS"), node("strong", "", money(result.total))); summary.append(note, total); report.append(summary);
        if (data.comentarios?.trim()) {
            const comments = node("div", "report-comments"); comments.append(node("h4", "report-section-title", "COMENTARIOS"), node("p", "", data.comentarios.trim())); report.append(comments);
        }
        const footer = node("div", "report-footer");
        footer.append(node("strong", "", "Gracias por elegir el trabajo artesanal."), node("p", "", "Solicitud pendiente de envío y confirmación. Este documento no es una factura ni un comprobante de pago.")); report.append(footer);
        const button = node("button", "checkout-button report-print-button", "Imprimir reporte / Guardar PDF"); button.type = "button";
        button.addEventListener("click", () => {
            document.getElementById("printOrderReport")?.remove();
            const printable = report.cloneNode(true); printable.id = "printOrderReport";
            printable.querySelector("button").remove(); printable.hidden = true;
            document.body.append(printable); window.print();
        });
        report.append(button); document.querySelector(".cart-panel").append(report);
    }
    window.milianReporte = { crear, limpiar };
})();
