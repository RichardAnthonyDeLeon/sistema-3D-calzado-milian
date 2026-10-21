(() => {
    "use strict";
    const $ = id => document.getElementById(id);
    const labels = { pendiente: "Recibida", en_revision: "En revisión", cotizada: "Cotizada", aceptada: "Aceptada", rechazada: "No viable" };
    let rows = [];
    function node(tag, text, cls) { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
    function view(logged) { $("loginView").hidden = logged; $("dashboard").hidden = !logged; if (!logged) { rows = []; $("proposalList").replaceChildren(); $("stats").replaceChildren(); $("loginForm").reset(); } window.dispatchEvent(new CustomEvent("milian:session", { detail: logged })); }
    async function api(url, options = {}) {
        const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", "X-Milian-Request": "1", ...options.headers }, credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(15000) });
        let data; try { data = await response.json(); } catch { throw Error("No se pudo acceder al servidor."); }
        if (!response.ok) { if (response.status === 401 && url !== "/api/admin/login") view(false); throw Error(data.mensaje || "No se pudo completar la solicitud."); }
        return data;
    }
    window.milianAdminApi = api;
    function render() {
        $("stats").replaceChildren();
        for (const [label, count] of [["Propuestas recientes", rows.length], ["Por revisar", rows.filter(x => x.estado === "pendiente").length], ["En conversación", rows.filter(x => ["en_revision", "cotizada"].includes(x.estado)).length], ["Aceptadas", rows.filter(x => x.estado === "aceptada").length]]) {
            const stat = node("div", null, "stat"); stat.append(node("span", label), node("strong", count)); $("stats").append(stat);
        }
        const query = $("search").value.trim().toLocaleLowerCase(), filter = $("stateFilter").value;
        const visible = rows.filter(x => (!filter || x.estado === filter) && [x.nombre, x.titulo].some(value => value.toLocaleLowerCase().includes(query)));
        $("proposalList").replaceChildren();
        if (!visible.length) { const empty = node("div", null, "empty"); empty.append(node("h2", rows.length ? "No encontramos esa idea." : "Aquí empieza lo próximo."), node("p", rows.length ? "Prueba con otro nombre o estado." : "Las propuestas de tus clientes aparecerán en este espacio.")); $("proposalList").append(empty); }
        for (const item of visible) {
            const card = node("article", null, "proposal-card"), top = node("div", null, "proposal-card-top");
            top.append(node("span", labels[item.estado] || item.estado, `badge ${item.estado}`), node("time", new Date(item.fecha_registro).toLocaleDateString("es-GT", { timeZone: "America/Guatemala", day: "numeric", month: "short", year: "numeric" })));
            card.append(top, node("h2", item.titulo), node("div", `${item.nombre} · ${item.telefono}`, "proposal-client"));
            const specs = node("div", null, "proposal-specs"); specs.append(node("span", `Talla ${item.talla}`), node("span", item.color)); card.append(specs, node("p", item.descripcion, "proposal-description"));
            if (typeof item.imagen_referencia === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(item.imagen_referencia)) { const image = node("img", null, "proposal-image"); image.src = item.imagen_referencia; image.alt = "Referencia del diseño"; card.append(image); }
            const actions = node("div", null, "card-actions"), label = node("label", "Estado de la propuesta"), select = node("select");
            for (const [value, text] of Object.entries(labels)) { const option = node("option", text); option.value = value; select.append(option); } select.value = item.estado; label.append(select); actions.append(label);
            const digits = item.telefono.replace(/\D/g, ""), phone = digits.length === 8 ? `502${digits}` : digits;
            if (/^502[2-7]\d{7}$/.test(phone)) { const link = node("a", "Contactar por WhatsApp ↗", "contact-link"); link.href = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${item.nombre}, te contactamos de Milián sobre tu propuesta «${item.titulo}».`)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; actions.append(link); }
            const status = node("p", "", "card-status"); status.setAttribute("role", "status");
            select.addEventListener("change", async () => {
                select.disabled = true; status.textContent = "Guardando…";
                try { await api(`/api/propuestas/${item.folio}`, { method: "PATCH", body: JSON.stringify({ estado: select.value }) }); item.estado = select.value; render(); $("dashboardStatus").textContent = "Estado actualizado."; }
                catch (e) { status.textContent = e.message; select.value = item.estado; } finally { select.disabled = false; }
            });
            card.append(actions, window.milianDocumentoPropuesta.boton(item), status); $("proposalList").append(card);
        }
    }
    async function load() { $("dashboardStatus").textContent = "Cargando propuestas…"; try { const data = await api("/api/propuestas"); if (!Array.isArray(data)) throw Error("Respuesta inválida."); rows = data; render(); $("dashboardStatus").textContent = `${rows.length} propuesta${rows.length === 1 ? "" : "s"} reciente${rows.length === 1 ? "" : "s"}.`; } catch (e) { $("dashboardStatus").textContent = e.message; } }
    $("loginForm").addEventListener("submit", async e => {
        e.preventDefault(); const form = e.currentTarget, button = form.querySelector('button[type="submit"]'); button.disabled = true; $("loginStatus").textContent = "Ingresando…";
        try { await api("/api/admin/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) }); form.reset(); $("loginStatus").textContent = ""; view(true); await load(); }
        catch (e) { $("loginStatus").textContent = e.message; } finally { button.disabled = false; }
    });
    $("showPassword").addEventListener("click", () => { const input = $("loginForm").elements.password, visible = input.type === "password"; input.type = visible ? "text" : "password"; $("showPassword").textContent = visible ? "Ocultar" : "Ver"; $("showPassword").setAttribute("aria-pressed", String(visible)); $("showPassword").setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña"); });
    $("logout").addEventListener("click", async () => { try { await api("/api/admin/logout", { method: "POST", body: "{}" }); view(false); } catch (e) { $("dashboardStatus").textContent = e.message; } });
    $("search").addEventListener("input", render); $("stateFilter").addEventListener("change", render); $("refresh").addEventListener("click", load);
    api("/api/admin/session").then(() => { view(true); load(); }).catch(() => view(false));
})();
