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
- Las solicitudes de pedido se registran al prepararlas. El sitio no confirma que el cliente haya enviado el mensaje de WhatsApp ni registra pagos automáticamente.
- Los códigos QR, las pruebas en dispositivos reales y la publicación HTTPS quedan pendientes.
- Verifica que la modalidad de pago contra entrega/transferencia sea ofrecida realmente antes de anunciarla.


## Propuestas, panel del negocio y pedidos

- Página pública: formulario de diseño con referencia JPG, PNG o WebP (hasta 500 KB), confirmación de recepción. El documento imprimible para guardar como PDF está disponible únicamente desde el panel del negocio. El negocio contacta al cliente por teléfono. Se retiraron la consulta pública por folio y los códigos visibles. El identificador interno se conserva para gestionar los registros existentes.
- Panel independiente: `/administracion`, con usuario y contraseña, sesión HttpOnly de 8 horas, cierre de sesión, filtros, búsqueda y cambio de estados. El enlace aparece en el pie de página. Solo muestra las últimas 100 propuestas.
- Configuración: `ADMIN_USER` y `ADMIN_PASSWORD_HASH` en `backend/.env`. El hash se guarda como `sal:hash_hex` usando scrypt de 64 bytes; no usar una contraseña en texto plano en ese campo. La clave administrativa anterior se migró al hash local y continúa siendo la contraseña del administrador. Las sesiones se cierran al reiniciar el servidor.
- Migraciones: en instalaciones anteriores ejecutar `database/002_propuestas.sql` y después `database/003_panel_propuestas.sql` una sola vez. No volver a ejecutar la segunda migración si la columna ya existe. En esta copia local ambas ya están aplicadas. El usuario de MySQL necesita SELECT e INSERT sobre propuestas y UPDATE únicamente sobre su campo estado, además de SELECT en productos.
- Estados: recibida, en revisión, cotizada, aceptada y no viable. Cambiar el estado no envía mensajes automáticamente. El enlace de WhatsApp prepara una conversación que el encargado debe enviar.
- No se confirma fabricación ni precio al enviar una propuesta. HTTPS debe usarse al publicar para proteger la sesión.
- `POST /api/pedidos` comprueba los datos y guarda la solicitud con precios de MySQL, dentro de una transacción. Una clave de reintento evita duplicar el mismo envío. No reserva inventario ni confirma pagos. La ruta anterior `/api/pedidos/validar` sigue siendo de consulta, pero el carrito usa el registro nuevo.
- Tras validar un pedido se muestra un reporte imprimible y un enlace a WhatsApp. El cliente debe pulsar Enviar. El reporte no es factura y el total excluye envío.
- Pruebas: `node --test tests/*.test.js` desde la raíz.


## Gestión del negocio

- Aplicar `database/004_gestion_negocio.sql` después de las migraciones de propuestas. En esta instalación local ya se aplicó. La migración solo crea tablas y no elimina registros existentes.
- Permisos MySQL adicionales del usuario de aplicación: SELECT/INSERT/UPDATE sobre `pedidos` y `negocio_config`; UPDATE de campos del catálogo sobre `productos`. La conexión continúa sin contraseña según la configuración local solicitada. No cambiar credenciales de otras bases.
- `Pedidos`: solicitudes recibidas, confirmadas, en elaboración, listas, entregadas o canceladas; notas internas y datos de entrega. Paginación de 50 registros. Los precios y artículos se conservan como una copia del momento de la solicitud.
- `Catálogo`: edición de los productos existentes, nombre, marca, categoría, descripción, precio, tallas, colores y disponibilidad. Las fotografías y modelos 3D se conservan. No se implementó un editor de modelos ni subida de productos nuevos.
- `Reportes`: cantidades y montos solicitados por estado y fecha de recepción, propuestas por estado, evolución diaria y descarga CSV. Son indicadores de solicitudes: no representan pagos cobrados. El período máximo es un año. Fechas de consulta en Guatemala; conexiones y nuevos timestamps en UTC. No se modificaron las fechas de registros anteriores.
- `Página pública`: nombre, WhatsApp, ubicación, horarios, historia, entregas, pagos, elaboración, cambios y cuidados. Las ubicaciones y horarios vacíos se ocultan. La galería usa productos existentes. Los testimonios solo se muestran al guardar testimonios reales con autorización; no hay reseñas ficticias.
- Los formularios de pedidos informan que los datos se guardan para seguimiento. Los testimonios y políticas deben ser completados por el negocio antes de publicar.
- No se envían WhatsApps automáticamente. Los enlaces abren el mensaje para revisión y envío manual.
- Las nuevas funciones usan la misma sesión del administrador y las rutas privadas siguen bloqueadas sin iniciar sesión. No cambió la contraseña actual del dueño.
