-- Ejecutar sobre la base de datos configurada para el sistema.
-- Agrega una tabla; no modifica productos ni elimina registros.
CREATE TABLE IF NOT EXISTS propuestas_disenos (
    id_propuesta BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    folio CHAR(36) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(25) NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    talla VARCHAR(30) NOT NULL,
    color VARCHAR(80) NOT NULL,
    estado ENUM('pendiente', 'en_revision', 'aceptada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
