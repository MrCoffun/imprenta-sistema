// Comprobar el trabajo registrado antes de avanzar una orden.
async function comprobarRequisitosAvance({ idOT, estadoActual, estadoNuevo, Diseno, Impresion, LogOT }) {
    const requisitos = estadoActual === 'En Diseño' && estadoNuevo === 'En Impresión'
        ? { modelo: Diseno, evento: 'DISEÑO_CARGADO', nombre: 'diseño' }
        : estadoActual === 'En Impresión' && estadoNuevo === 'En Revisión'
            ? { modelo: Impresion, evento: 'IMPRESION_REGISTRADA', nombre: 'impresión' }
            : null;

    if (!requisitos) return null;

    const registro = await requisitos.modelo.exists({ id_ot: idOT });
    if (!registro) {
        return `Registra ${requisitos.nombre === 'diseño' ? 'un diseño' : 'una impresión'} en esta orden antes de continuar.`;
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
