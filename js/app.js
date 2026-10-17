// ========================================
// CONFIGURACIÓN DEL BACKEND
// ========================================

const API_URL = "http://localhost:3000/api";

// ========================================
// ELEMENTOS PRINCIPALES
// ========================================

const navbar =
    document.getElementById("navbar");

const menuButton =
    document.getElementById("menuButton");

const navLinks =
    document.getElementById("navLinks");

// ========================================
// USUARIO ACTUAL
// ========================================

const accountText =
    document.querySelector(
        "#accountButton span"
    );

function obtenerUsuarioGuardado() {
    const usuarioGuardado =
        localStorage.getItem(
            "usuarioMilian"
        );

    if (!usuarioGuardado) {
        return null;
    }

    try {
        return JSON.parse(
            usuarioGuardado
        );
    } catch (error) {
        console.error(
            "No se pudo leer el usuario:",
            error
        );

        localStorage.removeItem(
            "usuarioMilian"
        );

        return null;
    }
}

function mostrarUsuario(usuario) {
    if (!accountText) {
        return;
    }

    if (
        usuario &&
        usuario.nombre
    ) {
        accountText.textContent =
            usuario.nombre;
    } else {
        accountText.textContent =
            "Mi cuenta";
    }
}

function guardarUsuario(usuario) {
    localStorage.setItem(
        "usuarioMilian",
        JSON.stringify(usuario)
    );

    mostrarUsuario(usuario);
}

function cargarUsuarioGuardado() {
    const usuario =
        obtenerUsuarioGuardado();

    mostrarUsuario(usuario);
}

function cerrarSesion() {
    localStorage.removeItem(
        "usuarioMilian"
    );

    mostrarUsuario(null);

    console.log(
        "Sesión cerrada correctamente."
    );
}

cargarUsuarioGuardado();

// ========================================
// NAVBAR AL HACER SCROLL
// ========================================

function actualizarNavbar() {
    if (!navbar) {
        return;
    }

    navbar.classList.toggle(
        "scrolled",
        window.scrollY > 40
    );
}

window.addEventListener(
    "scroll",
    actualizarNavbar,
    {
        passive: true
    }
);

actualizarNavbar();

// ========================================
// MENÚ MÓVIL
// ========================================

if (menuButton && navbar) {
    menuButton.addEventListener(
        "click",
        () => {
            const abierto =
                navbar.classList.toggle(
                    "menu-open"
                );

            menuButton.classList.toggle(
                "open",
                abierto
            );

            menuButton.setAttribute(
                "aria-expanded",
                String(abierto)
            );
        }
    );
}

if (
    navLinks &&
    navbar &&
    menuButton
) {
    navLinks
        .querySelectorAll("a")
        .forEach(link => {
            link.addEventListener(
                "click",
                () => {
                    navbar.classList.remove(
                        "menu-open"
                    );

                    menuButton.classList.remove(
                        "open"
                    );

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            );
        });
}

// ========================================
// ANIMACIONES AL HACER SCROLL
// ========================================

const elementosReveal =
    document.querySelectorAll(
        ".reveal"
    );

if (
    "IntersectionObserver" in window
) {
    const observer =
        new IntersectionObserver(
            entries => {
                entries.forEach(
                    entry => {
                        if (
                            entry.isIntersecting
                        ) {
                            entry.target
                                .classList
                                .add(
                                    "is-visible"
                                );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    }
                );
            },
            {
                threshold: 0.12,
                rootMargin:
                    "0px 0px -50px 0px"
            }
        );

    elementosReveal.forEach(
        elemento => {
            observer.observe(
                elemento
            );
        }
    );
} else {
    elementosReveal.forEach(
        elemento => {
            elemento.classList.add(
                "is-visible"
            );
        }
    );
}

// ========================================
// VISOR 3D
// ========================================

const modelo3D =
    document.getElementById(
        "modelo3D"
    );

const viewerName =
    document.getElementById(
        "viewerName"
    );

const viewerPrice =
    document.getElementById(
        "viewerPrice"
    );

const viewerCategory =
    document.getElementById(
        "viewerCategory"
    );

const experiencia =
    document.getElementById(
        "experiencia"
    );

// Mensajes discretos de carga para modelos y realidad aumentada.
const viewerStatus = document.getElementById("viewerStatus");
const viewerStatusTitle = document.getElementById("viewerStatusTitle");
const viewerStatusDetail = document.getElementById("viewerStatusDetail");
const mobileModelHint = document.getElementById("mobileModelHint");
let arStatusTimer;
let modelStatusTimer;

function mostrarEstadoVisor(detalle) {
    if (!viewerStatus) return;
    clearTimeout(arStatusTimer);
    clearTimeout(modelStatusTimer);
    viewerStatusTitle.textContent = "Espera un momento...";
    viewerStatusDetail.textContent = detalle;
    viewerStatus.hidden = false;
}

function ocultarEstadoVisor() {
    if (!viewerStatus) return;
    clearTimeout(arStatusTimer);
    clearTimeout(modelStatusTimer);
    viewerStatus.hidden = true;
}

if (modelo3D) {
    // El botón AR pertenece al shadow host de model-viewer (slot="ar-button").
    const botonAR = modelo3D.querySelector('[slot="ar-button"]');
    if (botonAR) {
        botonAR.addEventListener("click", () => {
            // Si el modelo aún está cargando, no sustituir el estado de carga.
            if (!modelo3D.loaded) return;
            mostrarEstadoVisor("Estamos preparando la realidad aumentada.");
            // Quick Look / Scene Viewer pasan a otra interfaz; no emiten un evento
            // fiable de carga final. El aviso se retira tras un tiempo prudente.
            arStatusTimer = setTimeout(ocultarEstadoVisor, 5500);
        });
    }
    modelo3D.addEventListener("ar-status", evento => {
        if (["session-started", "not-presenting", "failed"].includes(evento.detail.status)) {
            ocultarEstadoVisor();
        }
    });
    window.addEventListener("pageshow", ocultarEstadoVisor);
}

// ========================================
// AJUSTAR VISTA DEL MODELO
// ========================================

function ajustarVistaModelo() {
    if (!modelo3D) {
        return;
    }

    modelo3D.setAttribute(
        "camera-orbit",
        "0deg 75deg 130%"
    );

    modelo3D.setAttribute(
        "camera-target",
        "auto auto auto"
    );

    modelo3D.setAttribute(
        "field-of-view",
        "30deg"
    );
}

// ========================================
// CAMBIAR PRODUCTO
// ========================================

function verProducto(tarjeta) {
    if (
        !tarjeta ||
        !modelo3D
    ) {
        return;
    }

    const nombre =
        tarjeta.dataset.name;

    const precio =
        tarjeta.dataset.price;

    const categoria =
        tarjeta.dataset.category;

    const imagen =
        tarjeta.dataset.image;

    const modelo =
        tarjeta.dataset.model;

    if (!modelo) {
        console.error(
            "El producto seleccionado no tiene modelo 3D."
        );

        return;
    }

    document
        .querySelectorAll(
            ".product-card"
        )
        .forEach(producto => {
            producto.classList.remove(
                "selected"
            );
        });

    tarjeta.classList.add(
        "selected"
    );

    if (viewerName) {
        viewerName.textContent =
            nombre ||
            "Modelo seleccionado";
    }

    if (viewerPrice) {
        viewerPrice.textContent =
            precio ||
            "Consultar precio";
    }

    if (viewerCategory) {
        viewerCategory.textContent =
            categoria ||
            "Calzado artesanal";
    }

    if (imagen) {
        modelo3D.setAttribute(
            "poster",
            imagen
        );
    }

    // Mostrar el aviso antes de solicitar el nuevo archivo 3D.
    if (modelo3D.getAttribute("src") !== modelo) {
        mostrarEstadoVisor("Estamos preparando tu modelo 3D.");
        // Evitar un indicador permanente ante conexiones interrumpidas.
        modelStatusTimer = setTimeout(ocultarEstadoVisor, 30000);
    }

    if (mobileModelHint) mobileModelHint.hidden = false;

    modelo3D.setAttribute(
        "src",
        modelo
    );

    modelo3D.setAttribute(
        "alt",
        `Modelo tridimensional de ${
            nombre || "calzado"
        }`
    );

    ajustarVistaModelo();

    if (experiencia) {
        experiencia.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

window.verProducto =
    verProducto;

// ========================================
// EVENTOS DEL MODELO 3D
// ========================================

if (modelo3D) {
    modelo3D.addEventListener(
        "load",
        () => {
            console.log(
                "Modelo 3D cargado correctamente:",
                modelo3D.src
            );

            ajustarVistaModelo();
            ocultarEstadoVisor();
        }
    );

    modelo3D.addEventListener(
        "error",
        evento => {
            console.error(
                "No se pudo cargar el modelo 3D:",
                evento
            );
            ocultarEstadoVisor();
        }
    );
}

// ========================================
// MODAL DE CUENTA
// ========================================

const accountButton =
    document.getElementById(
        "accountButton"
    );

const accountOverlay =
    document.getElementById(
        "accountOverlay"
    );

const accountClose =
    document.getElementById(
        "accountClose"
    );

const tabLogin =
    document.getElementById(
        "tabLogin"
    );

const tabRegister =
    document.getElementById(
        "tabRegister"
    );

const panelLogin =
    document.getElementById(
        "panelLogin"
    );

const panelRegister =
    document.getElementById(
        "panelRegister"
    );

// ========================================
// CAMBIAR PESTAÑA
// ========================================

function cambiarTabCuenta(tab) {
    const mostrarLogin =
        tab === "login";

    if (tabLogin) {
        tabLogin.classList.toggle(
            "active",
            mostrarLogin
        );
    }

    if (tabRegister) {
        tabRegister.classList.toggle(
            "active",
            !mostrarLogin
        );
    }

    if (panelLogin) {
        panelLogin.hidden =
            !mostrarLogin;
    }

    if (panelRegister) {
        panelRegister.hidden =
            mostrarLogin;
    }
}

// ========================================
// ABRIR MODAL
// ========================================

function abrirModal() {
    if (!accountOverlay) {
        return;
    }

    accountOverlay.hidden =
        false;

    requestAnimationFrame(
        () => {
            accountOverlay
                .classList
                .add(
                    "is-open"
                );
        }
    );

    document.body.classList.add(
        "modal-open"
    );

    cambiarTabCuenta(
        "login"
    );

    setTimeout(() => {
        const loginEmail =
            document.getElementById(
                "loginEmail"
            );

        if (loginEmail) {
            loginEmail.focus();
        }
    }, 100);
}

// ========================================
// CERRAR MODAL
// ========================================

function cerrarModal() {
    if (!accountOverlay) {
        return;
    }

    accountOverlay.classList.remove(
        "is-open"
    );

    document.body.classList.remove(
        "modal-open"
    );

    setTimeout(() => {
        accountOverlay.hidden =
            true;
    }, 300);
}

// ========================================
// BOTÓN DE CUENTA Y CERRAR SESIÓN
// ========================================

if (accountButton) {
    accountButton.addEventListener(
        "click",
        () => {
            const usuario =
                obtenerUsuarioGuardado();

            // Sin sesión: abrir login

            if (!usuario) {
                abrirModal();
                return;
            }

            // Con sesión: preguntar si desea salir

            const confirmarSalida =
                window.confirm(
                    `Hola, ${usuario.nombre}. ¿Deseas cerrar sesión?`
                );

            if (!confirmarSalida) {
                return;
            }

            cerrarSesion();

            window.alert(
                "Sesión cerrada correctamente."
            );
        }
    );
}

// ========================================
// EVENTOS DEL MODAL
// ========================================

if (accountClose) {
    accountClose.addEventListener(
        "click",
        cerrarModal
    );
}

if (accountOverlay) {
    accountOverlay.addEventListener(
        "click",
        evento => {
            if (
                evento.target ===
                accountOverlay
            ) {
                cerrarModal();
            }
        }
    );
}

document.addEventListener(
    "keydown",
    evento => {
        if (
            evento.key === "Escape" &&
            accountOverlay &&
            !accountOverlay.hidden
        ) {
            cerrarModal();
        }
    }
);

if (tabLogin) {
    tabLogin.addEventListener(
        "click",
        () => {
            cambiarTabCuenta(
                "login"
            );
        }
    );
}

if (tabRegister) {
    tabRegister.addEventListener(
        "click",
        () => {
            cambiarTabCuenta(
                "register"
            );
        }
    );
}

// ========================================
// LEER RESPUESTA DEL SERVIDOR
// ========================================

async function obtenerRespuesta(
    respuesta
) {
    const tipoContenido =
        respuesta.headers.get(
            "content-type"
        ) || "";

    if (
        tipoContenido.includes(
            "application/json"
        )
    ) {
        return await respuesta.json();
    }

    const texto =
        await respuesta.text();

    return {
        mensaje:
            texto ||
            "El servidor devolvió una respuesta inesperada."
    };
}

// ========================================
// CREAR CUENTA
// ========================================

const registerForm =
    document.getElementById(
        "registerForm"
    );

if (registerForm) {
    registerForm.addEventListener(
        "submit",
        async evento => {
            evento.preventDefault();

            const registerName =
                document.getElementById(
                    "registerName"
                );

            const registerEmail =
                document.getElementById(
                    "registerEmail"
                );

            const registerPassword =
                document.getElementById(
                    "registerPassword"
                );

            const feedback =
                document.getElementById(
                    "registerFeedback"
                );

            const boton =
                registerForm.querySelector(
                    "button[type='submit']"
                );

            const nombre =
                registerName.value.trim();

            const correo =
                registerEmail.value
                    .trim()
                    .toLowerCase();

            const contrasena =
                registerPassword.value;

            if (
                !nombre ||
                !correo ||
                !contrasena
            ) {
                feedback.textContent =
                    "Completa todos los campos.";

                return;
            }

            if (
                contrasena.length < 8
            ) {
                feedback.textContent =
                    "La contraseña debe tener al menos 8 caracteres.";

                return;
            }

            feedback.textContent =
                "Creando cuenta...";

            boton.disabled = true;

            try {
                const respuesta =
                    await fetch(
                        `${API_URL}/registro`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    nombre,
                                    correo,
                                    contrasena
                                })
                        }
                    );

                const datos =
                    await obtenerRespuesta(
                        respuesta
                    );

                if (!respuesta.ok) {
                    feedback.textContent =
                        datos.mensaje ||
                        "No se pudo crear la cuenta.";

                    return;
                }

                feedback.textContent =
                    datos.mensaje ||
                    "Cuenta creada correctamente.";

                registerForm.reset();

                const loginEmail =
                    document.getElementById(
                        "loginEmail"
                    );

                if (loginEmail) {
                    loginEmail.value =
                        correo;
                }

                setTimeout(() => {
                    cambiarTabCuenta(
                        "login"
                    );

                    const loginFeedback =
                        document.getElementById(
                            "loginFeedback"
                        );

                    if (loginFeedback) {
                        loginFeedback.textContent =
                            "Cuenta creada. Ahora inicia sesión.";
                    }
                }, 900);

            } catch (error) {
                console.error(
                    "Error al registrar:",
                    error
                );

                feedback.textContent =
                    "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
            } finally {
                boton.disabled = false;
            }
        }
    );
}

// ========================================
// INICIAR SESIÓN
// ========================================

const loginForm =
    document.getElementById(
        "loginForm"
    );

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        async evento => {
            evento.preventDefault();

            const loginEmail =
                document.getElementById(
                    "loginEmail"
                );

            const loginPassword =
                document.getElementById(
                    "loginPassword"
                );

            const feedback =
                document.getElementById(
                    "loginFeedback"
                );

            const boton =
                loginForm.querySelector(
                    "button[type='submit']"
                );

            const correo =
                loginEmail.value
                    .trim()
                    .toLowerCase();

            const contrasena =
                loginPassword.value;

            if (
                !correo ||
                !contrasena
            ) {
                feedback.textContent =
                    "Completa el correo y la contraseña.";

                return;
            }

            feedback.textContent =
                "Iniciando sesión...";

            boton.disabled = true;

            try {
                const respuesta =
                    await fetch(
                        `${API_URL}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    correo,
                                    contrasena
                                })
                        }
                    );

                const datos =
                    await obtenerRespuesta(
                        respuesta
                    );

                if (!respuesta.ok) {
                    feedback.textContent =
                        datos.mensaje ||
                        "Correo o contraseña incorrectos.";

                    return;
                }

                if (
                    !datos.usuario ||
                    !datos.usuario.nombre
                ) {
                    console.error(
                        "El servidor no devolvió los datos del usuario:",
                        datos
                    );

                    feedback.textContent =
                        "La sesión inició, pero no se recibió el nombre.";

                    return;
                }

                guardarUsuario(
                    datos.usuario
                );

                feedback.textContent =
                    datos.mensaje ||
                    "Sesión iniciada correctamente.";

                loginForm.reset();

                setTimeout(() => {
                    cerrarModal();
                }, 900);

            } catch (error) {
                console.error(
                    "Error al iniciar sesión:",
                    error
                );

                feedback.textContent =
                    "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
            } finally {
                boton.disabled = false;
            }
        }
    );
}

// ========================================
// FUNCIONES DISPONIBLES GLOBALMENTE
// ========================================

window.cerrarSesion =
    cerrarSesion;