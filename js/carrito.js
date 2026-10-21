(()=>{
"use strict";
// Reemplazar por el número del negocio en formato internacional, sin + ni espacios (Guatemala: 502XXXXXXXX).
const WHATSAPP_NUMBER="50249498131";
const KEY="milian_carrito_v1";
const $=id=>document.getElementById(id);
const overlay=$("cartOverlay"), items=$("cartItems"),form=$("checkoutForm"),feedback=$("cartFeedback");
let cart=[];
let sending=false, requestSignature="", requestKey="";
try{const saved=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(saved))cart=saved.filter(x=>x&&typeof x.name==="string"&&Number.isFinite(x.price)&&x.price>=0&&Number.isInteger(x.qty)&&x.qty>0).slice(0,100)}catch(e){cart=[]}
const money=n=>"Q "+n.toFixed(2);
const total=()=>cart.reduce((sum,x)=>sum+x.price*x.qty,0);
function save(){window.milianReporte.limpiar();feedback.replaceChildren();try{localStorage.setItem(KEY,JSON.stringify(cart))}catch(e){}render()}
function render(){items.replaceChildren();let count=0;cart.forEach((item,i)=>{count+=item.qty;const row=document.createElement("div");row.className="cart-line";const info=document.createElement("div");const name=document.createElement("strong");name.textContent=item.name;const detail=document.createElement("p");detail.textContent=`Talla ${item.size} · ${item.color} · ${money(item.price)} c/u`;info.append(name,detail);const controls=document.createElement("div");const qty=document.createElement("input");qty.type="number";qty.min="1";qty.max="99";qty.value=item.qty;qty.setAttribute("aria-label","Cantidad de "+item.name);qty.addEventListener("change",()=>{item.qty=Math.max(1,Math.min(99,Math.trunc(Number(qty.value)||1)));save()});const del=document.createElement("button");del.type="button";del.textContent="Eliminar";del.addEventListener("click",()=>{cart.splice(i,1);save()});controls.append(qty,del);row.append(info,controls);items.append(row)});if(!cart.length){const p=document.createElement("p");p.textContent="Tu carrito está vacío.";items.append(p)}$("cartCount").textContent=count;$("cartTotal").textContent=money(total());form.querySelector('button[type="submit"]').disabled=sending||!cart.length}
function open(){overlay.hidden=false;document.body.style.overflow="hidden";$("closeCart").focus()}
function close(){overlay.hidden=true;document.body.style.overflow="";$("openCart").focus()}
$("openCart").addEventListener("click",open);$("closeCart").addEventListener("click",close);overlay.addEventListener("click",e=>{if(e.target===overlay)close()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)close()});
document.querySelectorAll(".product-card").forEach((card,index)=>{const btn=card.querySelector(".shop-add");if(!btn)return;btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();const size=card.querySelector(".shop-size").value;const color=card.querySelector(".shop-color").value;if(!size){alert("Selecciona una talla antes de agregar el producto.");return}const name=card.dataset.name||"Zapato";const price=Number((card.dataset.price||"").replace(/[^\d.]/g,""));if(!Number.isFinite(price)||price<=0){alert("Este producto no tiene un precio válido.");return}if(card.dataset.disponible==="0"||btn.disabled){alert("Este producto no está disponible.");return}const id=`${card.dataset.idProducto}|${size}|${color}`;const existing=cart.find(x=>x.id===id);if(existing){existing.price=price;existing.name=name;existing.qty=Math.min(99,existing.qty+1);}else cart.push({id,id_producto:Number(card.dataset.idProducto),name,size,color,price,qty:1});save();open()});card.querySelectorAll(".shop-actions select").forEach(el=>el.addEventListener("click",e=>e.stopPropagation()))});
const delivery=$("deliveryType");function updateDelivery(){const required=delivery.value==="domicilio";$("deliveryFields").hidden=!required;$("deliveryFields").querySelectorAll("[name]").forEach(el=>{if(["departamento","municipio","direccion"].includes(el.name))el.required=required})}delivery.addEventListener("change",updateDelivery);updateDelivery();
form.addEventListener("submit", async e => {
 e.preventDefault(); feedback.replaceChildren(); window.milianReporte.limpiar();
 if (sending || !cart.length || !form.reportValidity()) return;
 const data = Object.fromEntries(new FormData(form));
 data.consentimiento = form.elements.consentimiento.checked;
 data.productos = cart.map(x => ({ id_producto: x.id_producto, talla: x.size, color: x.color, cantidad: x.qty }));
 const error = window.milianValidaciones.pedido(data);
 if (error) { feedback.textContent = error + " Si el carrito es antiguo, elimina los artículos y vuelve a agregarlos."; return; }
 if (!/^502\d{8}$/.test(WHATSAPP_NUMBER)) { feedback.textContent = "El negocio debe configurar su número de WhatsApp."; return; }
 const snapshot = JSON.stringify({ data, cart });
 if (requestSignature !== JSON.stringify(data)) { requestSignature=JSON.stringify(data); requestKey=crypto.randomUUID(); }
 sending=true;
 const button = form.querySelector('button[type="submit"]'); button.disabled = true;
 const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
 feedback.textContent = "Comprobando productos y guardando tu solicitud…";
 try {
  if (window.milianNegocioReady) await window.milianNegocioReady;
  const businessPhone = window.milianNegocio?.whatsapp || WHATSAPP_NUMBER;
  const response = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, solicitud_id:requestKey }), signal: controller.signal });
  const result = await window.milianApi.leer(response);
  if (snapshot !== JSON.stringify({ data: { ...Object.fromEntries(new FormData(form)), consentimiento: form.elements.consentimiento.checked, productos: cart.map(x => ({ id_producto: x.id_producto, talla: x.size, color: x.color, cantidad: x.qty })) }, cart })) throw new Error("La solicitud con los datos anteriores quedó guardada. Cambiaste el pedido durante el envío; revisa los datos antes de preparar otra solicitud.");
  if (result.guardado !== true || !Array.isArray(result.productos) || !result.productos.length || !Number.isFinite(result.total) || result.total <= 0 || result.productos.some(x => !x || typeof x.nombre !== "string" || !Number.isFinite(x.precio) || !Number.isFinite(x.subtotal))) throw new Error("El servidor devolvió un pedido inválido. Intenta nuevamente.");
  // No reutilizar precios locales: el mensaje utiliza la respuesta del catálogo vigente.
  const clean = key => String(data[key] || "").trim();
  const lines = ["*NUEVO PEDIDO - ZAPATERÍA MILIAN*", "", "*PRODUCTOS*"];
  result.productos.forEach((x, i) => lines.push(`${i+1}. ${x.nombre} | Talla: ${x.talla} | Color: ${x.color} | Cantidad: ${x.cantidad} | Unitario: ${money(x.precio)} | Subtotal: ${money(x.subtotal)}`));
  lines.push("", `*TOTAL DE PRODUCTOS: ${money(result.total)}*`, "Envío y disponibilidad final pendientes de confirmar.", "", "*CLIENTE*", `Nombre: ${clean("nombre")}`, `Teléfono: ${clean("telefono")}`, `Entrega: ${data.entrega === "domicilio" ? "A domicilio" : "Recoger en tienda"}`);
  if (data.entrega === "domicilio") lines.push(`Departamento: ${clean("departamento")}`, `Municipio: ${clean("municipio")}`, `Dirección: ${clean("direccion")}`, `Referencia: ${clean("referencia") || "Sin referencia"}`);
  lines.push(`Pago preferido: ${clean("pago")}`, `Comentarios: ${clean("comentarios") || "Ninguno"}`, "", "Solicito confirmar disponibilidad, costo final y entrega.");
  feedback.replaceChildren();
  const ready = document.createElement("span"); ready.className = "whatsapp-ready";
  const status = document.createElement("span"); status.className = "whatsapp-status"; status.textContent = "✓ SOLICITUD GUARDADA";
  const title = document.createElement("strong"); title.className = "whatsapp-title"; title.textContent = "Tu solicitud ya está con Milián";
  const summary = document.createElement("span"); summary.className = "whatsapp-summary"; summary.textContent = `Total de productos: ${money(result.total)}`;
  const link = document.createElement("a"); link.className = "whatsapp-order-link";
  link.setAttribute("aria-label", "Abrir pedido en WhatsApp en una nueva pestaña");
  const icon = document.createElement("span"); icon.className = "whatsapp-icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = "↗";
  const label = document.createElement("span"); label.textContent = "Abrir pedido en WhatsApp";
  link.append(label, icon);
  const hint = document.createElement("span"); hint.className = "whatsapp-hint"; hint.textContent = "Guardamos tu solicitud. Abre WhatsApp y pulsa Enviar para coordinar con el negocio. El pedido, el envío y la disponibilidad aún deben confirmarse.";
  ready.append(status, title, summary, link, hint);
  link.href = `https://wa.me/${businessPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.milianReporte.crear(data, result);
  link.target = "_blank"; link.rel = "noopener noreferrer"; feedback.append(ready);
 } catch (error) {
  feedback.textContent = error.name === "AbortError" ? "La comprobación tardó demasiado. Intenta nuevamente." : error.message === "Failed to fetch" ? "No se pudo conectar para validar el pedido. Intenta nuevamente." : error.message;
 } finally { clearTimeout(timeout); sending=false; button.disabled = !cart.length; }
});
// Cualquier cambio invalida el enlace ya preparado para evitar enviar datos anteriores.
form.addEventListener("input", () => { feedback.replaceChildren(); window.milianReporte.limpiar(); });

render();
})();
