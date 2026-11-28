const test = require('node:test');
const assert = require('node:assert/strict');
const { limiteArchivoOT, rolesLecturaArchivosOT, validarArchivoOT, validarDatosDisenoArchivo } = require('../src/archivos-ot');

const pdf = Buffer.from('%PDF-1.4\n%%EOF\n');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/B0AAAAASUVORK5CYII=', 'base64');

test('reconoce el formato de los bytes y conserva el nombre y contenido', () => {
    const resultado = validarArchivoOT(encodeURIComponent('Diseño final.PDF'), pdf);
    assert.deepEqual(resultado, { nombre: 'Diseño final.PDF', mime: 'application/pdf', contenido: pdf });
    assert.equal(validarArchivoOT('referencia.png', png).mime, 'image/png');
    assert.equal(validarArchivoOT('foto.jpeg', Buffer.from([255,216,255,224,255,217])).mime, 'image/jpeg');
});

test('rechaza tipos incompatibles, contenido vacío y archivos sobre el límite', () => {
    assert.equal(validarArchivoOT('referencia.png', pdf).estado, 415);
    assert.equal(validarArchivoOT('nota.txt', Buffer.from('Nota de prueba')).estado, 415);
    assert.equal(validarArchivoOT('referencia.pdf', Buffer.alloc(0)).estado, 400);
    assert.equal(validarArchivoOT('referencia.pdf', Buffer.alloc(limiteArchivoOT + 1)).estado, 413);
    assert.equal(limiteArchivoOT, 8388608);
});

test('valida el nombre y los datos del diseño antes de guardar', () => {
    assert.equal(validarArchivoOT('archivo%2Fprueba.pdf', pdf).estado, 400);
    assert.equal(validarArchivoOT('%', pdf).estado, 400);
    assert.deepEqual(validarDatosDisenoArchivo('Dise%C3%B1o', ''), { nombre: 'Diseño', descripcion: '' });
    assert.equal(validarDatosDisenoArchivo('', ''), null);
});

test('la consulta de archivos se reserva a los roles operativos de CU-13', () => {
    assert.deepEqual(rolesLecturaArchivosOT, ['cotizador', 'diseñador', 'maquinista']);
});
