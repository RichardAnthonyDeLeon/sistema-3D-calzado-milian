# Integración del catálogo con MySQL

Se mantienen las seis tarjetas y su orden. `js/catalogo.js` consulta `/api/productos`
después de conectar el carrito; actualiza los datos sin reemplazar las tarjetas,
botones ni selectores. Conserva sus eventos y las selecciones válidas del usuario.
No cambia el carrito, WhatsApp, estilos ni model-viewer.

## Importación manual en Workbench

1. Conectar a la instancia local con las credenciales privadas habituales y hacer
   un respaldo de `catalogo_milian` (Server > Data Export).
2. Ejecutar `SHOW CREATE TABLE catalogo_milian.productos;`. Comprobar que
   `id_producto` se genera automáticamente, `precio` permite NULL, las columnas
   de tallas/colores aceptan las listas JSON (JSON o texto de longitud suficiente)
   y los campos omitidos permiten NULL o tienen defaults apropiados. Confirmar
   también motor transaccional InnoDB y soporte de caracteres UTF-8.
3. No se dispone del DDL real en el repositorio. Si alguna condición no se cumple,
   detener la importación y ajustar los valores al esquema con datos confirmados;
   no alterar la tabla ni inventar marca, descripción o existencias. El valor por
   defecto de `disponible` no constituye una comprobación de inventario.
4. Abrir [backend/importar_productos.sql](backend/importar_productos.sql) con
   File > Open SQL Script. Ejecutarlo completo en UNA sesión, sin importaciones
   simultáneas. No se ejecuta automáticamente desde Node.
5. Revisar Action Output y el SELECT final: seis nombres, precios 399/449/499 y
   tres NULL, listas y rutas originales. Si hay errores ejecutar `ROLLBACK;`.
   Si todo es correcto ejecutar `COMMIT;` en la misma conexión. El script deja
   intencionalmente la transacción pendiente para esta revisión.
6. Repetir el script no inserta nombres ya presentes. No asigna IDs manuales y
   no sobrescribe productos existentes. Si ya hay duplicados o datos distintos,
   revisarlos manualmente: el cargador no aplica una respuesta ambigua.

Las etiquetas visuales y textos alternativos se conservan en el HTML. Las tallas
y colores son los existentes, originalmente documentados como ejemplos; su
importación no confirma disponibilidad comercial.

## Iniciar backend y frontend

El backend necesita la configuración privada existente: DB_HOST, DB_PORT,
DB_USER, DB_PASSWORD y DB_NAME (`catalogo_milian`). No se modificó ningún .env.
Si falta esa configuración, recuperarla de la instalación privada; no incluirla
en el repositorio ni enviarla al navegador.

En una terminal, desde la raíz del proyecto:

```powershell
cd backend
npm ci
npm start
```

`npm ci` solo es necesario si faltan las dependencias del lockfile. No se agregó
ninguna dependencia. El puerto predeterminado es 3000, salvo configuración previa.
El mensaje «Conexión con MySQL establecida.» indica que el pool ejecutó SELECT 1;
el servidor no inicia si falla esa comprobación.

Abrir http://localhost:3000 en el navegador. Express sirve [index.html](index.html),
CSS, JavaScript, imágenes y modelos desde sus carpetas originales. No hace falta
Live Server. No se publica la carpeta raíz completa: backend, SQL, configuración
privada y documentación no son archivos públicos.
Si falla la consulta de productos, la página ya cargada conserva sus productos
originales. Si se detiene Express, tampoco se pueden solicitar nuevos archivos.

Prueba local del backend:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/productos
```

Debe devolver un arreglo con los registros reales, sus `id_producto`, precios
NULL y rutas. `/api` por sí solo no verifica la tabla productos. Un arreglo vacío
indica que no hay registros, y HTTP 500 indica fallo de la consulta; el endpoint
no envía detalles internos al navegador.

## Cloudflare Tunnel y móviles

La consulta usa `/api/productos`, relativa al origen de la página. El catálogo y
la API ahora se sirven desde Express: dirigir todo el túnel al puerto 3000.
Con Express encendido, para una prueba temporal con cloudflared ya instalado:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Abrir la URL HTTPS que imprime cloudflared en iPhone o Android. Mantener ambas
terminales abiertas. Esa URL sirve tanto el catálogo como `/api/productos` y los
GLB. No usar localhost en el teléfono; usar la URL HTTPS para probar AR.

Si se utiliza un túnel con hostname y configuración existente, cambiar su
destino al puerto 3000. Ya no se necesitan reglas separadas por ruta:

```yaml
ingress:
  - hostname: catalogo.ejemplo.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Conservar los demás ajustes privados del túnel. No se inició ni modificó ningún
túnel durante esta implementación.

Referencia: [reglas ingress de Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/).

No abrir puertos 3000/3306 en el router ni exponer MySQL. La API HTTP se consume a
través del túnel HTTPS existente, no conectando el navegador a MySQL. Mantener
el acceso directo al puerto de Node restringido por la configuración local/red.

Las consultas del catálogo y de autenticación utilizan `/api` en el mismo origen.
No requieren una URL de API adicional ni llamadas a localhost desde el teléfono.
Las rutas del servidor y su conexión privada permanecen sin cambios.

## Comprobación y límites

- En Network del navegador, comprobar GET HTTPS `/api/productos`, estado 200 y
  JSON. Ver `data-id-producto` en las seis tarjetas confirma la aplicación de
  los IDs de MySQL; ver los productos solamente NO prueba la conexión, porque
  existe un respaldo estático.
- Confirmar seis tarjetas en el orden original, precios actuales de MySQL y tres
  «Consultar precio», mismas imágenes y GLB con `?v=2`.
- Seleccionar talla/color, agregar, repetir variante, cambiar cantidad, eliminar
  y recargar. La estructura del carrito y su almacenamiento no cambiaron. Al agregar
  de nuevo una variante guardada, su precio se actualiza al de la tarjeta. Sin
  volver a agregarla, conserva el precio almacenado; el pedido requiere confirmación.
- El almacenamiento local pertenece al origen: al pasar de Live Server (5500)
  a Express (3000), o cambiar la URL del túnel, el carrito anterior permanece en
  el origen anterior. No se borra ni se migra automáticamente.
- Abrir cada producto en 3D y probar AR en iPhone y Android compatibles mediante
  HTTPS. Estas pruebas físicas siguen siendo necesarias.
- Apagar el backend o probar una respuesta inválida: después de un máximo de
  seis segundos de espera, las tarjetas originales siguen utilizables.
- Un producto ausente, duplicado o con precio/ID inválido conserva su tarjeta de
  respaldo; no bloquea los otros productos. Listas inválidas o rutas distintas
  conservan las opciones y archivos originales sin descartar el precio válido.
  Una respuesta global inválida o IDs repetidos mantiene el respaldo completo.
  Los precios NULL se muestran como «Consultar precio» y el carrito los rechaza.
- Los nombres originales sirven para la vinculación inicial; no renombrarlos en
  MySQL durante esta entrega. Se conservan los identificadores reales en `data-id-producto`.
  No es un catálogo de altas/bajas dinámicas ni un sistema de inventario: no se
  filtra por `disponible` ni se eliminan tarjetas, preservando el comportamiento actual.
- El número de WhatsApp está vacío en esta copia. No se cambió: impide completar
  la apertura del pedido hasta que se configure por separado con autorización.

La conexión real y la importación requieren la instalación privada. Las pruebas
automatizadas con respuestas simuladas no sustituyen esa verificación ni las
pruebas físicas de AR.

Validación realizada: `node --check` del servidor y del cargador; ejecución con
Node VM y respuestas simuladas para comprobar IDs reales con API desordenada,
precios/NULL, conservación de selectores y siete casos de respaldo (respuesta
vacía, incompleta, duplicada, precio/ruta/lista inválidos y fallo de red). También
se comprobó el endpoint con consulta simulada y error 500 sin detalles internos,
la existencia de las seis imágenes y seis GLB, y la ausencia de cambios en el
carrito, el visor original, los estilos y la conexión MySQL.

## Cierre de entrega: actualización visual y compartir (18/10/2026)

En una página nueva se comprobó con la API REAL que Heritage 01, ID 14, ya
mostraba Q400 antes de esta intervención. No se reprodujo el fallo histórico de
Q399, por lo que no se atribuye con certeza a caché ni a un dato concreto.
El cargador anterior sí descartaba TODOS los cambios ante un dato inválido en
cualquier producto. Ahora valida cada producto por separado y conserva solamente
los campos de respaldo que necesite. Se versionó el script del catálogo para
solicitar la nueva versión. `data-origen="mysql"` y `data-id-producto` identifican
las tarjetas actualizadas. La API se sigue consultando con `cache: "no-store"`.

«Compartir zapato» genera `?producto=ID` desde el origen HTTPS actual; rechaza
direcciones locales. Usa compartir nativo o copia al portapapeles, y ofrece un
campo seleccionable si el navegador deniega la copia. Los botones esperan la
consulta MySQL. Al abrir un enlace se selecciona el modelo después de esa consulta,
sin iniciar AR ni cámara. Los IDs inexistentes muestran un aviso. El túnel temporal
debe seguir activo y el enlace deja de funcionar cuando cambia su dominio.

Se agregó junto a las instrucciones la nota condicional de Android, conservando
model-viewer, sus modos AR y los mensajes existentes.

### Configurar WhatsApp

En [js/carrito.js](js/carrito.js), colocar el número REAL del negocio en la constante
`WHATSAPP_NUMBER` (actualmente vacía): 502 seguido de ocho dígitos, sin `+`, espacios
ni guiones. No se asignó ningún teléfono comercial ficticio. La validación actual
bloquea la apertura mientras no exista un número válido. No se envían mensajes
automáticamente ni se registran pedidos en MySQL.

### Pruebas de esta intervención

Ejecutar pruebas de compartir simuladas con `node --test tests/compartir.test.js`.

Ejecutadas contra Express/MySQL reales y navegador local:
- API: seis productos, IDs 14–19; Heritage 01 a Q400 en tarjeta, data-price y visor.
- Carrito: talla 38, Negro, precio Q400; tres unidades = Q1200; persistencia tras
  recargar, eliminación, y actualización de una variante guardada a Q399 al
  agregarla nuevamente con precio Q400 (dos unidades = Q800).
- NULL: rechazo al agregar al carrito; no se crean artículos gratuitos.
- Enlace directo a ID 16: Oxford 03, Q499, imagen y GLB correspondientes; ID
  inexistente: aviso. Se verificaron las referencias del visor para los seis modelos.
- 18 recursos HTTP (CSS/JS/imágenes/GLB) respondieron 200; cinco rutas privadas
  de configuración, backend y node_modules respondieron 404.
- Número WhatsApp vacío: mensaje de configuración y ninguna apertura.
- Viewport de 390 px: sin desbordamiento horizontal; botones dentro de pantalla.

Simuladas, sin alterar MySQL ni enviar mensajes:
- API a Q399 y lista inválida de otro producto: tarjeta y visor a Q399, manteniendo
  los seis IDs. Fallo de API: seis tarjetas originales, Q399 como respaldo.
- Siete pruebas Node de compartir: espera de MySQL, ID desconocido/fallo,
  compartir nativo, copia, copia manual, cancelación y rechazo de URLs locales.
- Generación de WhatsApp con configuración ficticia solo en memoria y apertura
  interceptada: nombre, talla, color, cantidad, precio y total correctos. Ningún
  número ficticio se guardó en el proyecto ni se contactó a un destinatario.

Pendientes: compartir nativo y portapapeles con permisos reales en móviles;
apertura desde otro dispositivo con el túnel HTTPS; renderizado y AR física en
iPhone/Android; pedido real de WhatsApp una vez configurado el teléfono.
El navegador integrado reconoció model-viewer, pero no confirmó `loaded=true`;
por ello la comprobación 3D se limita a referencias del visor y respuestas HTTP,
no a un renderizado visual completado. No se alteraron los GLB ni la configuración AR.
No se afirma haber probado cámara ni AR en un teléfono real.
