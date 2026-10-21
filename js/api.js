(function (root) {
    "use strict";
    const servidor = "No se pudo acceder al servidor del sistema. Inicia el backend y abre http://localhost:3000 (o el puerto configurado), en lugar de Live Server o el archivo HTML.";
    async function leer(response) {
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); }
        catch { throw new Error(servidor); }
        if (data === null || typeof data !== "object") throw new Error("El servidor devolvió una respuesta inválida. Intenta nuevamente.");
        if (!response.ok) {
            if ([404, 405, 501].includes(response.status)) throw new Error(servidor);
            throw new Error(typeof data.mensaje === "string" ? data.mensaje : "El servidor no pudo completar la solicitud. Intenta nuevamente.");
        }
        return data;
    }
    const api = { leer };
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.milianApi = api;
})(typeof window === "object" ? window : globalThis);
