const test = require('node:test');
const assert = require('node:assert/strict');
const { puedeConsultarHistorialOT } = require('../src/autorizacion-historial-ot');

test('D03 permite al Cotizador consultar las OT de sus propias cotizaciones', async () => {
    const usuario = { id: 10, rol: 'cotizador' };
    const cotizaciones = [
        { id_cotizacion: 71, id_usuario: 10 },
        { id_cotizacion: 72, id_usuario: 20 }
    ];
    const Cotizacion = {
        exists: async filtro => cotizaciones.find(cotizacion =>
            Object.entries(filtro).every(([campo, valor]) => cotizacion[campo] === valor))
    };

    assert.equal(await puedeConsultarHistorialOT(usuario, { id_cotizacion: 71 }, { Cotizacion }), true);
    assert.equal(await puedeConsultarHistorialOT(usuario, { id_cotizacion: 72 }, { Cotizacion }), false);
    assert.equal(await puedeConsultarHistorialOT(usuario, { id_cotizacion: 73 }, { Cotizacion }), false);
});

test('CU-12 conserva el acceso del Administrador y rechaza roles fuera del catálogo', async () => {
    const orden = { id_cotizacion: 71 };
    assert.equal(await puedeConsultarHistorialOT({ id: 10, rol: 'administrador' }, orden, {}), true);
    assert.equal(await puedeConsultarHistorialOT({ id: 10, rol: 'otro' }, orden, {}), false);
});

test('CU-12 autoriza las etapas activas correspondientes a Diseño e Impresión', async () => {
    const diseñador = { id: 10, rol: 'diseñador' };
    const maquinista = { id: 20, rol: 'maquinista' };
    const etapas = ['Pendiente', 'En Diseño', 'En Impresión', 'En Revisión'];
    for (const estado of etapas) {
        assert.equal(await puedeConsultarHistorialOT(diseñador, { estado }, {}), ['Pendiente', 'En Diseño'].includes(estado));
        assert.equal(await puedeConsultarHistorialOT(maquinista, { estado }, {}), estado === 'En Impresión');
    }
});

test('CU-12 exige que el usuario haya intervenido en esa misma OT terminada', async () => {
    const eventos = [{ id_ot: 71, id_usuario: 10 }, { id_ot: 72, id_usuario: 20 }];
    const LogOT = { exists: async filtro => eventos.find(evento =>
        evento.id_ot === filtro.id_ot && evento.id_usuario === filtro.id_usuario) };
    const diseñador = { id: 10, rol: 'diseñador' };
    const maquinista = { id: 20, rol: 'maquinista' };

    for (const estado of ['Finalizada', 'Finalizada conforme', 'Entregada']) {
        assert.equal(await puedeConsultarHistorialOT(diseñador, { id_ot: 71, estado }, { LogOT }), true);
        assert.equal(await puedeConsultarHistorialOT(diseñador, { id_ot: 72, estado }, { LogOT }), false);
        assert.equal(await puedeConsultarHistorialOT(maquinista, { id_ot: 72, estado }, { LogOT }), true);
        assert.equal(await puedeConsultarHistorialOT(maquinista, { id_ot: 71, estado }, { LogOT }), false);
    }
});
