-- Tablas nuevas; conserva productos, usuarios y propuestas existentes.
CREATE TABLE IF NOT EXISTS pedidos (
 id_pedido BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 solicitud_id CHAR(36) NOT NULL UNIQUE,
 hash_solicitud CHAR(64) NOT NULL,
 nombre VARCHAR(100) NOT NULL,
 telefono VARCHAR(25) NOT NULL,
 entrega VARCHAR(20) NOT NULL,
 datos_entrega JSON NOT NULL,
 pago VARCHAR(100) NOT NULL,
 comentarios VARCHAR(250) NOT NULL DEFAULT '',
 productos JSON NOT NULL,
 total DECIMAL(12,2) NOT NULL,
 estado ENUM('recibido','confirmado','en_elaboracion','listo','entregado','cancelado') NOT NULL DEFAULT 'recibido',
 notas_internas VARCHAR(1000) NOT NULL DEFAULT '',
 fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX pedidos_fecha(fecha_registro), INDEX pedidos_estado(estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS negocio_config (
 id TINYINT NOT NULL PRIMARY KEY,
 contenido JSON NOT NULL,
 fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
