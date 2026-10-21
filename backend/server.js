require("dotenv").config();

const express = require("express");
const path = require("node:path");
const cors = require("cors");

const {
    conexion,
    probarConexion
} = require("./conexion");

const app = express();

const PORT =
    Number(process.env.PORT) || 3000;

// ========================================
// CONFIGURACIÓN
// ========================================

app.use(cors());

app.use(
    express.json({
        limit: "1mb"
    })
);

// ========================================
// RUTA DE PRUEBA
// ========================================

app.get("/api", (req, res) => {
    res.json({
        mensaje:
            "Servidor de Zapatería Milian funcionando."
    });
});

// ========================================
// PRODUCTOS
// ========================================

// Catálogo público: solo datos del producto, nunca configuración de MySQL.
app.get("/api/productos", async (req, res) => {
    try {
        const [productos] = await conexion.execute(`
            SELECT id_producto, nombre, marca, categoria, descripcion,
                   precio, tallas, colores, imagen, modelo_3d,
                   disponible, fecha_registro
            FROM productos
            ORDER BY id_producto
        `);
        res.json(productos);
    } catch {
        console.error("No se pudo consultar el catálogo de productos.");
        res.status(500).json({ mensaje: "No se pudieron obtener los productos." });
    }
});

// ========================================
// FRONTEND (solo carpetas públicas; no exponer backend ni archivos privados)
// ========================================

require("./solicitudes").registrarSolicitudes(app, conexion);

const frontendDir = path.resolve(__dirname, "..");

app.get(["/", "/index.html"], (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
});

app.get("/administracion", (req, res) => {
    res.set("Cache-Control", "no-store").sendFile(path.join(frontendDir, "administracion.html"));
});

for (const carpeta of ["css", "js", "imagenes", "modelos"]) {
    app.use(`/${carpeta}`, express.static(path.join(frontendDir, carpeta)));
}

// ========================================
// RUTA NO ENCONTRADA
// ========================================

app.use((req, res) => {
    res.status(404).json({
        mensaje:
            "Ruta no encontrada."
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

async function iniciarServidor() {
    try {
        await probarConexion();

        app.listen(PORT, () => {
            console.log(
                `Servidor funcionando en http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "No se pudo iniciar el servidor:",
            error
        );

        process.exit(1);
    }
}

iniciarServidor();
