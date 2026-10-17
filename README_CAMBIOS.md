# Zapatería Milian — versión con carrito y pedidos por WhatsApp

## Cambios
- Carrito con talla, color, cantidades, eliminación y persistencia local.
- Formulario de entrega o recogida, consentimiento y generación de mensaje de WhatsApp.
- Se conservaron el visor 3D, modelos y el código original.

## CONFIGURACIÓN OBLIGATORIA
En `js/carrito.js`, cambia `const WHATSAPP_NUMBER="";` por el número real del negocio, por ejemplo `"50212345678"` (ejemplo ficticio). Sin este cambio el formulario no abrirá WhatsApp.

## Ejecución
Sirve la carpeta con un servidor HTTP local (por ejemplo `python3 -m http.server 8080`) y abre `http://localhost:8080`. Los modelos 3D pueden fallar si se abre el HTML directamente como archivo local.

## Notas
- No se incluyeron `.env`, `.git` ni `node_modules` en el ZIP de entrega. Si necesitas el backend original, conserva su `.env` de forma privada y ejecuta `npm install` dentro de `backend`.
- El backend MySQL y la autenticación original siguen en el código, pero **no son necesarios para comprar por WhatsApp**. Se dejaron intactos para evitar romper trabajo previo.
- Las tallas 35–45 y los colores del selector son **ejemplos**: confirmar tallas, colores, precios y existencias reales antes de publicar.
- El sitio no confirma automáticamente que el cliente haya enviado el mensaje ni registra pedidos en una base de datos.
- Los códigos QR, las pruebas en dispositivos reales y la publicación HTTPS quedan pendientes.
- Verifica que la modalidad de pago contra entrega/transferencia sea ofrecida realmente antes de anunciarla.
