const test = require('node:test');
const assert = require('node:assert/strict');
const { estadosOT, estadosHistorialOT, permiteCambiarEstadoOT } = require('../src/estados-ot');

test('CU-09: Cotizador y Administrador registran la conformidad desde revisión', () => {
    for (const rol of ['cotizador', 'administrador']) {
        assert.equal(permiteCambiarEstadoOT(rol, 'En Revisión', 'Finalizada'), true);
    }
    for (const estado of ['Pendiente', 'En Diseño', 'En Impresión', 'Entregada']) {
        assert.equal(permiteCambiarEstadoOT('cotizador', estado, 'Finalizada'), false);
    }
});

test('D04 y CU-10: la entrega requiere que la orden esté Finalizada y un rol autorizado', () => {
    for (const rol of ['cotizador', 'administrador']) {
        for (const estado of estadosOT) {
            assert.equal(permiteCambiarEstadoOT(rol, estado, 'Entregada'), estado === 'Finalizada');
        }
    }
    for (const rol of ['diseñador', 'maquinista']) {
        assert.equal(permiteCambiarEstadoOT(rol, 'Finalizada', 'Entregada'), false);
        assert.equal(permiteCambiarEstadoOT(rol, 'En Revisión', 'Finalizada'), false);
    }
});

test('la entrega es terminal y el historial conserva las órdenes conformes y entregadas', () => {
    assert.deepEqual(estadosHistorialOT, ['Finalizada', 'Finalizada conforme', 'Entregada']);
    for (const estado of estadosOT) {
        assert.equal(permiteCambiarEstadoOT('administrador', 'Entregada', estado), false);
    }
    assert.equal(permiteCambiarEstadoOT('cotizador', 'En Revisión', 'En Impresión'), true);
    assert.equal(permiteCambiarEstadoOT('cotizador', 'En Revisión', 'En Diseño'), true);
    assert.equal(permiteCambiarEstadoOT('diseñador', 'En Diseño', 'En Impresión'), true);
    assert.equal(permiteCambiarEstadoOT('maquinista', 'En Impresión', 'En Revisión'), true);
});

test('una orden histórica conforme mantiene su acceso a la entrega', () => {
    assert.equal(permiteCambiarEstadoOT('cotizador', 'Finalizada conforme', 'Entregada'), true);
    assert.equal(permiteCambiarEstadoOT('diseñador', 'Finalizada conforme', 'Entregada'), false);
    assert.equal(permiteCambiarEstadoOT('cotizador', 'Finalizada conforme', 'En Diseño'), false);
    assert.equal(estadosOT.includes('Finalizada conforme'), false);
});
