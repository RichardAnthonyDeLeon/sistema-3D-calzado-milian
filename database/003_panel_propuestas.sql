-- Ejecutar una sola vez sobre catalogo_milian; conserva los registros existentes.
ALTER TABLE propuestas_disenos ADD COLUMN imagen_referencia MEDIUMTEXT NULL;
ALTER TABLE propuestas_disenos MODIFY estado ENUM('pendiente','en_revision','cotizada','aceptada','rechazada') NOT NULL DEFAULT 'pendiente';
