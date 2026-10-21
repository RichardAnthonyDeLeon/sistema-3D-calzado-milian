(() => {
    "use strict";
    const form = document.getElementById("proposalForm"), feedback = document.getElementById("proposalFeedback");
    const fileInput = document.getElementById("proposalImage"), preview = document.getElementById("proposalImagePreview");
    let imagen = null, imageTask = Promise.resolve();
    const read = file => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error("No se pudo leer la imagen.")); r.readAsDataURL(file); });
    fileInput.addEventListener("change", () => {
        imagen = null; preview.hidden = true; preview.removeAttribute("src"); fileInput.setCustomValidity("");
        const file = fileInput.files[0];
        imageTask = (async () => {
            if (!file) return;
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 500 * 1024) { fileInput.setCustomValidity("Elige una imagen JPG, PNG o WebP de hasta 500 KB."); fileInput.reportValidity(); return; }
            try { const value = await read(file); if (fileInput.files[0] !== file) return; imagen = value; preview.src = imagen; preview.hidden = false; }
            catch { fileInput.setCustomValidity("No se pudo leer la imagen. Selecciona otro archivo."); }
        })();
    });
    function element(tag, text, cls) { const e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; return e; }
    form.addEventListener("submit", async event => {
        event.preventDefault(); await imageTask;
        const data = Object.fromEntries(new FormData(form)); delete data[''];
        data.consentimiento = form.elements.consentimiento.checked;
        if (imagen) data.imagen = imagen;
        const error = window.milianValidaciones.propuesta(data); feedback.textContent = error;
        if (error || !form.reportValidity()) return;
        const button = form.querySelector("button[type=submit]"); button.disabled = true; feedback.textContent = "Guardando tu idea…";
        try {
            const result = await window.milianApi.leer(await fetch("/api/propuestas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) }));
            if (typeof result.folio !== "string") throw new Error("No se recibió confirmación. Consulta al negocio antes de reenviar.");
            feedback.replaceChildren(); const card = element("div", "", "proposal-success");
            card.append(element("span", "✓ PROPUESTA RECIBIDA", "proposal-eyebrow"), element("h3", "Tu idea ya tiene un comienzo."), element("p", "La revisaremos y te contactaremos al teléfono que nos compartiste."));
            feedback.append(card);
            form.reset(); imagen = null; preview.hidden = true; preview.removeAttribute("src");
        } catch (error) { feedback.textContent = ["TimeoutError", "AbortError"].includes(error.name) ? "No recibimos confirmación. Consulta al negocio antes de reenviar para evitar duplicados." : error.message; }
        finally { button.disabled = false; }
    });
})();
