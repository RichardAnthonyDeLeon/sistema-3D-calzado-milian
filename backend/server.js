require("dotenv").config();

const express = require("express");
const path = require("node:path");
const cors = require("cors");
const bcrypt = require("bcryptjs");

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
        limit: "100kb"
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
// CREAR CUENTA
// ========================================

app.post(
    "/api/registro",
    async (req, res) => {
        try {
            const nombre = String(
                req.body.nombre || ""
            ).trim();

            const correo = String(
                req.body.correo || ""
            )
                .trim()
                .toLowerCase();

            const contrasena = String(
                req.body.contrasena || ""
            );

            // Validar campos vacíos

            if (
                !nombre ||
                !correo ||
                !contrasena
            ) {
                return res.status(400).json({
                    mensaje:
                        "Completa todos los campos."
                });
            }

            // Validar nombre

            if (nombre.length < 2) {
                return res.status(400).json({
                    mensaje:
                        "El nombre debe tener al menos 2 caracteres."
                });
            }

            // Validar correo

            const formatoCorreo =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!formatoCorreo.test(correo)) {
                return res.status(400).json({
                    mensaje:
                        "Ingresa un correo electrónico válido."
                });
            }

            // Validar contraseña

            if (contrasena.length < 8) {
                return res.status(400).json({
                    mensaje:
                        "La contraseña debe tener al menos 8 caracteres."
                });
            }

            // Comprobar si el correo ya existe

            const [usuariosExistentes] =
                await conexion.execute(
                    `
                        SELECT id_usuario
                        FROM usuarios
                        WHERE correo = ?
                        LIMIT 1
                    `,
                    [correo]
                );

            if (
                usuariosExistentes.length > 0
            ) {
                return res.status(409).json({
                    mensaje:
                        "Ya existe una cuenta con este correo."
                });
            }

            // Cifrar contraseña

            const contrasenaCifrada =
                await bcrypt.hash(
                    contrasena,
                    12
                );

            // Guardar usuario

            const [resultado] =
                await conexion.execute(
                    `
                        INSERT INTO usuarios
                        (
                            nombre,
                            correo,
                            contrasena
                        )
                        VALUES (?, ?, ?)
                    `,
                    [
                        nombre,
                        correo,
                        contrasenaCifrada
                    ]
                );

            return res.status(201).json({
                mensaje:
                    "Cuenta creada correctamente.",

                usuario: {
                    id: resultado.insertId,
                    nombre: nombre,
                    correo: correo
                }
            });

        } catch (error) {
            console.error(
                "Error al crear la cuenta:",
                error
            );

            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {
                return res.status(409).json({
                    mensaje:
                        "Ya existe una cuenta con este correo."
                });
            }

            return res.status(500).json({
                mensaje:
                    "No se pudo crear la cuenta."
            });
        }
    }
);

// ========================================
// INICIAR SESIÓN
// ========================================

app.post(
    "/api/login",
    async (req, res) => {
        try {
            const correo = String(
                req.body.correo || ""
            )
                .trim()
                .toLowerCase();

            const contrasena = String(
                req.body.contrasena || ""
            );

            // Validar campos

            if (!correo || !contrasena) {
                return res.status(400).json({
                    mensaje:
                        "Ingresa tu correo y contraseña."
                });
            }

            // Buscar usuario en MySQL

            const [usuarios] =
                await conexion.execute(
                    `
                        SELECT
                            id_usuario,
                            nombre,
                            correo,
                            contrasena
                        FROM usuarios
                        WHERE correo = ?
                          AND estado = TRUE
                        LIMIT 1
                    `,
                    [correo]
                );

            if (usuarios.length === 0) {
                return res.status(401).json({
                    mensaje:
                        "Correo o contraseña incorrectos."
                });
            }

            const usuario = usuarios[0];

            // Comparar contraseña

            const contrasenaCorrecta =
                await bcrypt.compare(
                    contrasena,
                    usuario.contrasena
                );

            if (!contrasenaCorrecta) {
                return res.status(401).json({
                    mensaje:
                        "Correo o contraseña incorrectos."
                });
            }

            // Enviar información al frontend

            return res.status(200).json({
                mensaje:
                    "Inicio de sesión correcto.",

                usuario: {
                    id: usuario.id_usuario,
                    nombre: usuario.nombre,
                    correo: usuario.correo
                }
            });

        } catch (error) {
            console.error(
                "Error al iniciar sesión:",
                error
            );

            return res.status(500).json({
                mensaje:
                    "No se pudo iniciar sesión."
            });
        }
    }
);

// ========================================
// FRONTEND (solo carpetas públicas; no exponer backend ni archivos privados)
// ========================================

const frontendDir = path.resolve(__dirname, "..");

app.get(["/", "/index.html"], (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
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
