const test = require('node:test');
const assert = require('node:assert/strict');
const comprobar = require('../src/requisitos-avance-ot');

function modelos(registros, historial) {
    const existe = tipo => ({ exists: async ({ id_ot }) => registros.some(r => r.tipo === tipo && r.id_ot === id_ot) });
    const coincide = (log, filtro) => Object.entries(filtro).every(([campo, valor]) =>
        campo === 'id_logs' ? log.id_logs > valor.$gt
            : valor && typeof valor === 'object' && valor.$in ? valor.$in.includes(log[campo])
                : log[campo] === valor);
    return {
        Diseno: existe('diseño'),
        Impresion: existe('impresión'),
        LogOT: {
            findOne: filtro => ({ sort: () => ({ lean: async () =>
                historial.filter(log => coincide(log, filtro)).sort((a, b) => b.id_logs - a.id_logs)[0] || null }) }),
            exists: async filtro => historial.some(log => coincide(log, filtro))
        }
    };
}

async function revisar(actual, siguiente, registros = [], historial = []) {
    return comprobar({ idOT: 7, estadoActual: actual, estadoNuevo: siguiente, ...modelos(registros, historial) });
}

for (const [etapa, siguiente, tipo, evento] of [
    ['En Diseño', 'En Impresión', 'diseño', 'DISEÑO_CARGADO'],
    ['En Impresión', 'En Revisión', 'impresión', 'IMPRESION_REGISTRADA']
]) {
    test(`${tipo}: requiere un registro de la misma orden`, async () => {
        assert.match(await revisar(etapa, siguiente), /Registra/);
        assert.match(await revisar(etapa, siguiente, [{ tipo, id_ot: 8 }]), /Registra/);
        assert.equal(await revisar(etapa, siguiente, [{ tipo, id_ot: 7 }]), null);
    });

    test(`${tipo}: exige una corrección posterior a la última devolución`, async () => {
        const registros = [{ tipo, id_ot: 7 }];
        const devolucion = { id_ot: 7, id_logs: 10, tipo_evento: 'ESTADO_CAMBIADO', estado_anterior: 'En Revisión', estado_nuevo: etapa };
        const anterior = { id_ot: 7, id_logs: 9, tipo_evento: evento };
        const posterior = { id_ot: 7, id_logs: 11, tipo_evento: evento };
        assert.match(await revisar(etapa, siguiente, registros, [anterior, devolucion]), /devuelta/);
        assert.equal(await revisar(etapa, siguiente, registros, [anterior, devolucion, posterior]), null);
        assert.match(await revisar(etapa, siguiente, registros, [anterior, devolucion, { ...posterior, id_ot: 8 }]), /devuelta/);
        assert.match(await revisar(etapa, siguiente, registros, [devolucion, posterior, { ...devolucion, id_logs: 12 }]), /devuelta/);
    });
}

test('las demás transiciones no requieren estos registros', async () => {
    assert.equal(await revisar('Pendiente', 'En Diseño'), null);
    assert.equal(await revisar('En Revisión', 'Finalizada'), null);
    assert.equal(await revisar('En Revisión', 'En Diseño'), null);
    assert.equal(await revisar('En Revisión', 'En Impresión'), null);
});

test('si la orden vuelve a Diseño, también exige una nueva impresión', async () => {
    const registros = [{ tipo: 'impresión', id_ot: 7 }];
    const historial = [
        { id_ot: 7, id_logs: 4, tipo_evento: 'IMPRESION_REGISTRADA' },
        { id_ot: 7, id_logs: 5, tipo_evento: 'ESTADO_CAMBIADO', estado_anterior: 'En Revisión', estado_nuevo: 'En Diseño' },
        { id_ot: 7, id_logs: 7, tipo_evento: 'ESTADO_CAMBIADO', estado_anterior: 'En Diseño', estado_nuevo: 'En Impresión' }
    ];
    assert.match(await revisar('En Impresión', 'En Revisión', registros, historial), /devuelta/);
    historial.push({ id_ot: 7, id_logs: 6, tipo_evento: 'IMPRESION_REGISTRADA' });
    assert.match(await revisar('En Impresión', 'En Revisión', registros, historial), /devuelta/);
    historial.push({ id_ot: 7, id_logs: 8, tipo_evento: 'IMPRESION_REGISTRADA' });
    assert.equal(await revisar('En Impresión', 'En Revisión', registros, historial), null);
});
