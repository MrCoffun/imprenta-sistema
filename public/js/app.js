console.log('🚨 APP.JS SE EJECUTÁ EN:', new Date().toISOString());
console.log('✅ Interfaz web cargada correctamente.');

const loginView = document.getElementById('loginView');
const appSistema = document.getElementById('appSistema');
const formLogin = document.getElementById('formLogin');
const loginError = document.getElementById('loginError');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const btnNuevaCotizacion = document.getElementById('btnNuevaCotizacion');
const btnCancelarCotizacion = document.getElementById('btnCancelarCotizacion');
const btnCancelarCotizacionForm = document.getElementById('btnCancelarCotizacionForm');

console.log('🔎 Botón Nueva cotización:', btnNuevaCotizacion);


async function comprobarSesion() {

    try {

        const respuesta =
            await fetch('/api/perfil');

        if (!respuesta.ok) {
            throw new Error('No hay sesión');
        }

        const datos =
            await respuesta.json();

        mostrarSistema(datos.usuario);

    } catch {

        mostrarLogin();
    }
}

function mostrarLogin() {

    loginView.style.display = 'flex';
    appSistema.style.display = 'none';

}

function mostrarSistema(usuario) {

    loginView.style.display = 'none';
    appSistema.style.display = 'flex';

    document.getElementById('usuarioNombre').textContent =
        usuario.nombre;

    document.getElementById('usuarioRol').textContent =
        `Rol: ${usuario.rol}`;

}

formLogin?.addEventListener('submit', async (e) => {

    e.preventDefault();

    loginError.textContent = '';

    const usuario =
        document.getElementById('loginUsuario').value.trim();

    const contraseña =
        document.getElementById('loginContrasena').value;

    try {

        const respuesta =
            await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usuario,
                    contraseña
                })
            });

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error || 'No se pudo iniciar sesión'
            );
        }

        formLogin.reset();

        sessionStorage.removeItem('vistaActual');

        mostrarSistema(datos.usuario);

        await cargarPerfil();

    } catch (error) {

        loginError.textContent =
            error.message;

    }

});

btnCerrarSesion?.addEventListener('click', async () => {

    try {

        await fetch('/api/logout', {
            method: 'POST'
        });

        mostrarLogin();

    } catch (error) {

        console.error(
            '❌ Error cerrando sesión:',
            error
        );

    }

});

comprobarSesion();

// ==========================================
// ELEMENTOS
// ==========================================

const menuItems =
    document.querySelectorAll('.menu-item');

const vistaDashboard =
    document.getElementById('view-dashboard');

const btnMenuCotizaciones =
    document.getElementById('btnMenuCotizaciones');

const submenuCotizaciones =
    document.getElementById('submenuCotizaciones');

const btnMenuOrdenes =
    document.getElementById('btnMenuOrdenes');

const submenuOrdenes =
    document.getElementById('submenuOrdenes');

const submenuItems =
    document.querySelectorAll('.submenu-item');
    
const submenuOrdenesItems =
    document.querySelectorAll('.submenu-ordenes-item');

const vistaCotizaciones =
    document.getElementById('view-cotizaciones');

const vistaCotizacionesDiseno =
    document.getElementById('view-cotizaciones-diseno');

const vistaCotizacionesAprobacion =
    document.getElementById('view-cotizaciones-aprobacion');

const vistaHistorialAprobadas =
    document.getElementById('view-historial-aprobadas');

const vistaHistorialRechazadas =
    document.getElementById('view-historial-rechazadas');

const vistaNuevaCotizacion =
    document.getElementById('view-nueva-cotizacion');

const vistaDetalleCotizacionDiseno =
    document.getElementById('view-detalle-cotizacion-diseno');
    
const vistaClientes =
    document.getElementById('view-clientes');

const vistaNuevoCliente =
    document.getElementById('view-nuevo-cliente');

const vistaOrdenes =
    document.getElementById('view-ordenes');

const vistaOrdenesRevision =
    document.getElementById('view-ordenes-revision');

const vistaOrdenesHistorial =
    document.getElementById('view-ordenes-historial');

const vistaHistorialDisenador =
    document.getElementById('view-ordenes-historial-disenador');

const vistaHistorialMaquinista =
    document.getElementById('view-ordenes-historial-maquinista');
    
const filtroCotizacionHistorial =
    document.getElementById('filtroCotizacionHistorial');

const filtroOTHistorial =
    document.getElementById('filtroOTHistorial');
    
const vistaCotizarManoObra =
    document.getElementById('view-cotizar-mano-obra');

const vistaDetalleOT =
    document.getElementById('view-detalle-ot');

const vistaDetalleCotizacion =
    document.getElementById('view-detalle-cotizacion');

const pageTitle =
    document.getElementById('pageTitle');

const pageDescription =
    document.getElementById('pageDescription');

let rolUsuario = null;
let otActualId = null;
let vistaAnteriorOT = 'ordenes';
let vistaAnteriorCotizacion = 'cotizaciones';

// ==========================================
// ELEMENTOS TARIFAS
// ==========================================

let tarifasCotizacion = [];

const selectProducto =
    document.getElementById('cotizacionProducto');

const selectTamano =
    document.getElementById('cotizacionTamano');

const selectMaterial =
    document.getElementById('cotizacionMaterial');

const selectImpresion =
    document.getElementById('cotizacionImpresion');

const selectCaras =
    document.getElementById('cotizacionCaras');

const selectCantidad =
    document.getElementById('cotizacionCantidad');

const tarifaDescripcion =
    document.getElementById('tarifaDescripcion');

const tarifaPrecio =
    document.getElementById('tarifaPrecio');

const tarifaMillares =
    document.getElementById('tarifaMillares');

const tarifaCostoProduccion =
    document.getElementById('tarifaCostoProduccion');


async function cargarTarifasCotizacion() {

    try {

        const respuesta =
            await fetch('/api/tarifas');

        const tarifas =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                tarifas.error ||
                'No se pudieron cargar las tarifas'
            );
        }

        tarifasCotizacion = tarifas;

        const productos =
            [
                ...new Set(
                    tarifas.map(
                        tarifa => tarifa.tipo_producto
                    )
                )
            ];

        selectProducto.innerHTML =
            '<option value="">Seleccionar producto</option>';

        productos.forEach(producto => {

            const option =
                document.createElement('option');

            option.value = producto;
            option.textContent = producto;

            selectProducto.appendChild(option);

        });

    } catch (error) {

        console.error(
            '❌ Error cargando tarifas:',
            error
        );

        alert(
            'No se pudieron cargar las tarifas de cotización.'
        );

    }

}


function llenarSelect(select, valores, textoInicial) {

    const valorAnterior =
        select.value;

    select.innerHTML =
        `<option value="">${textoInicial}</option>`;

    valores.forEach(valor => {

        const option =
            document.createElement('option');

        option.value = valor;
        option.textContent = valor;

        select.appendChild(option);

    });

    select.disabled =
        valores.length === 0;

    if (valores.includes(valorAnterior)) {
        select.value = valorAnterior;
    }
}


function actualizarOpcionesTarifa() {

    const producto =
        selectProducto.value;

    const tarifasProducto =
        tarifasCotizacion.filter(
            tarifa =>
                tarifa.tipo_producto === producto
        );

    const tamanos =
        [
            ...new Set(
                tarifasProducto.map(
                    tarifa => tarifa.tamaño
                )
            )
        ];

    llenarSelect(
        selectTamano,
        tamanos,
        'Seleccionar tamaño'
    );

    actualizarPrecioTarifa();
}


function actualizarMateriales() {

    const producto =
        selectProducto.value;

    const tamaño =
        selectTamano.value;

    const tarifasFiltradas =
        tarifasCotizacion.filter(
            tarifa =>
                tarifa.tipo_producto === producto &&
                tarifa.tamaño === tamaño
        );

    const materiales =
        [
            ...new Set(
                tarifasFiltradas.map(
                    tarifa => tarifa.material
                )
            )
        ];

    llenarSelect(
        selectMaterial,
        materiales,
        'Seleccionar material'
    );

    actualizarPrecioTarifa();
}


function actualizarImpresiones() {

    const producto =
        selectProducto.value;

    const tamaño =
        selectTamano.value;

    const material =
        selectMaterial.value;

    const tarifasFiltradas =
        tarifasCotizacion.filter(
            tarifa =>
                tarifa.tipo_producto === producto &&
                tarifa.tamaño === tamaño &&
                tarifa.material === material
        );

    const impresiones =
        [
            ...new Set(
                tarifasFiltradas.map(
                    tarifa => tarifa.tipo_impresion
                )
            )
        ];

    llenarSelect(
        selectImpresion,
        impresiones,
        'Seleccionar impresión'
    );

    actualizarPrecioTarifa();
}


function actualizarCaras() {

    const producto =
        selectProducto.value;

    const tamaño =
        selectTamano.value;

    const material =
        selectMaterial.value;

    const impresion =
        selectImpresion.value;

    const tarifasFiltradas =
        tarifasCotizacion.filter(
            tarifa =>
                tarifa.tipo_producto === producto &&
                tarifa.tamaño === tamaño &&
                tarifa.material === material &&
                tarifa.tipo_impresion === impresion
        );

    const caras =
        [
            ...new Set(
                tarifasFiltradas.map(
                    tarifa => tarifa.caras
                )
            )
        ];

    llenarSelect(
        selectCaras,
        caras,
        'Seleccionar caras'
    );

    actualizarPrecioTarifa();
}


function actualizarPrecioTarifa() {

    const producto =
        selectProducto.value;

    const tamaño =
        selectTamano.value;

    const material =
        selectMaterial.value;

    const impresion =
        selectImpresion.value;

    const caras =
        selectCaras.value;

    const cantidad =
        Number(selectCantidad.value);


    const tarifa =
        tarifasCotizacion.find(
            item =>
                item.tipo_producto === producto &&
                item.tamaño === tamaño &&
                item.material === material &&
                item.tipo_impresion === impresion &&
                item.caras === caras
        );


    if (!tarifa) {

        tarifaDescripcion.textContent =
            'Selecciona las características del producto para consultar la tarifa.';

        tarifaPrecio.textContent =
            'S/ 0.00';

        tarifaMillares.textContent =
            '0';

        tarifaCostoProduccion.textContent =
            'S/ 0.00';


        return;
    }


    const millares =
        cantidad > 0
            ? cantidad / 1000
            : 0;


    const costoProduccion =
        tarifa.precio_millar * millares;


    tarifaDescripcion.textContent =
        `${producto} ${tamaño} - ${material} - ${impresion} - ${caras}`;

    tarifaPrecio.textContent =
        `S/ ${Number(tarifa.precio_millar).toFixed(2)}`;

    tarifaMillares.textContent =
        millares;

    tarifaCostoProduccion.textContent =
        `S/ ${costoProduccion.toFixed(2)}`;

}

// ==========================================
// LISTENERS TARIFAS
// ==========================================

selectProducto?.addEventListener(
    'change',
    actualizarOpcionesTarifa
);

selectTamano?.addEventListener(
    'change',
    actualizarMateriales
);

selectMaterial?.addEventListener(
    'change',
    actualizarImpresiones
);

selectImpresion?.addEventListener(
    'change',
    actualizarCaras
);

selectCaras?.addEventListener(
    'change',
    actualizarPrecioTarifa
);

selectCantidad?.addEventListener(
    'change',
    actualizarPrecioTarifa
);

// ==========================================
// PERFIL DEL USUARIO
// ==========================================

async function cargarPerfil() {

    try {

        const respuesta =
            await fetch('/api/perfil');

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                'No se pudo obtener el perfil'
            );
        }

        rolUsuario =
            datos.usuario.rol.toLowerCase();

        console.log(
            '👤 Rol del usuario:',
            rolUsuario
        );

        configurarMenuPorRol();

            let vistaInicial;

        const vistaGuardada =
            sessionStorage.getItem('vistaActual');

        if (rolUsuario === 'administrador') {

            const vistasPermitidas = [
                'dashboard',
                'cotizaciones',
                'clientes',
                'ordenes'
            ];

            vistaInicial =
                vistasPermitidas.includes(vistaGuardada)
                    ? vistaGuardada
                    : 'dashboard';
        }

        if (rolUsuario === 'cotizador') {
            const vistasPermitidas = [
                'cotizaciones',
                'clientes',
                'ordenes'
            ];

            vistaInicial =
                vistasPermitidas.includes(vistaGuardada)
                    ? vistaGuardada
                    : 'ordenes';
        }

        if (rolUsuario === 'diseñador') {

            const vistasPermitidas = [
                'ordenes',
                'cotizar-mano-obra'
            ];

            vistaInicial =
                vistasPermitidas.includes(vistaGuardada)
                    ? vistaGuardada
                    : 'ordenes';
        }

        if (rolUsuario === 'maquinista') {

            const vistasPermitidas = [
                'ordenes'
            ];

            vistaInicial =
                vistasPermitidas.includes(vistaGuardada)
                    ? vistaGuardada
                    : 'ordenes';
        }

        mostrarVista(vistaInicial);

            mostrarVista(vistaInicial);
    } catch (error) {

        console.error(
            '❌ Error obteniendo perfil:',
            error
        );
    }
}



// ==========================================
// CONFIGURAR MENÚ SEGÚN ROL
// ==========================================

function configurarMenuPorRol() {

    // Botones del menú principal visibles por rol
    // (se identifican por data-view o por id)
    const botonesPorRol = {
        administrador: ['dashboard', 'clientes', 'btnMenuCotizaciones', 'btnMenuOrdenes'],
        cotizador:     ['clientes', 'btnMenuCotizaciones', 'btnMenuOrdenes'],
        'diseñador':   ['cotizar-mano-obra', 'btnMenuOrdenes'],
        maquinista:    ['btnMenuOrdenes']
    };

    // Opciones de submenú visibles por rol (null = todas)
    const submenusPorRol = {
    administrador: [
        'ordenes-activas',
        'ordenes-revision',
        'ordenes-historial'
    ],

    cotizador: [
        'ordenes-activas',
        'ordenes-revision',
        'ordenes-historial'
    ],

    'diseñador': [
        'ordenes-activas',
        'ordenes-historial-disenador'
    ],

    maquinista: [
        'ordenes-activas',
        'ordenes-historial-maquinista'
    ]
};

    const botonesPermitidos =
        botonesPorRol[rolUsuario] || [];

    const submenusPermitidos =
        submenusPorRol[rolUsuario];

    menuItems.forEach(item => {

        const visible =
            botonesPermitidos.includes(item.dataset.view) ||
            botonesPermitidos.includes(item.id);

        item.style.display =
            visible ? '' : 'none';
    });

    submenuItems.forEach(subitem => {

    // El submenú de Cotizaciones
    // solamente está disponible para Administrador y Cotizador.
    const visible =
        rolUsuario === 'administrador' ||
        rolUsuario === 'cotizador';

    subitem.style.display =
        visible ? '' : 'none';
});

        submenuOrdenesItems.forEach(subitem => {

        const visible =
            !submenusPermitidos ||
            submenusPermitidos.includes(
                subitem.dataset.view
            );

        subitem.style.display =
            visible ? '' : 'none';
    });

    // El diseñador y el maquinista solo tienen "Activas",
    // así que dejamos ese submenú abierto de entrada.
    if (
        rolUsuario === 'diseñador' ||
        rolUsuario === 'maquinista'
    ) {
        submenuOrdenes?.classList.add('abierto');
    }

    console.log(
        '🔐 Menú configurado para:',
        rolUsuario
    );
    configurarFiltroEstadoOTPorRol();
}

function configurarFiltroEstadoOTPorRol() {

    const filtro =
        document.getElementById('filtroEstadoOT');

    if (!filtro) {
        return;
    }

    const opciones =
        filtro.querySelectorAll('option');

    opciones.forEach(opcion => {

        if (rolUsuario === 'diseñador') {

            opcion.style.display =
                (
                    opcion.value === '' ||
                    opcion.value === 'Pendiente' ||
                    opcion.value === 'En Diseño'
                )
                    ? ''
                    : 'none';

        }

        if (rolUsuario === 'maquinista') {

            opcion.style.display =
                (
                    opcion.value === '' ||
                    opcion.value === 'En Impresión'
                )
                    ? ''
                    : 'none';

        }

    });
}

// ==========================================
// NAVEGACIÓN
// ==========================================

menuItems.forEach(item => {

    // Cotizaciones y Órdenes de Trabajo
    // solo abren/cierran sus respectivos submenús.
    if (
        item.id === 'btnMenuCotizaciones' ||
        item.id === 'btnMenuOrdenes'
    ) {
        return;
    }

    item.addEventListener('click', () => {

        const vista = item.dataset.view;

        menuItems.forEach(menu => {
            menu.classList.remove('active');
        });

        submenuItems.forEach(subitem => {
            subitem.classList.remove('active');
        });

        submenuOrdenesItems.forEach(subitem => {
            subitem.classList.remove('active');
        });

        item.classList.add('active');

        mostrarVista(vista);

    });

});


/* ==========================================
   SUBMENÚ COTIZACIONES
========================================== */

btnMenuCotizaciones?.addEventListener(
    'click',
    () => {

        submenuCotizaciones.classList.toggle(
            'abierto'
        );

    }
);


/* ==========================================
   SUBMENÚ ÓRDENES DE TRABAJO
========================================== */

btnMenuOrdenes?.addEventListener(
    'click',
    () => {

        submenuOrdenes.classList.toggle(
            'abierto'
        );

    }
);


/* ==========================================
   OPCIONES DE COTIZACIONES
========================================== */

submenuItems.forEach(item => {

    item.addEventListener(
        'click',
        () => {

            submenuItems.forEach(subitem => {
                subitem.classList.remove('active');
            });

            submenuOrdenesItems.forEach(subitem => {
                subitem.classList.remove('active');
            });

            item.classList.add('active');

            mostrarVista(item.dataset.view);

        }
    );

});


/* ==========================================
   OPCIONES DE ÓRDENES DE TRABAJO
========================================== */

submenuOrdenesItems.forEach(item => {

    item.addEventListener(
        'click',
        () => {

            submenuItems.forEach(subitem => {
                subitem.classList.remove('active');
            });

            submenuOrdenesItems.forEach(subitem => {
                subitem.classList.remove('active');
            });

            item.classList.add('active');

            mostrarVista(item.dataset.view);

        }
    );

});

const filtroEstadoOT =
    document.getElementById('filtroEstadoOT');

const filtroPrioridadOT =
    document.getElementById('filtroPrioridadOT');


filtroEstadoOT?.addEventListener(
    'change',
    () => {
        cargarOrdenes();
    }
);


filtroPrioridadOT?.addEventListener(
    'change',
    () => {
        cargarOrdenes();
    }
);

document
    .getElementById('filtroCotizacionHistorial')
    ?.addEventListener(
        'input',
        (evento) => {

            evento.target.value =
                evento.target.value.replace(
                    /\D/g,
                    ''
                );

            cargarOrdenesHistorial(1);

        }
    );

document
    .getElementById('filtroOTHistorial')
    ?.addEventListener(
        'input',
        (evento) => {

            evento.target.value =
                evento.target.value.replace(
                    /\D/g,
                    ''
                );

            cargarOrdenesHistorial(1);

        }
    );


/* VISTA */
function mostrarVista(vista) {

    sessionStorage.setItem(
        'vistaActual',
        vista
    );

    menuItems.forEach(item => {

    item.classList.remove('active');

    if (item.dataset.view === vista) {
        item.classList.add('active');
    }

});

    vistaDashboard?.classList.add('view-hidden');
    vistaCotizaciones?.classList.add('view-hidden');
    vistaNuevaCotizacion?.classList.add('view-hidden');
    vistaDetalleCotizacion?.classList.add('view-hidden');
    vistaCotizarManoObra?.classList.add('view-hidden');
    vistaDetalleCotizacionDiseno?.classList.add('view-hidden');
    vistaCotizacionesDiseno?.classList.add('view-hidden');
    vistaCotizacionesAprobacion?.classList.add('view-hidden');
    vistaClientes?.classList.add('view-hidden');
    vistaNuevoCliente?.classList.add('view-hidden');
    vistaOrdenes?.classList.add('view-hidden');
    vistaDetalleOT?.classList.add('view-hidden');
    vistaOrdenesRevision?.classList.add('view-hidden');
    vistaOrdenesHistorial?.classList.add('view-hidden');
    vistaHistorialDisenador?.classList.add('view-hidden');
    vistaHistorialMaquinista?.classList.add('view-hidden');

    
    vistaHistorialAprobadas?.classList.add('view-hidden');
    vistaHistorialRechazadas?.classList.add('view-hidden');


    if (vista === 'dashboard') {

        vistaDashboard.classList.remove('view-hidden');

        pageTitle.textContent =
            'Dashboard';

        pageDescription.textContent =
            'Gestión y seguimiento de órdenes de trabajo';

        cargarDashboard();

    }

    if (vista === 'cotizaciones') {

        vistaCotizaciones.classList.remove('view-hidden');

        pageTitle.textContent =
            'Cotizaciones';

        pageDescription.textContent =
            'Gestión de cotizaciones registradas';

        cargarCotizaciones();

    }

    if (vista === 'nueva-cotizacion') {

            cargarClientesParaCotizacion();
            cargarTarifasCotizacion();

            vistaNuevaCotizacion.classList.remove(
                'view-hidden'
            );

            pageTitle.textContent =
                'Nueva cotización';

            pageDescription.textContent =
                'Registrar una nueva solicitud de cotización';

    }

    if (vista === 'detalle-cotizacion') {

        vistaDetalleCotizacion?.classList.remove(
            'view-hidden'
        );

        pageTitle.textContent =
            'Detalle de cotización';

        pageDescription.textContent =
            'Información completa de la cotización';
    }

    if (vista === 'clientes') {

        vistaClientes.classList.remove('view-hidden');

        pageTitle.textContent =
            'Clientes';

        pageDescription.textContent =
            'Gestión de clientes registrados';

        cargarClientes();

    }

    if (vista === 'nuevo-cliente') {
    vistaNuevoCliente?.classList.remove('view-hidden');

    pageTitle.textContent =
        'Nuevo cliente';

    pageDescription.textContent =
        'Registrar un nuevo cliente';
    }

    if (vista === 'ordenes' ||
    vista === 'ordenes-activas'
) {

    vistaOrdenes.classList.remove('view-hidden');

    pageTitle.textContent =
        'Órdenes de Trabajo Activas';

    pageDescription.textContent =
        'Órdenes que se encuentran actualmente en proceso';

    cargarOrdenes();

    }

    if (vista === 'ordenes-revision') {

    vistaOrdenesRevision?.classList.remove(
        'view-hidden'
    );

    pageTitle.textContent =
        'Órdenes de Trabajo En Revisión';

    pageDescription.textContent =
        'Órdenes pendientes de decisión por el Cotizador';

    cargarOrdenesRevision();

    }

    if (vista === 'ordenes-historial') {

    vistaOrdenesHistorial?.classList.remove(
        'view-hidden'
    );

    pageTitle.textContent =
        'Historial de Órdenes de Trabajo';

    pageDescription.textContent =
        'Órdenes de trabajo finalizadas';

    cargarOrdenesHistorial();

    }

    if (vista === 'ordenes-historial-disenador') {

    vistaHistorialDisenador?.classList.remove(
        'view-hidden'
    );

    pageTitle.textContent =
        'Historial de mis trabajos';

    pageDescription.textContent =
        'Órdenes de trabajo finalizadas en las que has participado';

    cargarHistorialDisenador();

    }

    if (vista ==='ordenes-historial-maquinista') {

        vistaHistorialMaquinista?.classList.remove(
            'view-hidden'
        );

        pageTitle.textContent =
            'Historial de mis trabajos';

        pageDescription.textContent =
            'Órdenes de trabajo finalizadas en las que has participado';

        cargarHistorialMaquinista();

    }

    if (vista === 'cotizar-mano-obra') {

        vistaCotizarManoObra.classList.remove('view-hidden');

        pageTitle.textContent =
            'Cotizar mano de obra';

        pageDescription.textContent =
            'Evaluación de mano de obra de diseño';

        cargarCotizacionesDiseno();
    }

    if (vista === 'cotizaciones-diseno') {

        vistaCotizacionesDiseno.classList.remove(
            'view-hidden'
        );

        pageTitle.textContent =
            'Pendientes de diseñador';

        pageDescription.textContent =
            'Cotizaciones pendientes de evaluación de diseño';

        cargarCotizacionesPendientesDisenador();

    }

    if (vista === 'cotizaciones-aprobacion') {

        vistaCotizacionesAprobacion.classList.remove(
            'view-hidden'
        );

        pageTitle.textContent =
            'Pendientes de aprobación';

        pageDescription.textContent =
            'Cotizaciones pendientes de aprobación del cliente';

        cargarCotizacionesPendientesAprobacion();

    }

    if (vista === 'historial-aprobadas') {

        vistaHistorialAprobadas?.classList.remove(
            'view-hidden'
        );

        pageTitle.textContent =
            'Cotizaciones aprobadas';

        pageDescription.textContent =
            'Historial de cotizaciones aprobadas';

        cargarHistorialAprobadas();
    }

    if (vista === 'historial-rechazadas') {

        vistaHistorialRechazadas?.classList.remove(
            'view-hidden'
        );

        pageTitle.textContent =
            'Cotizaciones rechazadas';

        pageDescription.textContent =
            'Historial de cotizaciones rechazadas';

        cargarHistorialRechazadas();
    }

    if (vista === 'detalle-ot') {

        vistaDetalleOT.classList.remove('view-hidden');

        pageTitle.textContent =
            'Detalle de OT';

        pageDescription.textContent =
            'Información y seguimiento de la orden de trabajo';

    }


}
    async function cargarHistorialDisenador() {

    const tabla =
        document.getElementById(
            'tablaOTHistorialDisenador'
        );

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="5">
                Cargando historial...
            </td>
        </tr>
    `;

    try {

        const respuesta =
            await fetch(
                '/api/ordenes-trabajo/historial-disenador'
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                'Error al obtener historial'
            );

        }

        const ordenes =
            datos.ordenes || [];

        tabla.innerHTML = '';

        if (ordenes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No tienes trabajos finalizados registrados.
                    </td>
                </tr>
            `;

            return;
        }

        ordenes.forEach(ot => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>
                    <strong>
                        ${ot.codigo_ot}
                    </strong>
                </td>

                <td>
                    ${ot.codigo_cotizacion}
                </td>

                <td>
                    ${ot.fecha_requerida}
                </td>

                <td>
                    ${ot.hora_requerida}
                </td>

                <td>
                    <button
                        type="button"
                        class="secondary-button"
                        onclick="verOT(${ot.id_ot})">
                        Ver OT
                    </button>
                </td>
            `;

            tabla.appendChild(fila);

        });

    } catch (error) {

        console.error(
            'Error cargando historial del diseñador:',
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    Error al cargar el historial.
                </td>
            </tr>
        `;

    }
}

    async function cargarHistorialMaquinista() {

    const tabla =
        document.getElementById(
            'tablaOTHistorialMaquinista'
        );

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="5">
                Cargando historial...
            </td>
        </tr>
    `;

    try {

        const respuesta =
            await fetch(
                '/api/ordenes-trabajo/historial-maquinista'
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                'Error al obtener historial'
            );
        }

        const ordenes =
            datos.ordenes || [];

        tabla.innerHTML = '';

        if (ordenes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No tienes trabajos finalizados registrados.
                    </td>
                </tr>
            `;

            return;
        }

        ordenes.forEach(ot => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>
                    <strong>
                        ${ot.codigo_ot}
                    </strong>
                </td>

                <td>
                    ${ot.codigo_cotizacion}
                </td>

                <td>
                    ${ot.fecha_requerida}
                </td>

                <td>
                    ${ot.hora_requerida}
                </td>

                <td>
                    <button
                        type="button"
                        class="secondary-button"
                        onclick="verOT(${ot.id_ot})">
                        Ver OT
                    </button>
                </td>
            `;

            tabla.appendChild(fila);

        });

    } catch (error) {

        console.error(
            'Error cargando historial del maquinista:',
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    Error al cargar el historial.
                </td>
            </tr>
        `;

    }
}

// ==========================================
// CARGAR HISTORIAL DE ÓRDENES
// ==========================================

async function cargarOrdenesHistorial(pagina = 1) {

    const tabla =
        document.getElementById(
            'tablaOTHistorial'
        );

    const paginacion =
        document.getElementById(
            'paginacionOTHistorial'
        );

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="7">
                Cargando historial...
            </td>
        </tr>
    `;

    try {

        const filtroCotizacion =
    document.getElementById(
        'filtroCotizacionHistorial'
    );

        const filtroOT =
            document.getElementById(
                'filtroOTHistorial'
            );

        const numeroCotizacion =
            filtroCotizacion?.value || '';

        const numeroOT =
            filtroOT?.value || '';

        const parametros =
            new URLSearchParams();

        parametros.set(
            'pagina',
            pagina
        );

        parametros.set(
            'estado',
            'Finalizada'
        );

        if (numeroCotizacion) {

            parametros.set(
                'codigo_cotizacion',
                numeroCotizacion
            );

        }

        if (numeroOT) {

            parametros.set(
                'codigo_ot',
                numeroOT
            );

        }

        const respuesta =
            await fetch(
                `/api/ordenes-trabajo?${parametros.toString()}`
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                'Error al obtener historial'
            );
        }

        const ordenes =
            datos.ordenes || [];

        tabla.innerHTML = '';

        if (ordenes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="6">
                        No hay órdenes de trabajo finalizadas.
                    </td>
                </tr>
            `;

            if (paginacion) {
                paginacion.innerHTML = '';
            }

            return;
        }

        ordenes.forEach(ot => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>
                    <strong>
                        ${ot.codigo_ot}
                    </strong>
                </td>

                <td>
                    ${ot.codigo_cotizacion}
                </td>

                <td>
                    <span class="status-badge status-aprobada">
                        ${ot.estado}
                    </span>
                </td>

                <td>
                    ${ot.fecha_requerida}
                </td>

                <td>
                    ${ot.hora_requerida}
                </td>

                <td>
                    ${ot.fecha_actualizacion || '—'}
                </td>

                <td>
                    <button
                        type="button"
                        class="secondary-button"
                        onclick="verOT(${ot.id_ot})">
                        Ver OT
                    </button>
                </td>
            `;

            tabla.appendChild(fila);

        });


        // ==========================================
        // PAGINACIÓN
        // ==========================================

        if (paginacion) {

            paginacion.innerHTML = '';

            for (
                let i = 1;
                i <= datos.totalPaginas;
                i++
            ) {

                const boton =
                    document.createElement('button');

                boton.textContent = i;

                boton.className =
                    'pagination-button';

                if (i === datos.pagina) {
                    boton.classList.add('active');
                }

                boton.addEventListener(
                    'click',
                    () => {
                        cargarOrdenesHistorial(i);
                    }
                );

                paginacion.appendChild(boton);
            }
        }

    } catch (error) {

        console.error(
            '❌ Error cargando historial:',
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    ❌ Error al cargar el historial.
                </td>
            </tr>
        `;

        if (paginacion) {
            paginacion.innerHTML = '';
        }
    }
}


// ==========================================
// DASHBOARD
// ==========================================

async function cargarDashboard() {

    try {

        const respuesta =
            await fetch('/api/dashboard');

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                'No se pudieron cargar las estadísticas'
            );

        }

        document.getElementById('totalCotizaciones')
            .textContent =
            datos.totalCotizaciones;

        document.getElementById('totalOT')
            .textContent =
            datos.totalOT;

        document.getElementById('totalPrioritarias')
            .textContent =
            datos.totalPrioritarias;

        document.getElementById('totalRetrasadas')
            .textContent =
            datos.totalRetrasadas;

    } catch (error) {

        console.error(
            '❌ Error cargando dashboard:',
            error
        );

    }

}


// ==========================================
// COTIZACIONES
// ==========================================

async function cargarCotizaciones(pagina = 1) {

    const tabla =
        document.getElementById('tablaCotizaciones');

    const paginacion =
        document.getElementById('paginacionCotizaciones');

    tabla.innerHTML = `
        <tr>
            <td colspan="7">
                Cargando cotizaciones...
            </td>
        </tr>
    `;

    try {

        const respuesta =
            await fetch(`/api/cotizaciones?pagina=${pagina}`);

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                'Error al obtener cotizaciones'
            );

        }

        const cotizaciones =
            datos.cotizaciones;

        tabla.innerHTML = '';

        if (cotizaciones.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="7">
                        No existen cotizaciones registradas.
                    </td>
                </tr>
            `;

            paginacion.innerHTML = '';

            return;
        }

        cotizaciones.forEach(cotizacion => {

            const fila =
                document.createElement('tr');

            let estadoClase = '';

            if (cotizacion.estado === 'Aprobada') {
                estadoClase = 'status-aprobada';
            }

            if (cotizacion.estado === 'Rechazada') {
                estadoClase = 'status-rechazada';
            }

            let acciones = `
                <button
                    class="secondary-button"
                    onclick="verCotizacion(${cotizacion.id_cotizacion})">
                    Ver
                </button>
            `;

            // Aprobar y rechazar solamente están disponibles
            // mientras la cotización esté pendiente.

            if (
                cotizacion.estado !== 'Aprobada' &&
                cotizacion.estado !== 'Rechazada'
            ) {

                acciones += `
                    <button
                        class="primary-button"
                        onclick="aprobarCotizacion(${cotizacion.id_cotizacion})">
                        Aprobar
                    </button>
                `;

                acciones += `
                    <button
                        class="danger-button"
                        onclick="rechazarCotizacion(${cotizacion.id_cotizacion})">
                        Rechazar
                    </button>
                `;

            }

            fila.innerHTML = `

                <td>
                    <strong>
                        ${cotizacion.codigo_cotizacion}
                    </strong>
                </td>

                <td>
                    ${cotizacion.cliente || '—'}
                </td>

                <td>
                    ${cotizacion.tipo_producto}
                </td>

                <td>
                    ${Number(
                        cotizacion.cantidad
                    ).toLocaleString()}
                </td>

                <td>
                    ${cotizacion.fecha_requerida}
                    ${cotizacion.hora_requerida}
                </td>

                <td>
                    <span class="status-badge ${estadoClase}">
                        ${cotizacion.estado}
                    </span>
                </td>

                <td>
                    ${acciones}
                </td>

            `;

            tabla.appendChild(fila);

        });

        // ========================================
        // PAGINACIÓN
        // ========================================

        paginacion.innerHTML = '';

        const paginaActual =
            datos.pagina;

        const totalPaginas =
            datos.totalPaginas;

        if (totalPaginas <= 1) {
            return;
        }

        const botonAnterior =
            document.createElement('button');

        botonAnterior.textContent = '‹ Anterior';
        botonAnterior.className = 'secondary-button';

        botonAnterior.disabled =
            paginaActual === 1;

        botonAnterior.addEventListener(
            'click',
            () => {

                cargarCotizaciones(
                    paginaActual - 1
                );

            }
        );

        paginacion.appendChild(
            botonAnterior
        );

        for (
            let numero = 1;
            numero <= totalPaginas;
            numero++
        ) {

            const botonPagina =
                document.createElement('button');

            botonPagina.textContent =
                numero;

            botonPagina.className =
                numero === paginaActual
                    ? 'primary-button'
                    : 'secondary-button';

            botonPagina.addEventListener(
                'click',
                () => {

                    cargarCotizaciones(numero);

                }
            );

            paginacion.appendChild(
                botonPagina
            );

        }

        const botonSiguiente =
            document.createElement('button');

        botonSiguiente.textContent = 'Siguiente ›';
        botonSiguiente.className = 'secondary-button';

        botonSiguiente.disabled =
            paginaActual === totalPaginas;

        botonSiguiente.addEventListener(
            'click',
            () => {

                cargarCotizaciones(
                    paginaActual + 1
                );

            }
        );

        paginacion.appendChild(
            botonSiguiente
        );

    } catch (error) {

        console.error(
            '❌ Error cargando cotizaciones:',
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    ❌ Error al cargar las cotizaciones.
                </td>
            </tr>
        `;

        paginacion.innerHTML = '';

    }

}


 // ==========================================
 // CARGAR CLIENTES
 // ==========================================

 async function cargarClientes(pagina = 1) {

     const tablaClientes =
         document.getElementById('tablaClientes');

     const paginacion =
         document.getElementById('paginacionClientes');

     if (!tablaClientes) {
         return;
     }

     tablaClientes.innerHTML = `
         <tr>
             <td colspan="3">
                 Cargando clientes...
             </td>
         </tr>
     `;

     try {

         const respuesta =
             await fetch(`/api/clientes?pagina=${pagina}`);

         const datos =
             await respuesta.json();

         if (!respuesta.ok) {

             throw new Error(
                 datos.error ||
                 'No se pudieron cargar los clientes'
             );

         }

         const clientes =
             datos.clientes || [];

         tablaClientes.innerHTML = '';

         if (clientes.length === 0) {

             tablaClientes.innerHTML = `
                 <tr>
                     <td colspan="3">
                         No hay clientes registrados.
                     </td>
                 </tr>
             `;

             if (paginacion) {
                 paginacion.innerHTML = '';
             }

             return;
         }

         clientes.forEach(cliente => {

             const fila =
                 document.createElement('tr');

             fila.innerHTML = `
                 <td>${cliente.nombre}</td>
                 <td>${cliente.telefono}</td>
                 <td>${cliente.correo}</td>
             `;

             tablaClientes.appendChild(fila);

         });

         // ========================================
         // PAGINACIÓN
         // ========================================

         if (!paginacion) {
             return;
         }

         paginacion.innerHTML = '';

         const paginaActual =
             datos.pagina;

         const totalPaginas =
             datos.totalPaginas;

         if (totalPaginas <= 1) {
             return;
         }

         const botonAnterior =
             document.createElement('button');

         botonAnterior.textContent =
             '‹ Anterior';

         botonAnterior.className =
             'secondary-button';

         botonAnterior.disabled =
             paginaActual === 1;

         botonAnterior.addEventListener(
             'click',
             () => {
                 cargarClientes(
                     paginaActual - 1
                 );
             }
         );

         paginacion.appendChild(
             botonAnterior
         );

         for (
             let numero = 1;
             numero <= totalPaginas;
             numero++
         ) {

             const botonPagina =
                 document.createElement('button');

             botonPagina.textContent =
                 numero;

             botonPagina.className =
                 numero === paginaActual
                     ? 'primary-button'
                     : 'secondary-button';

             botonPagina.addEventListener(
                 'click',
                 () => {
                     cargarClientes(numero);
                 }
             );

             paginacion.appendChild(
                 botonPagina
             );

         }

         const botonSiguiente =
             document.createElement('button');

         botonSiguiente.textContent =
             'Siguiente ›';

         botonSiguiente.className =
             'secondary-button';

         botonSiguiente.disabled =
             paginaActual === totalPaginas;

         botonSiguiente.addEventListener(
             'click',
             () => {
                 cargarClientes(
                     paginaActual + 1
                 );
             }
         );

         paginacion.appendChild(
             botonSiguiente
         );

     } catch (error) {

         console.error(
             '❌ Error cargando clientes:',
             error
         );

         tablaClientes.innerHTML = `
             <tr>
                 <td colspan="3">
                     Error al cargar los clientes.
                 </td>
             </tr>
         `;

         if (paginacion) {
             paginacion.innerHTML = '';
         }

     }

 }

// ==========================================
// NUEVO CLIENTE
// ==========================================

const btnNuevoCliente =
    document.getElementById('btnNuevoCliente');

const btnCancelarNuevoCliente =
    document.getElementById('btnCancelarNuevoCliente');

const formNuevoCliente =
    document.getElementById('formNuevoCliente');


// ==========================================
// ABRIR FORMULARIO NUEVO CLIENTE
// ==========================================

btnNuevoCliente?.addEventListener(
    'click',
    () => {

        formNuevoCliente.reset();

        mostrarVistaNuevoCliente();

    }
);


// ==========================================
// MOSTRAR VISTA NUEVO CLIENTE
// ==========================================

function mostrarVistaNuevoCliente() {

    // Ocultar todas las vistas

        vistaDashboard.classList.add('view-hidden');
        vistaCotizaciones.classList.add('view-hidden');
        vistaNuevaCotizacion.classList.add('view-hidden');
        vistaClientes.classList.add('view-hidden');
        vistaNuevoCliente.classList.add('view-hidden');
        vistaOrdenes.classList.add('view-hidden');
        vistaDetalleOT.classList.add('view-hidden');

        vistaCotizarManoObra?.classList.add('view-hidden');
        vistaDetalleCotizacionDiseno?.classList.add('view-hidden');

        vistaCotizacionesDiseno?.classList.add('view-hidden');
        vistaCotizacionesAprobacion?.classList.add('view-hidden');
        vistaHistorialAprobadas?.classList.add('view-hidden');
        vistaHistorialRechazadas?.classList.add('view-hidden');
        vistaNuevoCliente.classList.remove('view-hidden');


    pageTitle.textContent =
        'Nuevo cliente';

    pageDescription.textContent =
        'Registrar un nuevo cliente';

}


// ==========================================
// CANCELAR NUEVO CLIENTE
// ==========================================

btnCancelarNuevoCliente?.addEventListener(
    'click',
    () => {

        formNuevoCliente.reset();

        mostrarVista('clientes');

    }
);


// ==========================================
// GUARDAR NUEVO CLIENTE
// ==========================================

formNuevoCliente?.addEventListener(
    'submit',
    async function (evento) {

        evento.preventDefault();


        const nombre =
            document
                .getElementById('nuevoClienteNombre')
                .value
                .trim();

        const telefono =
            document
                .getElementById('nuevoClienteTelefono')
                .value
                .trim();

        const correo =
            document
                .getElementById('nuevoClienteCorreo')
                .value
                .trim();


        try {

            const respuesta =
                await fetch(
                    '/api/clientes',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            nombre,
                            telefono,
                            correo
                        })
                    }
                );


            const datos =
                await respuesta.json();


            if (!respuesta.ok) {

                throw new Error(
                    datos.error ||
                    'No se pudo crear el cliente'
                );

            }


            alert(
                'Cliente creado correctamente.'
            );


            formNuevoCliente.reset();

            mostrarVista('clientes');

            cargarClientes();


        } catch (error) {

            console.error(
                '❌ Error creando cliente:',
                error
            );

            alert(
                error.message ||
                'Error al crear el cliente.'
            );

        }

    }
);


// ==========================================
// ÓRDENES DE TRABAJO
// ==========================================

async function cargarOrdenes(pagina = 1) {

    const tabla =
        document.getElementById('tablaOT');

    const paginacion =
        document.getElementById('paginacionOT');

    const filtroEstado =
        document.getElementById('filtroEstadoOT');

    const filtroPrioridad =
        document.getElementById('filtroPrioridadOT');

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="7">
                Cargando órdenes...
            </td>
        </tr>
    `;

    try {

        const estado =
            filtroEstado?.value || '';

        const prioridad =
            filtroPrioridad?.value || '';

        const parametros =
            new URLSearchParams();

        parametros.set(
            'pagina',
            pagina
        );

        if (estado) {
            parametros.set(
                'estado',
                estado
            );
        }

        if (prioridad) {
            parametros.set(
                'prioridad',
                prioridad
            );
        }

        const respuesta =
            await fetch(
                `/api/ordenes-trabajo?${parametros.toString()}`
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                'Error al obtener órdenes'
            );

        }

        const ordenes =
            datos.ordenes || [];

        tabla.innerHTML = '';

        if (ordenes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="7">
                        No existen órdenes de trabajo
                        con los filtros seleccionados.
                    </td>
                </tr>
            `;

            if (paginacion) {
                paginacion.innerHTML = '';
            }

            return;
        }

        ordenes.forEach(ot => {

            const fila =
                document.createElement('tr');

            let prioridadClase =
                'status-normal';

            if (ot.prioridad === 'Prioritaria') {
                prioridadClase =
                    'status-prioritaria';
            }

            if (ot.prioridad === 'Retrasada') {
                prioridadClase =
                    'status-retrasada';
            }

            let estadoClase =
                'status-pendiente';

            fila.innerHTML = `

                <td>
                    <strong>
                        ${ot.codigo_ot}
                    </strong>
                </td>

                <td>
                    ${ot.codigo_cotizacion}
                </td>

                <td>
                    <span class="status-badge ${estadoClase}">
                        ${ot.estado}
                    </span>
                </td>

                <td>
                    <span class="status-badge ${prioridadClase}">
                        ${ot.prioridad}
                    </span>
                </td>

                <td>
                    ${ot.fecha_requerida}
                </td>

                <td>
                    ${ot.hora_requerida}
                </td>

                <td>

                    <button
                        class="secondary-button"
                        onclick="verOT(${ot.id_ot})">
                        Ver OT
                    </button>

                </td>

            `;

            tabla.appendChild(fila);

        });

        // ========================================
        // PAGINACIÓN
        // ========================================

        if (!paginacion) {
            return;
        }

        paginacion.innerHTML = '';

        const paginaActual =
            datos.pagina;

        const totalPaginas =
            datos.totalPaginas;

        if (totalPaginas <= 1) {
            return;
        }

        const botonAnterior =
            document.createElement('button');

        botonAnterior.textContent =
            '‹ Anterior';

        botonAnterior.className =
            'secondary-button';

        botonAnterior.disabled =
            paginaActual === 1;

        botonAnterior.addEventListener(
            'click',
            () => {
                cargarOrdenes(
                    paginaActual - 1
                );
            }
        );

        paginacion.appendChild(
            botonAnterior
        );

        for (
            let numero = 1;
            numero <= totalPaginas;
            numero++
        ) {

            const botonPagina =
                document.createElement('button');

            botonPagina.textContent =
                numero;

            botonPagina.className =
                numero === paginaActual
                    ? 'primary-button'
                    : 'secondary-button';

            botonPagina.addEventListener(
                'click',
                () => {
                    cargarOrdenes(numero);
                }
            );

            paginacion.appendChild(
                botonPagina
            );

        }

        const botonSiguiente =
            document.createElement('button');

        botonSiguiente.textContent =
            'Siguiente ›';

        botonSiguiente.className =
            'secondary-button';

        botonSiguiente.disabled =
            paginaActual === totalPaginas;

        botonSiguiente.addEventListener(
            'click',
            () => {
                cargarOrdenes(
                    paginaActual + 1
                );
            }
        );

        paginacion.appendChild(
            botonSiguiente
        );

    } catch (error) {

        console.error(
            '❌ Error cargando órdenes:',
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    ❌ Error al cargar las órdenes.
                </td>
            </tr>
        `;

        if (paginacion) {
            paginacion.innerHTML = '';
        }

    }

}

// ==========================================
// ÓRDENES EN REVISIÓN
// ==========================================

async function cargarOrdenesRevision(pagina = 1) {

    const tabla =
        document.getElementById(
            'tablaOTRevision'
        );

    const paginacion =
        document.getElementById(
            'paginacionOTRevision'
        );

    if (!tabla) {
        return;
    }

    tabla.innerHTML = `
        <tr>
            <td colspan="7">
                Cargando órdenes en revisión...
            </td>
        </tr>
    `;

    try {

        const respuesta =
            await fetch(
                `/api/ordenes-trabajo?pagina=${pagina}&estado=En%20Revisión`
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                'Error al obtener órdenes'
            );

        }

        const ordenes =
            datos.ordenes || [];

        tabla.innerHTML = '';

        if (ordenes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay órdenes pendientes de revisión.
                    </td>
                </tr>
            `;

            if (paginacion) {
                paginacion.innerHTML = '';
            }

            actualizarContadorOTRevision(0);

            return;
        }

        actualizarContadorOTRevision(
            datos.totalRegistros
        );

        ordenes.forEach(ot => {

            const fila =
                document.createElement('tr');

            let prioridadClase =
                'status-normal';

            if (ot.prioridad === 'Prioritaria') {
                prioridadClase =
                    'status-prioritaria';
            }

            if (ot.prioridad === 'Retrasada') {
                prioridadClase =
                    'status-retrasada';
            }

            fila.innerHTML = `

                <td>
                    <strong>
                        ${ot.codigo_ot}
                    </strong>
                </td>

                <td>
                    ${ot.codigo_cotizacion}
                </td>

                <td>
                    <span class="status-badge status-pendiente">
                        ${ot.estado}
                    </span>
                </td>

                <td>
                    <span class="status-badge ${prioridadClase}">
                        ${ot.prioridad}
                    </span>
                </td>

                <td>
                    ${ot.fecha_requerida}
                </td>

                <td>
                    ${ot.hora_requerida}
                </td>

                <td>

                    <button
                        class="secondary-button"
                        onclick="verOT(${ot.id_ot})">
                        Ver OT
                    </button>

                </td>

            `;

            tabla.appendChild(fila);

        });

        // ========================================
        // PAGINACIÓN
        // ========================================

        if (!paginacion) {
            return;
        }

        paginacion.innerHTML = '';

        const paginaActual =
            datos.pagina;

        const totalPaginas =
            datos.totalPaginas;

        if (totalPaginas <= 1) {
            return;
        }

        const botonAnterior =
            document.createElement('button');

        botonAnterior.textContent =
            '‹ Anterior';

        botonAnterior.className =
            'secondary-button';

        botonAnterior.disabled =
            paginaActual === 1;

        botonAnterior.addEventListener(
            'click',
            () => {
                cargarOrdenesRevision(
                    paginaActual - 1
                );
            }
        );

        paginacion.appendChild(
            botonAnterior
        );

        for (
            let numero = 1;
            numero <= totalPaginas;
            numero++
        ) {

            const botonPagina =
                document.createElement('button');

            botonPagina.textContent =
                numero;

            botonPagina.className =
                numero === paginaActual
                    ? 'primary-button'
                    : 'secondary-button';

            botonPagina.addEventListener(
                'click',
                () => {
                    cargarOrdenesRevision(numero);
                }
            );

            paginacion.appendChild(
                botonPagina
            );

        }

        const botonSiguiente =
            document.createElement('button');

        botonSiguiente.textContent =
            'Siguiente ›';

        botonSiguiente.className =
            'secondary-button';

        botonSiguiente.disabled =
            paginaActual === totalPaginas;

        botonSiguiente.addEventListener(
            'click',
            () => {
                cargarOrdenesRevision(
                    paginaActual + 1
                );
            }
        );

        paginacion.appendChild(
            botonSiguiente
        );

    } catch (error) {

        console.error(
            '❌ Error cargando órdenes en revisión:',
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    ❌ Error al cargar las órdenes.
                </td>
            </tr>
        `;

        if (paginacion) {
            paginacion.innerHTML = '';
        }

    }

}

function actualizarContadorOTRevision(cantidad) {

    const contador =
        document.getElementById(
            'contadorOTRevision'
        );

    if (!contador) {
        return;
    }

    if (cantidad > 0) {

        contador.textContent =
            cantidad;

        contador.style.display =
            'inline-flex';

    } else {

        contador.textContent =
            '0';

        contador.style.display =
            'none';

    }

}

// ==========================================
// ACCIONES TEMPORALES
// ==========================================

async function verCotizacion(id) {

    console.log(
        '🔎 Ver cotización:',
        id
    );

    try {

        const respuesta =
            await fetch(`/api/cotizaciones/${id}`);


        const cotizacion =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                cotizacion.error ||
                'No se pudo obtener la cotización'
            );

        }


        // Recordar desde dónde se abrió (aprobadas, rechazadas o listado general)
            const vistaActual = sessionStorage.getItem('vistaActual');

            if (vistaActual && vistaActual !== 'detalle-cotizacion') {
                vistaAnteriorCotizacion = vistaActual;
            }

            // Oculta todas las vistas y muestra solo el detalle
            mostrarVista('detalle-cotizacion');

            document
        .getElementById('accionesAprobacionCotizacion')
        ?.remove();

        pageTitle.textContent =
            `Cotización ${cotizacion.codigo_cotizacion}`;

        pageDescription.textContent =
            'Detalle de la cotización registrada';


        // ==========================================
        // INFORMACIÓN GENERAL
        // ==========================================

        document.getElementById(
            'detalleCotizacionTitulo'
        ).textContent =
            `Cotización ${cotizacion.codigo_cotizacion}`;


        document.getElementById(
            'detalleCotizacionCodigo'
        ).textContent =
            cotizacion.codigo_cotizacion;


        document.getElementById(
            'detalleCotizacionEstado'
        ).textContent =
            cotizacion.estado;


        document.getElementById(
            'detalleCotizacionCliente'
        ).textContent =
            cotizacion.cliente || '—';


        document.getElementById(
            'detalleCotizacionTelefono'
        ).textContent =
            cotizacion.telefono || '—';


        document.getElementById(
            'detalleCotizacionCorreo'
        ).textContent =
            cotizacion.correo || '—';


        document.getElementById(
            'detalleCotizacionUsuario'
        ).textContent =
            cotizacion.usuario || '—';


        // ==========================================
        // PRODUCTO
        // ==========================================

        document.getElementById(
            'detalleCotizacionProducto'
        ).textContent =
            cotizacion.tipo_producto || '—';


        document.getElementById(
            'detalleCotizacionTamano'
        ).textContent =
            cotizacion.tamaño || '—';


        document.getElementById(
            'detalleCotizacionMaterial'
        ).textContent =
            cotizacion.material || '—';


        document.getElementById(
            'detalleCotizacionImpresion'
        ).textContent =
            cotizacion.impresion || '—';


        document.getElementById(
            'detalleCotizacionCaras'
        ).textContent =
            cotizacion.caras || '—';


        document.getElementById(
            'detalleCotizacionAcabado'
        ).textContent =
            cotizacion.acabado || '—';


        document.getElementById(
            'detalleCotizacionSangrado'
        ).textContent =
            cotizacion.sangrado || '—';


        document.getElementById(
            'detalleCotizacionCantidad'
        ).textContent =
            `${Number(cotizacion.cantidad).toLocaleString()} unidades`;


        document.getElementById(
            'detalleCotizacionFecha'
        ).textContent =
            cotizacion.fecha_requerida || '—';


        document.getElementById(
            'detalleCotizacionHora'
        ).textContent =
            cotizacion.hora_requerida || '—';


        // ==========================================
        // OBSERVACIONES
        // ==========================================

        document.getElementById(
            'detalleCotizacionObservaciones'
        ).textContent =
            cotizacion.observaciones || 'Sin observaciones';


        // ==========================================
        // COSTOS
        // ==========================================

        document.getElementById(
            'detalleCotizacionPrecio'
        ).textContent =
            `S/ ${Number(cotizacion.precio_millar || 0).toFixed(2)}`;


        document.getElementById(
            'detalleCotizacionMillares'
        ).textContent =
            cotizacion.cantidad_millares || 0;


        document.getElementById(
            'detalleCotizacionProduccion'
        ).textContent =
            `S/ ${Number(
                cotizacion.costo_produccion || 0
            ).toFixed(2)}`;


        document.getElementById(
            'detalleCotizacionDiseño'
        ).textContent =
            `S/ ${Number(
                cotizacion.mano_obra_diseño || 0
            ).toFixed(2)}`;


        document.getElementById(
            'detalleCotizacionTotal'
        ).textContent =
            `S/ ${Number(
                cotizacion.total || 0
            ).toFixed(2)}`;


        document.getElementById(
            'detalleCotizacionEvaluacion'
        ).textContent =
            cotizacion.estado_evaluacion || '—';


    } catch (error) {

        console.error(
            '❌ Error mostrando cotización:',
            error
        );


        alert(
            error.message ||
            'No se pudo cargar la cotización.'
        );

    }

}

async function verCotizacionAprobacion(id) {

    try {

        await verCotizacion(id);

        const detalle =
            document.getElementById(
                'view-detalle-cotizacion'
            );

        if (!detalle) {
            throw new Error(
                'No se encontró el detalle de la cotización'
            );
        }

        document
            .getElementById(
                'accionesAprobacionCotizacion'
            )
            ?.remove();

        const acciones =
            document.createElement('div');

        acciones.id =
            'accionesAprobacionCotizacion';

        acciones.className =
            'panel';

        acciones.innerHTML = `

            <h4>Revisión de la cotización</h4>

            <div style="
                margin-top:15px;
            ">

                <label>
                    Mano de obra de diseño
                </label>

                <div style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    margin-top:8px;
                ">

                    <span>S/</span>

                    <input
                        type="number"
                        id="nuevaManoObra"
                        min="0"
                        step="0.01"
                        value="${document
                            .getElementById(
                                'detalleCotizacionDiseño'
                            )
                            .textContent
                            .replace('S/', '')
                            .trim()}">

                    <button
                        type="button"
                        class="btn-secondary"
                        id="btnModificarManoObra">
                        Modificar propuesta
                    </button>

                </div>

                <p style="
                    margin-top:10px;
                ">
                    Nuevo total:
                    <strong id="nuevoTotalCotizacion">
                        ${document
                            .getElementById(
                                'detalleCotizacionTotal'
                            )
                            .textContent}
                    </strong>
                </p>

            </div>

            <div style="
                display:flex;
                gap:10px;
                margin-top:20px;
            ">

                <button
                    type="button"
                    class="btn-primary"
                    onclick="aprobarCotizacion(${id})">
                    ✅ Aprobar cotización
                </button>

                <button
                    type="button"
                    class="btn-secondary"
                    onclick="rechazarCotizacion(${id})">
                    ❌ Rechazar cotización
                </button>

            </div>
        `;

        detalle
            .querySelector('section')
            ?.appendChild(acciones);

        const input =
            document.getElementById(
                'nuevaManoObra'
            );

        const nuevoTotal =
            document.getElementById(
                'nuevoTotalCotizacion'
            );

        const costoProduccion =
            Number(
                document
                    .getElementById(
                        'detalleCotizacionProduccion'
                    )
                    .textContent
                    .replace('S/', '')
                    .trim()
            );

        input.addEventListener(
            'input',
            () => {

                const manoObra =
                    Number(input.value) || 0;

                nuevoTotal.textContent =
                    `S/ ${(costoProduccion + manoObra).toFixed(2)}`;
            }
        );

        document
            .getElementById(
                'btnModificarManoObra'
            )
            .addEventListener(
                'click',
                async () => {

                    const manoObra =
                        Number(input.value);

                    if (
                        !Number.isFinite(manoObra) ||
                        manoObra < 0
                    ) {
                        alert(
                            'Ingrese un monto válido.'
                        );
                        return;
                    }

                    try {

                        const respuesta =
                            await fetch(
                                `/api/cotizaciones/${id}/modificar-mano-obra`,
                                {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type':
                                            'application/json'
                                    },
                                    body:
                                        JSON.stringify({
                                            mano_obra_diseño:
                                                manoObra
                                        })
                                }
                            );

                        const datos =
                            await respuesta.json();

                        if (!respuesta.ok) {
                            throw new Error(
                                datos.error ||
                                'No se pudo modificar la mano de obra'
                            );
                        }

                        alert(
                            'Propuesta de mano de obra modificada correctamente.'
                        );

                        await verCotizacionAprobacion(id);

                    } catch (error) {

                        console.error(
                            '❌ Error modificando mano de obra:',
                            error
                        );

                        alert(
                            error.message ||
                            'No se pudo modificar la mano de obra.'
                        );
                    }
                }
            );

    } catch (error) {

        console.error(
            '❌ Error mostrando cotización para aprobación:',
            error
        );

        alert(
            error.message ||
            'No se pudo abrir la cotización para aprobación.'
        );
    }
}

async function aprobarCotizacion(id) {

    console.log(
        '✅ Aprobar cotización:',
        id
    );

    try {

        const respuesta = await fetch(
            `/api/cotizaciones/${id}/aprobar`,
            {
                method: 'PATCH'
            }
        );

        const datos = await respuesta.json();

        console.log(
            '📦 Respuesta de aprobación:',
            datos
        );

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                'No se pudo aprobar la cotización'
            );
        }

        alert(
            `Cotización aprobada correctamente.\n` +
            `OT creada: ${datos.codigo_ot}\n` +
            `Prioridad: ${datos.prioridad}`
        );

            // Actualizar pendientes de aprobación
            await cargarCotizacionesPendientesAprobacion();

            // Actualizar órdenes de trabajo
            await cargarOrdenes();

            // Volver a la lista de pendientes
            mostrarVista('cotizaciones-aprobacion');

    } catch (error) {

        console.error(
            '❌ Error aprobando cotización:',
            error
        );

        alert(
            error.message ||
            'No se pudo aprobar la cotización.'
        );
    }
}

async function rechazarCotizacion(id) {

    console.log(
        '❌ Rechazar cotización:',
        id
    );

    try {

        const respuesta = await fetch(
            `/api/cotizaciones/${id}/rechazar`,
            {
                method: 'PATCH'
            }
        );

        const datos = await respuesta.json();

        console.log(
            '📦 Respuesta de rechazo:',
            datos
        );

        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                'No se pudo rechazar la cotización'
            );

        }

        alert(
            'Cotización rechazada correctamente.'
        );

        await cargarCotizacionesPendientesAprobacion();

            mostrarVista('cotizaciones-aprobacion');

    } catch (error) {

        console.error(
            '❌ Error rechazando cotización:',
            error
        );

        alert(
            error.message ||
            'No se pudo rechazar la cotización.'
        );

    }

}

// ==========================================
// CONFIGURAR DETALLE DE OT SEGÚN ROL Y ESTADO
// ==========================================

function configurarDetalleOTPorRol(ot) {

    const formularioDiseno =
        document.getElementById('formDisenoOT');

    const tituloDiseno =
        document.getElementById('tituloRegistrarDiseno');

    const formularioImpresion =
        document.getElementById('formImpresionOT');

    const tituloImpresion =
        document.getElementById('tituloRegistrarImpresion');

    const panelHistorial =
        document.getElementById('panelHistorialOT');


    // ==========================================
    // DISEÑO
    // ==========================================

    const puedeRegistrarDiseno =
        rolUsuario === 'diseñador' &&
        ot.estado === 'En Diseño';

    if (formularioDiseno) {
        formularioDiseno.style.display =
            puedeRegistrarDiseno ? '' : 'none';
    }

    if (tituloDiseno) {
        tituloDiseno.style.display =
            puedeRegistrarDiseno ? '' : 'none';
    }


    // ==========================================
    // IMPRESIÓN
    // ==========================================

    const puedeRegistrarImpresion =
        rolUsuario === 'maquinista' &&
        ot.estado === 'En Impresión';

    if (formularioImpresion) {
        formularioImpresion.style.display =
            puedeRegistrarImpresion ? '' : 'none';
    }

    if (tituloImpresion) {
        tituloImpresion.style.display =
            puedeRegistrarImpresion ? '' : 'none';
    }


    // ==========================================
    // HISTORIAL
    // ==========================================

    if (panelHistorial) {

        if (rolUsuario === 'administrador') {
            panelHistorial.style.display = '';
        } else {
            panelHistorial.style.display = 'none';
        }

    }
}

// VER ORDEN DE TRABAJO //
async function verOT(id) {

    // Recordar desde qué lista se abrió (activas, revisión o historial)
    const vistaActual = sessionStorage.getItem('vistaActual');

    if (vistaActual && vistaActual !== 'detalle-ot') {
        vistaAnteriorOT = vistaActual;
    }

    // Oculta TODAS las vistas y muestra solo el detalle
    mostrarVista('detalle-ot');

    try {

        const respuestaOT = 
            await fetch(`/api/ordenes-trabajo/${id}`
            );
        if (!respuestaOT.ok) throw new Error('OT no encontrada');
        const ot = await respuestaOT.json();

        otActualId = ot.id_ot;   // ← guardamos la OT abierta

        const respuestaCotizacion = await fetch(`/api/cotizaciones/${ot.id_cotizacion}`);
        if (!respuestaCotizacion.ok) throw new Error('Error al obtener la cotización');
        const cotizacion = await respuestaCotizacion.json();


        // ==========================================
        // INFORMACIÓN GENERAL
        // ==========================================

        document.getElementById('detalleOTCodigo')
            .textContent = ot.codigo_ot;

        document.getElementById('detalleOTEstado')
            .textContent = ot.estado;

        document.getElementById('detalleOTPrioridad')
            .textContent = ot.prioridad;

        document.getElementById('detalleOTFecha')
            .textContent = ot.fecha_requerida;

        document.getElementById('detalleOTHora')
            .textContent = ot.hora_requerida;

            mostrarAccionesEstado(ot);


        // ==========================================
        // INFORMACIÓN COTIZACIÓN
        // ==========================================

        document.getElementById('detalleOTCotizacion')
            .textContent =
            cotizacion?.codigo_cotizacion || '—';

        document.getElementById('detalleOTCliente')
            .textContent =
            cotizacion?.cliente || '—';

        document.getElementById('detalleOTProducto')
            .textContent =
            cotizacion?.tipo_producto || '—';

        document.getElementById('detalleOTCantidad')
            .textContent =
            cotizacion?.cantidad || '—';

        document.getElementById('detalleOTTamano')
            .textContent =
            cotizacion?.tamaño || '—';

        document.getElementById('detalleOTMaterial')
            .textContent =
            cotizacion?.material || '—';

        document.getElementById('detalleOTTImpresion')
            .textContent =
            cotizacion?.impresion || '—';

        document.getElementById('detalleOTColor')
            .textContent =
            cotizacion?.color || '—';

        document.getElementById('detalleOTCaras')
            .textContent =
            cotizacion?.caras || '—';

        document.getElementById('detalleOTAcabado')
            .textContent =
            cotizacion?.acabado || 'Sin acabado';

        document.getElementById('detalleOTSangrado')
            .textContent =
            cotizacion?.sangrado || '—';


        // ==========================================
        // CARGAR DISEÑOS
        // ==========================================

        const respuestaDisenos =
            await fetch(
                `/api/ordenes-trabajo/${id}/disenos`
            );

        if (!respuestaDisenos.ok) {
            throw new Error('Error al obtener diseños');
        }

        const respuestaDisenosData =
            await respuestaDisenos.json();

        const disenos =
            respuestaDisenosData.diseños || [];
            await cargarDisenosParaImpresion(id);

        const contenedorDiseno =
            document.getElementById('detalleOTDiseno');


        if (disenos.length === 0) {

            contenedorDiseno.innerHTML =
                '<p>No hay diseños registrados para esta OT.</p>';

        } else {

            contenedorDiseno.innerHTML =
                disenos.map(diseno => `

                    <div class="status-item">

                        <div>

                            <strong>
                                ${diseno.nombre_diseño}
                            </strong>

                            <small>
                                Archivo:
                                ${diseno.archivo_diseño}
                            </small>

                            <small>
                                ${diseno.descripcion || 'Sin descripción'}
                            </small>

                        </div>

                    </div>

                `).join('');

        }


        // ==========================================
        // CARGAR IMPRESIONES
        // ==========================================

        const respuestaImpresiones =
            await fetch(
                `/api/ordenes-trabajo/${id}/impresiones`
            );

        if (!respuestaImpresiones.ok) {
            throw new Error('Error al obtener impresiones');
        }

        const respuestaImpresionesData =
            await respuestaImpresiones.json();

        const impresiones =
            respuestaImpresionesData.impresiones || [];

        const contenedorImpresion =
            document.getElementById('detalleOTImpresion');


        if (impresiones.length === 0) {

            contenedorImpresion.innerHTML =
                '<p>No hay impresiones registradas para esta OT.</p>';

        } else {

            contenedorImpresion.innerHTML =
                impresiones.map(impresion => `

                    <div class="status-item">

                        <div>

                            <strong>
                                ${impresion.codigo_maquina}
                            </strong>

                            <small>
                                Cantidad impresa:
                                ${impresion.cantidad_impresa}
                            </small>

                            <small>
                                ${impresion.fecha_impresion}
                            </small>

                            <small>
                                ${impresion.observaciones || 'Sin observaciones'}
                            </small>

                        </div>

                    </div>

                `).join('');

        }


// ==========================================
// CONFIGURAR VISTA SEGÚN ROL
// ==========================================

configurarDetalleOTPorRol(ot);      


// ==========================================
// HISTORIAL / LOGS
// Solo visible para Administrador
// ==========================================

const tablaLogs =
    document.getElementById('tablaLogsOT');

if (rolUsuario === 'administrador') {

    const respuestaLogs =
        await fetch(`/api/ordenes-trabajo/${id}/logs`);

    if (!respuestaLogs.ok) {
        throw new Error('Error al obtener historial');
    }

    const datosLogs =
        await respuestaLogs.json();

    const logs =
        datosLogs.logs || [];

    if (!logs.length) {

        tablaLogs.innerHTML = `
            <tr>
                <td colspan="6">
                    No hay registros en el historial.
                </td>
            </tr>
        `;

    } else {

        tablaLogs.innerHTML =
            logs.map(log => `
                <tr>
                    <td>${log.fecha_hora || ''}</td>
                    <td>${log.usuario || ''}</td>
                    <td>${log.tipo_evento || ''}</td>
                    <td>${log.estado_anterior || '-'}</td>
                    <td>${log.estado_nuevo || '-'}</td>
                    <td>${log.detalle_evento || '-'}</td>
                </tr>
            `).join('');
    }

} else {

    // El Cotizador, Diseñador y Maquinista
    // no consultan ni visualizan los logs.
    if (tablaLogs) {
        tablaLogs.innerHTML = '';
    }
}

} catch (error) {

    console.error(
        '❌ Error cargando detalle de OT:',
        error
    );

    alert(
        'No se pudo cargar el detalle de la OT.'
    );

    mostrarVista('ordenes');
}
}

// ==========================================
// GENERAR ACCIONES SEGÚN ESTADO DE LA OT
// ==========================================

function mostrarAccionesEstado(ot) {

    const contenedor =
        document.getElementById('accionesEstadoOT');

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = '';


    // ==========================================
    // OT FINALIZADA
    // ==========================================

    if (ot.estado === 'Finalizada') {

        contenedor.innerHTML = `
            <div class="status-item">

                <div>

                    <strong>🔒 OT Finalizada</strong>

                    <small>
                        Esta orden de trabajo ya fue cerrada
                        y no admite nuevos cambios de estado.
                    </small>

                </div>

            </div>
        `;

        return;
    }


    // ==========================================
    // ADMINISTRADOR
    // ==========================================

    if (rolUsuario === 'administrador') {

        if (ot.estado === 'Pendiente') {

            contenedor.innerHTML = `
                <button
                    class="primary-button"
                    onclick="cambiarEstadoOT(${ot.id_ot}, 'En Diseño')">

                    Iniciar diseño →

                </button>
            `;

            return;
        }


        if (ot.estado === 'En Diseño') {

            contenedor.innerHTML = `
                <button
                    class="primary-button"
                    onclick="cambiarEstadoOT(${ot.id_ot}, 'En Impresión')">

                    Pasar a impresión →

                </button>
            `;

            return;
        }


        if (ot.estado === 'En Impresión') {

            contenedor.innerHTML = `
                <button
                    class="primary-button"
                    onclick="cambiarEstadoOT(${ot.id_ot}, 'En Revisión')">

                    Enviar a revisión →

                </button>
            `;

            return;
        }


        if (ot.estado === 'En Revisión') {

            contenedor.innerHTML = `

                <div>

                    <button
                        class="secondary-button"
                        onclick="cambiarEstadoOT(${ot.id_ot}, 'En Diseño')">

                        Corregir diseño

                    </button>


                    <button
                        class="secondary-button"
                        onclick="cambiarEstadoOT(${ot.id_ot}, 'En Impresión')">

                        Corregir impresión

                    </button>


                    <button
                        class="primary-button"
                        onclick="cambiarEstadoOT(${ot.id_ot}, 'Finalizada')">

                        Finalizar OT

                    </button>

                </div>

            `;

            return;
        }
    }


    // ==========================================
    // DISEÑADOR
    // ==========================================

    if (rolUsuario === 'diseñador') {

        if (ot.estado === 'Pendiente') {

            contenedor.innerHTML = `
                <button
                    class="primary-button"
                    onclick="cambiarEstadoOT(${ot.id_ot}, 'En Diseño')">

                    Iniciar diseño →

                </button>
            `;

            return;
        }


        if (ot.estado === 'En Diseño') {

            contenedor.innerHTML = `
                <button
                    class="primary-button"
                    onclick="cambiarEstadoOT(${ot.id_ot}, 'En Impresión')">

                    Pasar a impresión →

                </button>
            `;

            return;
        }
    }


    // ==========================================
    // MAQUINISTA
    // ==========================================

    if (rolUsuario === 'maquinista') {

        if (ot.estado === 'En Impresión') {

            contenedor.innerHTML = `
                <button
                    class="primary-button"
                    onclick="cambiarEstadoOT(${ot.id_ot}, 'En Revisión')">

                    Enviar a revisión →

                </button>
            `;

            return;
        }
    }


    // ==========================================
    // COTIZADOR
    // ==========================================

    if (rolUsuario === 'cotizador') {

        if (ot.estado === 'En Revisión') {

            contenedor.innerHTML = `

                <div>

                    <button
                        class="secondary-button"
                        onclick="cambiarEstadoOT(${ot.id_ot}, 'En Diseño')">

                        Corregir diseño

                    </button>


                    <button
                        class="secondary-button"
                        onclick="cambiarEstadoOT(${ot.id_ot}, 'En Impresión')">

                        Corregir impresión

                    </button>


                    <button
                        class="primary-button"
                        onclick="cambiarEstadoOT(${ot.id_ot}, 'Finalizada')">

                        Finalizar OT

                    </button>

                </div>

            `;

            return;
        }
    }


    // ==========================================
    // SIN ACCIONES
    // ==========================================

    contenedor.innerHTML = `
        <p>
            No hay acciones disponibles para este usuario
            en el estado actual de la OT.
        </p>
    `;
}


// ==========================================
// CAMBIAR ESTADO DE OT
// ==========================================

async function cambiarEstadoOT(idOT, nuevoEstado) {

    const confirmar =
        confirm(
            `¿Confirmas cambiar la OT al estado "${nuevoEstado}"?`
        );

    if (!confirmar) {
        return;
    }

    try {

        console.log('🔎 ID OT:', idOT);
        console.log('🔎 Nuevo estado:', nuevoEstado);

        const respuesta = await fetch(
            `/api/ordenes-trabajo/${idOT}/estado`,
            {
                method: 'PATCH',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    estado_nuevo: nuevoEstado
                })
            }
        );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                'No se pudo cambiar el estado'
            );
        }

        alert(datos.mensaje);


        // ==========================================
        // SI ESTÁBAMOS EN "EN REVISIÓN"
        // ==========================================

        if (
            nuevoEstado === 'Finalizada' ||
            nuevoEstado === 'En Diseño' ||
            nuevoEstado === 'En Impresión'
        ) {

            mostrarVista('ordenes-revision');

            await cargarOrdenesRevision();

            return;
        }


        // ==========================================
        // RESTO DE CAMBIOS DE ESTADO
        // ==========================================

        await cargarOrdenes();

        await verOT(idOT);


    } catch (error) {

        console.error(
            'Error cambiando estado de OT:',
            error
        );

        alert(
            error.message ||
            'Error cambiando estado de la OT'
        );
    }
}


// ==========================================
// REGISTRAR DISEÑO EN UNA OT
// ==========================================

document
    .getElementById('formDisenoOT')
    ?.addEventListener('submit', async function (event) {

        console.log('🟣 SUBMIT DISEÑO EJECUTADO');

        event.preventDefault();

        try {

    if (!otActualId) {
        throw new Error(
            'No hay una OT abierta'
        );
    }

            const nombreDiseno =
                document.getElementById('nombreDiseno').value.trim();

            const archivoDiseno =
                document.getElementById('archivoDiseno').value.trim();

            const descripcionDiseno =
                document.getElementById('descripcionDiseno').value.trim();

            const respuesta =
                await fetch(`/api/ordenes-trabajo/${otActualId}/diseno`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({
                            nombre_diseño: nombreDiseno,
                            descripcion: descripcionDiseno,
                            archivo_diseño: archivoDiseno,
                        })
                    }
                );

            const datos =
                await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.error ||
                    'No se pudo registrar el diseño'
                );
            }

            alert('Diseño registrado correctamente.');

            // Limpiar formulario
            document
                .getElementById('formDisenoOT')
                .reset();

            // Recargar detalle completo
            await verOT(otActualId);

        } catch (error) {

            console.error(
                '❌ Error registrando diseño:',
                error
            );

            alert(
                error.message ||
                'No se pudo registrar el diseño.'
            );

        }

    });


// ==========================================
// REGISTRAR IMPRESIÓN EN UNA OT
// ==========================================

document
    .getElementById('formImpresionOT')
    ?.addEventListener('submit', async function (event) {

        console.log(
            '🔥 SUBMIT IMPRESIÓN EJECUTADO',
            Date.now()
        );

        event.preventDefault();

        // resto del código...

        try {

    if (!otActualId) {
        throw new Error(
            'No hay una OT abierta'
        );
    }

            const idDiseno =
                document.getElementById('disenoImpresion').value;

            const codigoMaquina =
                document
                    .getElementById('maquinaImpresion')
                    .value.trim();

            const cantidadImpresa =
                document
                    .getElementById('cantidadImpresion')
                    .value;

            const observaciones =
                document
                    .getElementById('observacionesImpresion')
                    .value.trim();

            if (!idDiseno) {
                alert('Selecciona un diseño.');
                return;
            }

            const respuesta =
                await fetch(
                    `/api/ordenes-trabajo/${otActualId}/impresion`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({
                            id_diseño: Number(idDiseno),
                            codigo_maquina: codigoMaquina,
                            cantidad_impresa: Number(cantidadImpresa),
                            observaciones: observaciones
                        })
                    }
                );

            const datos =
                await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.error ||
                    'No se pudo registrar la impresión'
                );
            }

            alert('Impresión registrada correctamente.');

            // Limpiar formulario
            document
                .getElementById('formImpresionOT')
                .reset();

            // Recargar detalle
            await verOT(otActualId);

        } catch (error) {

            console.error(
                '❌ Error registrando impresión:',
                error
            );

            alert(
                error.message ||
                'No se pudo registrar la impresión.'
            );

        }

    });


// ==========================================
// CARGAR DISEÑOS EN SELECT DE IMPRESIÓN
// ==========================================

async function cargarDisenosParaImpresion(idOT) {

    const selector =
        document.getElementById('disenoImpresion');

    if (!selector) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                `/api/ordenes-trabajo/${idOT}/disenos`
            );

        if (!respuesta.ok) {
            throw new Error('No se pudieron obtener los diseños');
        }

        const datos =
            await respuesta.json();

        const disenos =
            datos.diseños || [];

        selector.innerHTML = `
            <option value="">
                Seleccionar diseño
            </option>
        `;

        disenos.forEach(diseno => {

            const opcion =
                document.createElement('option');

            opcion.value = diseno.id_diseño;

            opcion.textContent =
                `${diseno.nombre_diseño} — ${diseno.archivo_diseño}`;

            selector.appendChild(opcion);

        });

    } catch (error) {

        console.error(
            '❌ Error cargando diseños para impresión:',
            error
        );

        selector.innerHTML = `
            <option value="">
                No se pudieron cargar los diseños
            </option>
        `;

    }

}

// ==========================================
// VISTA: NUEVA COTIZACIÓN
// ==========================================


console.log('📍 LLEGAMOS A LA SECCIÓN NUEVA COTIZACIÓN');

// Abrir formulario de nueva cotización
btnNuevaCotizacion?.addEventListener('click', async () => {

    console.log('🟢 CLICK EN NUEVA COTIZACIÓN');

    vistaDashboard.classList.add('view-hidden');
    vistaCotizaciones.classList.add('view-hidden');
    vistaOrdenes.classList.add('view-hidden');
    await cargarClientesParaCotizacion();
    await cargarTarifasCotizacion();

    vistaNuevaCotizacion.classList.remove('view-hidden');

    pageTitle.textContent = 'Nueva cotización';
    pageDescription.textContent =
        'Registrar una nueva solicitud de cotización';
});


// Botón volver
btnCancelarCotizacion?.addEventListener('click', () => {

    vistaNuevaCotizacion.classList.add('view-hidden');

    if (rolUsuario === 'cotizador') {
    mostrarVista('ordenes-activas');
} else {
    mostrarVista('dashboard');
}

});


// Botón cancelar del formulario
btnCancelarCotizacionForm?.addEventListener('click', () => {

    vistaNuevaCotizacion.classList.add('view-hidden');

    document
        .getElementById('formNuevaCotizacion')
        ?.reset();

    if (rolUsuario === 'cotizador') {
    mostrarVista('ordenes-activas');
} else {
    mostrarVista('dashboard');
}

});


// ==========================================
// GUARDAR NUEVA COTIZACIÓN
// ==========================================
console.log('📝 Listener de nueva cotización cargado');

document
.getElementById('formNuevaCotizacion')
    ?.addEventListener('submit', async function (event) {

        event.preventDefault();
        console.log('🔥 BOTÓN GUARDAR COTIZACIÓN PRESIONADO');
        try {

const datosCotizacion = {

    // =========================
    // CLIENTE SELECCIONADO
    // =========================

    id_cliente:
        Number(
            document
                .getElementById('cotizacionIdCliente')
                .value
        ),


    // =========================
    // DATOS DE LA COTIZACIÓN
    // =========================

    tipo_producto:
        document
            .getElementById('cotizacionProducto')
            .value
            .trim(),

    tamaño:
        document
            .getElementById('cotizacionTamano')
            .value
            .trim(),

    material:
        document
            .getElementById('cotizacionMaterial')
            .value
            .trim(),

    impresion:
        document
            .getElementById('cotizacionImpresion')
            .value
            .trim(),

    color:
        document
            .getElementById('cotizacionImpresion')
            .value
            .trim(),

    caras:
    document
        .getElementById('cotizacionCaras')
        .value
        .trim(),
        
    acabado:
        document
            .getElementById('cotizacionAcabado')
            .value
            .trim(),

    sangrado:
        document
            .getElementById('cotizacionSangrado')
            .value
            .trim(),

    cantidad:
        Number(
            document
                .getElementById('cotizacionCantidad')
                .value
        ),

    fecha_requerida:
        document
            .getElementById('cotizacionFecha')
            .value,

    hora_requerida:
        document
            .getElementById('cotizacionHora')
            .value,

    observaciones:
        document
            .getElementById('cotizacionObservaciones')
            .value
            .trim()

};



            const respuesta =
                await fetch(
                    '/api/cotizaciones',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body:
                            JSON.stringify(
                                datosCotizacion
                            )
                    }
                );


            const datos =
                await respuesta.json();

                console.log('📦 Respuesta del servidor:', datos);

            if (!respuesta.ok) {

                throw new Error(
                    datos.error ||
                    'No se pudo crear la cotización'
                );

            }


            alert(
                `Cotización ${datos.cotizacion?.codigo_cotizacion || 'creada'} creada correctamente`
            );

            // Limpiar formulario
            document
                .getElementById('formNuevaCotizacion')
                .reset();


            // Volver a la lista
            // Después de crear la cotización:
            // el cotizador va a "Pendientes de diseñador",
            // el resto de roles vuelve al dashboard.
            if (rolUsuario === 'cotizador') {

                mostrarVista('cotizaciones-diseno');

                // Dejar abierto el submenú y resaltar la opción
                submenuCotizaciones?.classList.add('abierto');

                submenuItems.forEach(subitem => {
                    subitem.classList.toggle(
                        'active',
                        subitem.dataset.view === 'cotizaciones-diseno'
                    );
                });

            } else {

                mostrarVista('dashboard');

            }


        } catch (error) {

            console.error(
                '❌ Error creando cotización:',
                error
            );

            alert(
                error.message ||
                'No se pudo crear la cotización.'
            );

        }

    });

    // ==========================================
// BUSCADOR DE CLIENTES PARA COTIZACIÓN
// ==========================================

const inputBusquedaCliente =
    document.getElementById('cotizacionClienteBusqueda');

const resultadosBusquedaClientes =
    document.getElementById('resultadosBusquedaClientes');

const inputIdCliente =
    document.getElementById('cotizacionIdCliente');

const inputNombreCliente =
    document.getElementById('cotizacionClienteNombre');

const inputTelefonoCliente =
    document.getElementById('cotizacionClienteTelefono');

const inputCorreoCliente =
    document.getElementById('cotizacionClienteCorreo');


let clientesDisponibles = [];


// ==========================================
// CARGAR CLIENTES
// ==========================================

async function cargarClientesParaCotizacion() {

    try {

        const respuesta =
            await fetch('/api/clientes');

        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                'No se pudieron cargar los clientes'
            );

        }


        clientesDisponibles =
            datos.clientes || [];


        console.log(
            '👥 Clientes cargados:',
            clientesDisponibles
        );


    } catch (error) {

        console.error(
            '❌ Error cargando clientes:',
            error
        );

    }

}


// ==========================================
// BUSCAR CLIENTES
// ==========================================

inputBusquedaCliente?.addEventListener(
    'input',
    function () {

        const texto =
            this.value
                .trim()
                .toLowerCase();


        resultadosBusquedaClientes.innerHTML = '';


        if (!texto) {

            return;

        }


        const resultados =
            clientesDisponibles.filter(cliente =>
                cliente.nombre
                    .toLowerCase()
                    .includes(texto)
            );


        if (resultados.length === 0) {

            resultadosBusquedaClientes.innerHTML = `
                <div class="resultado-cliente-vacio">
                    No se encontraron clientes.
                </div>
            `;

            return;

        }


        resultados.forEach(cliente => {

            const elemento =
                document.createElement('div');

            elemento.classList.add(
                'resultado-cliente'
            );


            elemento.innerHTML = `
                <strong>
                    ${cliente.nombre}
                </strong>

                <span>
                    ${cliente.telefono}
                </span>

                <span>
                    ${cliente.correo}
                </span>
            `;


            elemento.addEventListener(
                'click',
                () => {

                    seleccionarCliente(cliente);

                }
            );


            resultadosBusquedaClientes.appendChild(
                elemento
            );

        });

    }
);


// ==========================================
// SELECCIONAR CLIENTE
// ==========================================

function seleccionarCliente(cliente) {

    inputIdCliente.value =
        cliente.id_cliente;


    inputBusquedaCliente.value = '';


    inputNombreCliente.value =
        cliente.nombre;


    inputTelefonoCliente.value =
        cliente.telefono;


    inputCorreoCliente.value =
        cliente.correo;


    resultadosBusquedaClientes.innerHTML = '';


    console.log(
        '👤 Cliente seleccionado:',
        cliente
    );

}


document
    .getElementById('btnVolverCotizaciones')
    ?.addEventListener('click', () => {
        mostrarVista(vistaAnteriorCotizacion);
    });


// ==========================================
// CARGAR CLIENTES AL ABRIR NUEVA COTIZACIÓN
// ==========================================


window.volverOrdenes = function() {
    mostrarVista(vistaAnteriorOT);
};

async function cargarCotizacionesDiseno() {

    try {

        const respuesta =
            await fetch('/api/cotizaciones/diseno-pendientes');

        const cotizaciones =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                cotizaciones.error ||
                'No se pudieron cargar las cotizaciones'
            );
        }

        const cuerpo =
            document.getElementById(
                'tablaCotizacionesDiseno'
            );

        cuerpo.innerHTML = '';

        if (cotizaciones.length === 0) {

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="8">
                        No hay cotizaciones pendientes de evaluación.
                    </td>
                </tr>
            `;

            return;
        }

        cotizaciones.forEach(cotizacion => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>${cotizacion.codigo_cotizacion}</td>

                <td>${cotizacion.tipo_producto}</td>

                <td>${cotizacion.tamaño}</td>

                <td>${cotizacion.material}</td>

                <td>${cotizacion.cantidad}</td>

                <td>
                    S/ ${Number(
                        cotizacion.costo_produccion
                    ).toFixed(2)}
                </td>

                <td>
                    ${cotizacion.fecha_requerida}
                    ${cotizacion.hora_requerida}
                </td>

                <td>
                    <button
                        class="btn-primary"
                        onclick="abrirCotizacionDiseno(${cotizacion.id_cotizacion})">
                        Cotizar
                    </button>
                </td>
            `;

            cuerpo.appendChild(fila);
        });

    } catch (error) {

        console.error(
            '❌ Error cargando cotizaciones de diseño:',
            error
        );

    }
}

async function abrirCotizacionDiseno(id) {

    try {

        const respuesta =
            await fetch(`/api/cotizaciones/${id}`);

        const cotizacion =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                cotizacion.error ||
                'No se pudo obtener la cotización'
            );
        }

        vistaCotizarManoObra.classList.add(
            'view-hidden'
        );

        vistaDetalleCotizacionDiseno.classList.remove(
            'view-hidden'
        );

        pageTitle.textContent =
            'Cotizar mano de obra';

        pageDescription.textContent =
            'Evaluación del costo de diseño';

        const detalle =
            document.getElementById(
                'detalleCotizacionDiseno'
            );

        detalle.innerHTML = `

            <div class="detail-grid">

                <div>
                    <strong>Código:</strong>
                    ${cotizacion.codigo_cotizacion}
                </div>

                <div>
                    <strong>Producto:</strong>
                    ${cotizacion.tipo_producto}
                </div>

                <div>
                    <strong>Tamaño:</strong>
                    ${cotizacion.tamaño}
                </div>

                <div>
                    <strong>Material:</strong>
                    ${cotizacion.material}
                </div>

                <div>
                    <strong>Impresión:</strong>
                    ${cotizacion.impresion}
                </div>

                <div>
                    <strong>Color:</strong>
                    ${cotizacion.color}
                </div>

                <div>
                    <strong>Acabado:</strong>
                    ${cotizacion.acabado || 'Sin acabado'}
                </div>

                <div>
                    <strong>Sangrado:</strong>
                    ${cotizacion.sangrado || 'No especificado'}
                </div>

                <div>
                    <strong>Cantidad:</strong>
                    ${cotizacion.cantidad}
                </div>

                <div>
                    <strong>Fecha requerida:</strong>
                    ${cotizacion.fecha_requerida}
                </div>

                <div>
                    <strong>Hora requerida:</strong>
                    ${cotizacion.hora_requerida}
                </div>

            </div>

            <hr>

            <div class="panel">

                <h3>Evaluación de mano de obra</h3>

                <p>
                Costo de producción:
                <strong>
                    S/ ${Number(
                        cotizacion.costo_produccion || 0
                    ).toFixed(2)}
                </strong>
            </p>

            <p>
                Mano de obra sugerida por el sistema (25%):
                <strong>
                    S/ ${(
                        Number(cotizacion.costo_produccion || 0) * 0.25
                    ).toFixed(2)}
                </strong>
            </p>

            <div style="margin-top: 20px;">

                <label for="manoObraPropuesta">
                    Mano de obra propuesta por el diseñador
                </label>

                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">

                    <span>S/</span>

                    <input
                        type="number"
                        id="manoObraPropuesta"
                        min="0"
                        step="0.01"
                        value="${(
                            Number(cotizacion.costo_produccion || 0) * 0.25
                        ).toFixed(2)}"
                    >

                </div>

            </div>

            <div style="margin-top: 20px;">

                <button
                    type="button"
                    class="btn-primary"
                    onclick="enviarPropuestaDiseno(${cotizacion.id_cotizacion})">
                    Enviar propuesta
                </button>

                <button
                    type="button"
                    class="btn-secondary"
                    onclick="volverCotizacionesDiseno()">
                    Volver
                </button>

            </div>

            </div>
        `;

    } catch (error) {

        console.error(
            '❌ Error abriendo cotización de diseño:',
            error
        );

        alert(
            error.message ||
            'Error al abrir la cotización'
        );
    }
}

function volverCotizacionesDiseno() {

    vistaDetalleCotizacionDiseno.classList.add(
        'view-hidden'
    );

    vistaCotizarManoObra.classList.remove(
        'view-hidden'
    );

    pageTitle.textContent =
        'Cotizar mano de obra';

    pageDescription.textContent =
        'Evaluación de mano de obra de diseño';

    cargarCotizacionesDiseno();
}

async function enviarPropuestaDiseno(id) {

    try {

        const input =
            document.getElementById(
                'manoObraPropuesta'
            );

        if (!input) {
            throw new Error(
                'No se encontró el monto de mano de obra'
            );
        }

        const manoObra =
            Number(input.value);

        if (
            !Number.isFinite(manoObra) ||
            manoObra < 0
        ) {
            alert(
                'Ingrese un monto válido de mano de obra.'
            );
            return;
        }

        const respuesta =
            await fetch(
                `/api/cotizaciones/${id}/propuesta-diseno`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        mano_obra_diseño:
                            manoObra
                    })
                }
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                'No se pudo enviar la propuesta'
            );
        }

        alert(
            'Propuesta de mano de obra enviada correctamente.'
        );

        vistaDetalleCotizacionDiseno.classList.add(
            'view-hidden'
        );

        vistaCotizarManoObra.classList.remove(
            'view-hidden'
        );

        await cargarCotizacionesDiseno();

    } catch (error) {

        console.error(
            '❌ Error enviando propuesta de diseño:',
            error
        );

        alert(
            error.message ||
            'No se pudo enviar la propuesta.'
        );
    }
}

async function cargarCotizacionesPendientesDisenador() {

    try {

        const respuesta =
            await fetch(
                '/api/cotizaciones/pendientes-disenador'
            );

        const cotizaciones =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                cotizaciones.error ||
                'No se pudieron cargar las cotizaciones'
            );
        }

        const cuerpo =
            document.getElementById(
                'tablaCotizacionesDisenoCotizador'
            );

        cuerpo.innerHTML = '';

        if (cotizaciones.length === 0) {

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay cotizaciones pendientes de diseñador.
                    </td>
                </tr>
            `;

            return;
        }

        cotizaciones.forEach(cotizacion => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>${cotizacion.codigo_cotizacion}</td>
                <td>${cotizacion.cliente}</td>
                <td>${cotizacion.tipo_producto}</td>
                <td>${cotizacion.cantidad}</td>
                <td>
                    S/
                    ${Number(
                        cotizacion.costo_produccion
                    ).toFixed(2)}
                </td>
                <td>
                    ${cotizacion.fecha_requerida}
                    ${cotizacion.hora_requerida}
                </td>
                <td>
                    ${cotizacion.estado}
                </td>
            `;

            cuerpo.appendChild(fila);

        });

    } catch (error) {

        console.error(
            '❌ Error cargando pendientes de diseñador:',
            error
        );
    }
}

async function cargarCotizacionesPendientesAprobacion() {

    try {

        const respuesta =
            await fetch(
                '/api/cotizaciones/pendientes-aprobacion'
            );

        const cotizaciones =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                cotizaciones.error ||
                'No se pudieron cargar las cotizaciones'
            );
        }

        const cuerpo =
            document.getElementById(
                'tablaCotizacionesAprobacion'
            );

        cuerpo.innerHTML = '';

        if (cotizaciones.length === 0) {

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay cotizaciones pendientes de aprobación.
                    </td>
                </tr>
            `;

            return;
        }

        cotizaciones.forEach(cotizacion => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>${cotizacion.codigo_cotizacion}</td>
                <td>${cotizacion.cliente}</td>
                <td>${cotizacion.tipo_producto}</td>

                <td>
                    S/
                    ${Number(
                        cotizacion.costo_produccion
                    ).toFixed(2)}
                </td>

                <td>
                    S/
                    ${Number(
                        cotizacion.mano_obra_diseño
                    ).toFixed(2)}
                </td>

                <td>
                    S/
                    ${Number(
                        cotizacion.total
                    ).toFixed(2)}
                </td>

                <td>
                    <button
                        class="btn-primary"
                        onclick="verCotizacionAprobacion(
                            ${cotizacion.id_cotizacion}
                        )">
                        Revisar
                    </button>
                </td>
            `;

            cuerpo.appendChild(fila);

        });

    } catch (error) {

        console.error(
            '❌ Error cargando pendientes de aprobación:',
            error
        );
    }
}


async function cargarHistorialAprobadas() {

    try {

        const respuesta =
            await fetch(
                '/api/cotizaciones/historial/aprobadas'
            );

        const cotizaciones =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                cotizaciones.error ||
                'No se pudieron cargar las aprobadas'
            );
        }

        const cuerpo =
            document.getElementById(
                'tablaHistorialAprobadas'
            );

        cuerpo.innerHTML = '';

        if (cotizaciones.length === 0) {

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="8">
                        No hay cotizaciones aprobadas.
                    </td>
                </tr>
            `;

            return;
        }

        cotizaciones.forEach(cotizacion => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>${cotizacion.codigo_cotizacion}</td>

                <td>${cotizacion.cliente}</td>

                <td>${cotizacion.tipo_producto}</td>

                <td>${cotizacion.cantidad}</td>

                <td>
                    S/
                    ${Number(
                        cotizacion.total
                    ).toFixed(2)}
                </td>

                <td>${cotizacion.estado}</td>

                <td>${cotizacion.fecha_actualizacion}</td>

                <td>
                    <button
                        class="btn-primary"
                        onclick="verCotizacion(
                            ${cotizacion.id_cotizacion}
                        )">
                        Ver detalle
                    </button>
                </td>
            `;

            cuerpo.appendChild(fila);

        });

    } catch (error) {

        console.error(
            '❌ Error cargando aprobadas:',
            error
        );

    }

}


async function cargarHistorialRechazadas() {

    try {

        const respuesta =
            await fetch(
                '/api/cotizaciones/historial/rechazadas'
            );

        const cotizaciones =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                cotizaciones.error ||
                'No se pudieron cargar las rechazadas'
            );
        }

        const cuerpo =
            document.getElementById(
                'tablaHistorialRechazadas'
            );

        cuerpo.innerHTML = '';

        if (cotizaciones.length === 0) {

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="8">
                        No hay cotizaciones rechazadas.
                    </td>
                </tr>
            `;

            return;
        }

        cotizaciones.forEach(cotizacion => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>${cotizacion.codigo_cotizacion}</td>

                <td>${cotizacion.cliente}</td>

                <td>${cotizacion.tipo_producto}</td>

                <td>${cotizacion.cantidad}</td>

                <td>
                    S/
                    ${Number(
                        cotizacion.total
                    ).toFixed(2)}
                </td>

                <td>${cotizacion.estado}</td>

                <td>${cotizacion.fecha_actualizacion}</td>

                <td>
                    <button
                        class="btn-primary"
                        onclick="verCotizacion(
                            ${cotizacion.id_cotizacion}
                        )">
                        Ver detalle
                    </button>
                </td>
            `;

            cuerpo.appendChild(fila);

        });

    } catch (error) {

        console.error(
            '❌ Error cargando rechazadas:',
            error
        );

    }

}

// ==========================================
// RESTAURAR SESIÓN AL RECARGAR
// ==========================================

window.addEventListener('DOMContentLoaded', async () => {

    try {

        const respuesta =
            await fetch('/api/perfil');

        if (!respuesta.ok) {
            return;
        }

        const datos =
            await respuesta.json();

        if (!datos.usuario) {
            return;
        }

        mostrarSistema(datos.usuario);

        await cargarPerfil();

    } catch (error) {

        console.error(
            '❌ No se pudo restaurar la sesión:',
            error
        );

    }

});

    