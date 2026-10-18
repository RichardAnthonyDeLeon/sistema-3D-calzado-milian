-- Importación MANUAL. Revisar primero SHOW CREATE TABLE productos y hacer respaldo.
-- No modifica el esquema ni actualiza/borra registros existentes.
-- tallas/colores se guardan como listas JSON (columnas JSON o texto compatible).
-- marca, descripcion, disponible y fecha_registro usan los defaults de la tabla.
-- Si un campo omitido es obligatorio y no tiene default, detenerse y confirmar
-- el dato real: no asignar marcas, descripciones ni existencias inventadas.
-- Ejecutar una sola sesión de importación a la vez.
USE catalogo_milian;
START TRANSACTION;

INSERT INTO productos (nombre, categoria, precio, tallas, colores, imagen, modelo_3d)
SELECT 'Heritage 01', 'Casual · Cuero negro', 399,
       '["35","36","37","38","39","40","41","42","43","44","45"]',
       '["Según fotografía","Negro","Café"]', 'imagenes/1.jpeg', 'modelos/botita.glb?v=2'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Heritage 01');

INSERT INTO productos (nombre, categoria, precio, tallas, colores, imagen, modelo_3d)
SELECT 'Classic 02', 'Formal · Piel lisa', 449,
       '["35","36","37","38","39","40","41","42","43","44","45"]',
       '["Según fotografía","Negro","Café"]', 'imagenes/2.jpeg', 'modelos/2.glb?v=2'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Classic 02');

INSERT INTO productos (nombre, categoria, precio, tallas, colores, imagen, modelo_3d)
SELECT 'Oxford 03', 'Elegante · Charol', 499,
       '["35","36","37","38","39","40","41","42","43","44","45"]',
       '["Según fotografía","Negro","Café"]', 'imagenes/3.jpeg', 'modelos/3.glb?v=2'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Oxford 03');

INSERT INTO productos (nombre, categoria, precio, tallas, colores, imagen, modelo_3d)
SELECT 'Modelo 04', 'Calzado artesanal', NULL,
       '["35","36","37","38","39","40","41","42","43","44","45"]',
       '["Según fotografía","Negro","Café"]', 'imagenes/4.jpeg', 'modelos/4.glb?v=2'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Modelo 04');

INSERT INTO productos (nombre, categoria, precio, tallas, colores, imagen, modelo_3d)
SELECT 'Modelo 06', 'Calzado artesanal', NULL,
       '["35","36","37","38","39","40","41","42","43","44","45"]',
       '["Según fotografía","Negro","Café"]', 'imagenes/6.jpeg', 'modelos/6.glb?v=2'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Modelo 06');

INSERT INTO productos (nombre, categoria, precio, tallas, colores, imagen, modelo_3d)
SELECT 'Modelo 07', 'Calzado artesanal', NULL,
       '["35","36","37","38","39","40","41","42","43","44","45"]',
       '["Según fotografía","Negro","Café"]', 'imagenes/7.jpeg', 'modelos/7.glb?v=2'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Modelo 07');

-- Revisar estos resultados ANTES de confirmar con COMMIT en Workbench.
SELECT id_producto, nombre, categoria, precio, tallas, colores, imagen, modelo_3d
FROM productos
WHERE nombre IN ('Heritage 01','Classic 02','Oxford 03','Modelo 04','Modelo 06','Modelo 07')
ORDER BY id_producto;
-- Ejecutar COMMIT; manualmente si todo es correcto, o ROLLBACK; ante errores.
