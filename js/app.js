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

function verProducto(tarjeta, { desplazar = true } = {}) {
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

    const viewerDescription = document.getElementById("viewerDescription");
    if (viewerDescription) viewerDescription.textContent = tarjeta.dataset.description || "";

    if (experiencia && desplazar) {
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
