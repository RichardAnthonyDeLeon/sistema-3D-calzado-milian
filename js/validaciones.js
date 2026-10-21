(function (root) {
    "use strict";
    const texto = (value, min, max) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
    function cliente(data) {
        if (!data || !texto(data.nombre, 2, 100)) return "Ingresa un nombre de 2 a 100 caracteres.";
        if (typeof data.telefono !== "string" || !/^(?:\+?502[ -]?)?[2-7]\d{3}[ -]?\d{4}$/.test(data.telefono.trim())) return "Ingresa un teléfono de Guatemala de 8 dígitos, con prefijo 502 opcional.";
        return "";
    }
    function pedido(data) {
        const error = cliente(data); if (error) return error;
        if (!["domicilio", "recoger"].includes(data.entrega)) return "Selecciona una forma de entrega válida.";
        if (data.entrega === "domicilio" && (!texto(data.departamento, 2, 80) || !texto(data.municipio, 2, 80) || !texto(data.direccion, 5, 250))) return "Completa departamento, municipio y dirección de entrega.";
        if (!["Por coordinar", "Transferencia (sujeta a confirmación)", "Contra entrega (sujeto a confirmación)"].includes(data.pago)) return "Selecciona un método de pago válido.";
        if (data.consentimiento !== true) return "Acepta compartir tus datos para gestionar el pedido.";
        if (data.comentarios != null && !texto(data.comentarios || " ", 0, 250)) return "Los comentarios deben tener como máximo 250 caracteres.";
        if (data.referencia != null && !texto(data.referencia || " ", 0, 150)) return "La referencia debe tener como máximo 150 caracteres.";
        if (!Array.isArray(data.productos) || !data.productos.length || data.productos.length > 100) return "El pedido debe contener de 1 a 100 artículos.";
        if (data.productos.some(x => !x || !Number.isInteger(x.id_producto) || x.id_producto <= 0 || !Number.isInteger(x.cantidad) || x.cantidad < 1 || x.cantidad > 99 || !texto(x.talla, 1, 30) || !texto(x.color, 1, 80))) return "Revisa producto, talla, color y cantidad (1 a 99).";
        const claves = data.productos.map(x => JSON.stringify([x.id_producto, x.talla, x.color]));
        if (new Set(claves).size !== claves.length) return "Hay artículos repetidos en el pedido.";
        return "";
    }
    function propuesta(data) {
        const error = cliente(data); if (error) return error;
        if (!texto(data.titulo, 3, 120)) return "Escribe un título de 3 a 120 caracteres.";
        if (!texto(data.descripcion, 20, 2000)) return "Describe tu diseño usando entre 20 y 2000 caracteres.";
        if (!texto(data.talla, 1, 30) || !texto(data.color, 1, 80)) return "Indica la talla y el color de tu diseño.";
        if (data.consentimiento !== true) return "Acepta guardar tus datos para gestionar la propuesta.";
        return "";
    }
    const api = { cliente, pedido, propuesta };
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.milianValidaciones = api;
})(typeof window === "object" ? window : globalThis);
