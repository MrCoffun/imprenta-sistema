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

    assert.equal(await puedeConsultarHistorialOT(usuario, { id_cotizacion: 71 }, Cotizacion), true);
    assert.equal(await puedeConsultarHistorialOT(usuario, { id_cotizacion: 72 }, Cotizacion), false);
    assert.equal(await puedeConsultarHistorialOT(usuario, { id_cotizacion: 73 }, Cotizacion), false);
});

test('D03 conserva el acceso del Administrador y la restricción de los otros roles', async () => {
    const orden = { id_cotizacion: 71 };
    assert.equal(await puedeConsultarHistorialOT({ id: 10, rol: 'administrador' }, orden), true);
    assert.equal(await puedeConsultarHistorialOT({ id: 10, rol: 'diseñador' }, orden), false);
    assert.equal(await puedeConsultarHistorialOT({ id: 10, rol: 'maquinista' }, orden), false);
});
