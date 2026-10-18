# Zapatería Milian — versión con carrito y pedidos por WhatsApp

## Cambios
- Carrito con talla, color, cantidades, eliminación y persistencia local.
- Formulario de entrega o recogida, consentimiento y generación de mensaje de WhatsApp.
- Se conservaron el visor 3D, modelos y el código original.

## CONFIGURACIÓN OBLIGATORIA
En `js/carrito.js`, cambia `const WHATSAPP_NUMBER="";` por el número real del negocio, por ejemplo `"50212345678"` (ejemplo ficticio). Sin este cambio el formulario no abrirá WhatsApp.

## Ejecución
Desde `backend`, ejecuta `npm start` y abre `http://localhost:3000`. Reinicia Express después de actualizar el código. El catálogo y la API son públicos y no requieren cuenta.

## Notas
- No se incluyeron `.env`, `.git` ni `node_modules` en el ZIP de entrega. Si necesitas el backend original, conserva su `.env` de forma privada y ejecuta `npm install` dentro de `backend`.
- Se eliminó la autenticación del frontend y del backend, incluidas las rutas `/api/login` y `/api/registro`. El catálogo, carrito, WhatsApp y compartir permanecen públicos. No se modificaron tablas ni credenciales MySQL.
- Las tallas 35–45 y los colores del selector son **ejemplos**: confirmar tallas, colores, precios y existencias reales antes de publicar.
- El sitio no confirma automáticamente que el cliente haya enviado el mensaje ni registra pedidos en una base de datos.
- Los códigos QR, las pruebas en dispositivos reales y la publicación HTTPS quedan pendientes.
- Verifica que la modalidad de pago contra entrega/transferencia sea ofrecida realmente antes de anunciarla.
