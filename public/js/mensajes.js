// ==========================================
// CUADRO COMPARTIDO PARA TODOS LOS MENSAJES
// ==========================================
const elementosMensaje = {
    cuadro: document.getElementById('modalConfirmacion'),
    titulo: document.getElementById('tituloConfirmacion'),
    texto: document.getElementById('mensajeConfirmacion'),
    icono: document.getElementById('iconoConfirmacion'),
    aceptar: document.getElementById('btnConfirmarAccion'),
    cancelar: document.getElementById('btnCancelarConfirmacion'),
    cerrar: document.getElementById('btnCerrarConfirmacion')
};
const estilosMensaje = {
    exito: {icono:'✓', titulo:'Operación completada'},
    error: {icono:'×', titulo:'No se pudo completar'},
    advertencia: {icono:'!', titulo:'Revisa los datos'},
    informacion: {icono:'i', titulo:'Información'},
    confirmacion: {icono:'?', titulo:'Confirmar acción'}
};
let colaMensajes = [];
let mensajeActivo = null;
let confirmacionPendiente = false;
let componenteMensaje = null;
let fondoRespaldo = null;
let overflowAnterior = '';

// Conservar esta función actualiza todos los avisos existentes de la aplicación.
function mostrarNotificacion(mensaje, opciones = {}) {
    const tipo = Object.hasOwn(estilosMensaje, opciones.tipo) && opciones.tipo !== 'confirmacion'
        ? opciones.tipo : 'informacion';
    return encolarMensaje(mensaje, {...opciones, tipo}, false);
}

function confirmarAccion(mensaje, opciones = {}) {
    // Una doble pulsación no debe enviar dos solicitudes al servidor.
    if (confirmacionPendiente) return Promise.resolve(false);
    if (!window.bootstrap?.Modal) {
        mostrarNotificacion('Actualiza la página e inténtalo de nuevo.', {
            tipo:'error', titulo:'No se pudo abrir la confirmación'
        });
        return Promise.resolve(false);
    }
    confirmacionPendiente = true;
    return encolarMensaje(mensaje, {...opciones, tipo:'confirmacion'}, true);
}

function encolarMensaje(texto, opciones, esConfirmacion) {
    return new Promise(resolve => {
        colaMensajes.push({texto, opciones, esConfirmacion, resolve,
            aceptado:false, descartar:false, listo:false, cerrando:false, origen:document.activeElement});
        mostrarSiguienteMensaje();
    });
}

function mostrarSiguienteMensaje() {
    if (mensajeActivo || colaMensajes.length === 0) return;
    mensajeActivo = colaMensajes.shift();
    const {opciones, esConfirmacion} = mensajeActivo;
    const estilo = estilosMensaje[opciones.tipo];

    // Usar textContent conserva la protección contra HTML introducido como dato.
    elementosMensaje.titulo.textContent = opciones.titulo || estilo.titulo;
    elementosMensaje.texto.textContent = String(mensajeActivo.texto ?? '');
    elementosMensaje.icono.textContent = estilo.icono;
    elementosMensaje.cuadro.dataset.tipo = opciones.tipo;
    elementosMensaje.cuadro.dataset.confirmacion = String(esConfirmacion);
    elementosMensaje.cancelar.hidden = !esConfirmacion;
    elementosMensaje.aceptar.textContent = esConfirmacion
        ? (opciones.textoConfirmar || 'Confirmar') : 'Aceptar';
    elementosMensaje.aceptar.disabled = true;

    if (window.bootstrap?.Modal) {
        componenteMensaje = bootstrap.Modal.getOrCreateInstance(elementosMensaje.cuadro);
        componenteMensaje.show();
    } else {
        // Si falla el CDN, los avisos conservan el mismo cuadro y botón de cierre.
        // Las operaciones que necesitan confirmación ya quedaron bloqueadas arriba.
        overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        fondoRespaldo = document.createElement('div');
        fondoRespaldo.className = 'modal-backdrop show';
        document.body.appendChild(fondoRespaldo);
        elementosMensaje.cuadro.style.display = 'block';
        elementosMensaje.cuadro.classList.add('show');
        elementosMensaje.cuadro.removeAttribute('aria-hidden');
        elementosMensaje.cuadro.setAttribute('aria-modal', 'true');
        elementosMensaje.cuadro.setAttribute('role', 'dialog');
        prepararMensajeVisible();
    }
}

function prepararMensajeVisible() {
    if (!mensajeActivo) return;
    mensajeActivo.listo = true;
    if (mensajeActivo.descartar) {
        cerrarMensaje(false);
        return;
    }
    elementosMensaje.aceptar.disabled = false;
    (mensajeActivo.esConfirmacion ? elementosMensaje.cancelar : elementosMensaje.aceptar).focus();
}

function cerrarMensaje(aceptado) {
    if (!mensajeActivo || !mensajeActivo.listo || mensajeActivo.cerrando) return;
    mensajeActivo.cerrando = true;
    mensajeActivo.aceptado = aceptado && !mensajeActivo.descartar;
    elementosMensaje.aceptar.disabled = true;
    if (fondoRespaldo) {
        elementosMensaje.cuadro.style.display = 'none';
        elementosMensaje.cuadro.classList.remove('show');
        elementosMensaje.cuadro.setAttribute('aria-hidden', 'true');
        elementosMensaje.cuadro.removeAttribute('aria-modal');
        elementosMensaje.cuadro.removeAttribute('role');
        fondoRespaldo.remove();
        fondoRespaldo = null;
        document.body.style.overflow = overflowAnterior;
        finalizarMensaje();
    } else {
        componenteMensaje.hide();
    }
}

function finalizarMensaje() {
    const terminado = mensajeActivo;
    if (!terminado) return;
    mensajeActivo = null;
    if (terminado.esConfirmacion) confirmacionPendiente = false;
    if (terminado.origen?.isConnected) terminado.origen.focus();
    terminado.resolve(terminado.aceptado && !terminado.descartar);
    // Los mensajes concurrentes usan este mismo elemento, uno por uno.
    mostrarSiguienteMensaje();
}

// Al cerrar sesión no deben reaparecer mensajes ni acciones de la sesión anterior.
function limpiarNotificaciones() {
    colaMensajes.forEach(pendiente => pendiente.resolve(false));
    colaMensajes = [];
    confirmacionPendiente = Boolean(mensajeActivo?.esConfirmacion);
    if (mensajeActivo) {
        mensajeActivo.descartar = true;
        mensajeActivo.aceptado = false;
        cerrarMensaje(false);
    }
}

elementosMensaje.aceptar.addEventListener('click', () => cerrarMensaje(true));
elementosMensaje.cancelar.addEventListener('click', () => cerrarMensaje(false));
elementosMensaje.cerrar.addEventListener('click', () => cerrarMensaje(false));
elementosMensaje.cuadro.addEventListener('shown.bs.modal', prepararMensajeVisible);
elementosMensaje.cuadro.addEventListener('hide.bs.modal', () => {
    if (mensajeActivo) mensajeActivo.cerrando = true;
    elementosMensaje.aceptar.disabled = true;
});
elementosMensaje.cuadro.addEventListener('hidden.bs.modal', finalizarMensaje);
elementosMensaje.cuadro.addEventListener('keydown', evento => {
    // Bootstrap controla Escape y el foco; esto cubre únicamente el modo de respaldo.
    if (!fondoRespaldo) return;
    if (evento.key === 'Escape') cerrarMensaje(false);
    if (evento.key === 'Tab') {
        const botones = [elementosMensaje.cerrar, elementosMensaje.aceptar];
        const primero = botones[0], ultimo = botones[1];
        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault(); ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault(); primero.focus();
        }
    }
});
