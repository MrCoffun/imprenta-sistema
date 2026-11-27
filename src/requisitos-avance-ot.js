// Una orden puede imprimirse en varias tiradas antes de pasar a revisión.
async function comprobarTirada({ idOT, idCotizacion, Cotizacion, Impresion }) {
    const [cotizacion, tiradas] = await Promise.all([
        Cotizacion.findOne({ id_cotizacion: idCotizacion }).select('cantidad -_id').lean(),
        Impresion.find({ id_ot: idOT }).select('cantidad_impresa -_id').lean()
    ]);
    if (tiradas.length === 0) {
        return 'Registra una impresión en esta orden antes de continuar.';
    }
    const solicitadas = cotizacion?.cantidad;
    if (!Number.isSafeInteger(solicitadas) || solicitadas <= 0) {
        return 'No se pudo comprobar la cantidad solicitada en la cotización de esta orden.';
    }

    let impresas = 0;
    for (const { cantidad_impresa } of tiradas) {
        if (!Number.isSafeInteger(cantidad_impresa) || cantidad_impresa <= 0) {
            return 'Revisa las cantidades de los registros de impresión de esta orden antes de continuar.';
        }
        impresas += cantidad_impresa;
    }
    if (impresas < solicitadas) {
        return `Impresión incompleta: se registraron ${impresas} de ${solicitadas} unidades. Faltan ${solicitadas - impresas} para enviar la orden a revisión.`;
    }
    return null;
}

// Comprobar el trabajo registrado antes de avanzar una orden.
async function comprobarRequisitosAvance({ idOT, idCotizacion, estadoActual, estadoNuevo, Diseno, Impresion, Cotizacion, LogOT }) {
    const requisitos = estadoActual === 'En Diseño' && estadoNuevo === 'En Impresión'
        ? { evento: 'DISEÑO_CARGADO', nombre: 'diseño' }
        : estadoActual === 'En Impresión' && estadoNuevo === 'En Revisión'
            ? { evento: 'IMPRESION_REGISTRADA', nombre: 'impresión' }
            : null;

    if (!requisitos) return null;

    if (estadoActual === 'En Impresión') {
        const problema = await comprobarTirada({ idOT, idCotizacion, Cotizacion, Impresion });
        if (problema) return problema;
    } else if (!await Diseno.exists({ id_ot: idOT })) {
        return 'Registra un diseño en esta orden antes de continuar.';
    }

    // Si la orden volvió para corregirse, el trabajo debe registrarse de nuevo.
    const devolucion = await LogOT.findOne({
        id_ot: idOT,
        tipo_evento: 'ESTADO_CAMBIADO',
        estado_anterior: 'En Revisión',
        // Si volvió a Diseño, también debe registrarse una nueva impresión.
        estado_nuevo: estadoActual === 'En Impresión'
            ? { $in: ['En Diseño', 'En Impresión'] }
            : estadoActual
    }).sort({ id_logs: -1 }).lean();

    if (devolucion) {
        let ultimoPaso = devolucion.id_logs;

        // Una corrección de diseño debe llegar a Impresión antes de imprimirse.
        if (estadoActual === 'En Impresión' && devolucion.estado_nuevo === 'En Diseño') {
            const entradaImpresion = await LogOT.findOne({
                id_ot: idOT,
                tipo_evento: 'ESTADO_CAMBIADO',
                estado_anterior: 'En Diseño',
                estado_nuevo: 'En Impresión',
                id_logs: { $gt: devolucion.id_logs }
            }).sort({ id_logs: -1 }).lean();
            if (!entradaImpresion) {
                return 'No se pudo comprobar el paso de Diseño a Impresión en el historial de esta orden.';
            }
            ultimoPaso = entradaImpresion.id_logs;
        }

        const correccion = await LogOT.exists({
            id_ot: idOT,
            tipo_evento: requisitos.evento,
            id_logs: { $gt: ultimoPaso }
        });
        if (!correccion) {
            return `La orden fue devuelta. Registra la corrección de ${requisitos.nombre} antes de continuar.`;
        }
    }

    return null;
}

module.exports = comprobarRequisitosAvance;
