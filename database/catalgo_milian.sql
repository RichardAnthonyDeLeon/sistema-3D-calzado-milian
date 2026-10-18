-- ============================================================
-- PROYECTO: CATÁLOGO WEB CON REALIDAD AUMENTADA
-- NEGOCIO: ZAPATERÍA MILIAN
-- BASE DE DATOS: catalogo_milian
-- MOTOR: MySQL 8.0+
-- ============================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS catalogo_milian
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE catalogo_milian;

-- ============================================================
-- TABLA: productos
-- ============================================================

CREATE TABLE IF NOT EXISTS productos (
    id_producto INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(100) DEFAULT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) DEFAULT NULL,
    tallas VARCHAR(150) DEFAULT NULL,
    colores VARCHAR(150) DEFAULT NULL,
    imagen VARCHAR(255) DEFAULT NULL,
    modelo_3d VARCHAR(255) DEFAULT NULL,
    disponible TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTOS INICIALES
-- ============================================================

-- Las tallas y colores se almacenan como cadenas JSON
-- porque el backend/frontend actual utiliza ese formato.

INSERT INTO productos (
    id_producto,
    nombre,
    marca,
    categoria,
    descripcion,
    precio,
    tallas,
    colores,
    imagen,
    modelo_3d,
    disponible
)
VALUES

-- PRODUCTO 1
(
    14,
    'Botín Casual de Cuero Negro',
    'Zapatería Milian',
    'Casual · Cuero negro',
    'Botín casual de estilo clásico, ideal para complementar diferentes atuendos.',
    425.00,
    '["35","36","37","38","39","40","41","42","43","44","45"]',
    '["Según fotografía","Negro","Café"]',
    'imagenes/1.jpeg',
    'modelos/botita.glb?v=2',
    1
),

-- PRODUCTO 2
(
    15,
    'Zapato Formal Clásico',
    'Zapatería Milian',
    'Formal · Piel lisa',
    'Calzado formal de diseño elegante, ideal para ocasiones especiales y uso profesional.',
    385.00,
    '["35","36","37","38","39","40","41","42","43","44","45"]',
    '["Según fotografía","Negro","Café"]',
    'imagenes/2.jpeg',
    'modelos/2.glb?v=2',
    1
),

-- PRODUCTO 3
(
    16,
    'Zapato Oxford Elegante',
    'Zapatería Milian',
    'Elegante · Charol',
    'Zapato de estilo Oxford con acabado elegante, ideal para eventos y ocasiones formales.',
    450.00,
    '["35","36","37","38","39","40","41","42","43","44","45"]',
    '["Según fotografía","Negro","Café"]',
    'imagenes/3.jpeg',
    'modelos/3.glb?v=2',
    1
),

-- PRODUCTO 4
(
    17,
    'Zapato Artesanal Clásico',
    'Zapatería Milian',
    'Calzado artesanal',
    'Calzado de estilo artesanal con diseño tradicional.',
    350.00,
    '["35","36","37","38","39","40","41","42","43","44","45"]',
    '["Según fotografía","Negro","Café"]',
    'imagenes/4.jpeg',
    'modelos/4.glb?v=2',
    1
),

-- PRODUCTO 5
(
    18,
    'Zapato Casual Artesanal',
    'Zapatería Milian',
    'Calzado artesanal',
    'Zapato casual de estilo artesanal para diferentes ocasiones.',
    375.00,
    '["35","36","37","38","39","40","41","42","43","44","45"]',
    '["Según fotografía","Negro","Café"]',
    'imagenes/6.jpeg',
    'modelos/6.glb?v=2',
    1
),

-- PRODUCTO 6
(
    19,
    'Zapato Artesanal Premium',
    'Zapatería Milian',
    'Calzado artesanal',
    'Calzado artesanal de diseño elegante y estilo distinguido.',
    425.00,
    '["35","36","37","38","39","40","41","42","43","44","45"]',
    '["Según fotografía","Negro","Café"]',
    'imagenes/7.jpeg',
    'modelos/7.glb?v=2',
    1
)

ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    marca = VALUES(marca),
    categoria = VALUES(categoria),
    descripcion = VALUES(descripcion),
    precio = VALUES(precio),
    tallas = VALUES(tallas),
    colores = VALUES(colores),
    imagen = VALUES(imagen),
    modelo_3d = VALUES(modelo_3d),
    disponible = VALUES(disponible);

-- ============================================================
-- AJUSTAR AUTO_INCREMENT
-- ============================================================

ALTER TABLE productos AUTO_INCREMENT = 20;

-- ============================================================
-- VERIFICAR LOS PRODUCTOS
-- ============================================================

SELECT
    id_producto,
    nombre,
    marca,
    categoria,
    precio,
    disponible
FROM productos
ORDER BY id_producto;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================