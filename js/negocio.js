(() => {
    "use strict";
    const n=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
    const $=id=>document.getElementById(id);
    function imagePath(path){try{const url=new URL(path,location.href);return url.origin===location.origin&&url.pathname.startsWith("/imagenes/")?url.href:null;}catch{return null;}}
    async function load(){
        try {
            const config=await window.milianApi.leer(await fetch("/api/negocio",{cache:"no-store",signal:AbortSignal.timeout(7000)}));
            window.milianNegocio=config;
            $("businessStory").textContent=config.historia || "Explora nuestra colección y conoce cada detalle.";
            $("businessWhatsapp").href=`https://wa.me/${config.whatsapp}`;
            for(const [id,label,value]of[["businessLocation","ENCUÉNTRANOS",config.ubicacion],["businessHours","HORARIOS",config.horarios]]){const el=$(id);el.hidden=!value;if(value){el.replaceChildren(n("span",label),n("p",value));}}
            $("businessFaq").replaceChildren();
            for(const [key,title]of[["envios","¿Cómo coordinamos la entrega?"],["pagos","¿Qué métodos de pago hay?"],["elaboracion","¿Cuánto tarda la elaboración?"],["cambios","¿Qué debo saber sobre cambios?"],["cuidados","¿Cómo cuido mi calzado?"]]){if(!config[key])continue;const d=n("details"),summary=n("summary",title);d.append(summary,n("p",config[key]));$("businessFaq").append(d);}
            const reviews=config.testimonios.filter(x=>x.autorizado===true&&x.nombre&&x.texto);$("opiniones").hidden=!reviews.length;$("businessReviews").replaceChildren();for(const item of reviews){const block=n("figure");block.append(n("blockquote",item.texto),n("figcaption",item.nombre));$("businessReviews").append(block);}
            try{const rows=await window.milianApi.leer(await fetch("/api/productos",{signal:AbortSignal.timeout(7000)}));const gallery=$("businessGallery");gallery.replaceChildren();for(const item of rows.filter(x=>config.galeria.includes(x.id_producto))){const path=imagePath(item.imagen);if(!path)continue;const figure=n("figure"),image=n("img");image.src=path;image.alt=item.nombre;image.loading="lazy";figure.append(image,n("figcaption",item.nombre));gallery.append(figure);}}catch{ $("businessInfoStatus").textContent="Algunas imágenes no están disponibles. Puedes explorar la colección más arriba."; }
            return config;
        }catch{ $("businessInfoStatus").textContent="No se pudo actualizar la información del negocio. Consulta los detalles por WhatsApp.";return null; }
    }
    window.milianNegocioReady=load();
})();
