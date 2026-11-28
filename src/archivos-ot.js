const { extname } = require('node:path');

const limiteArchivoOT = 8 * 1024 * 1024;
const rolesLecturaArchivosOT = ['cotizador', 'diseñador', 'maquinista'];
const formatoPermitido = 'Selecciona un archivo JPG, PNG o PDF válido.';
const formatos = new Map([
    ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'], ['.pdf', 'application/pdf']
]);
const firmaPNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function coincideFormato(mime, bytes) {
    if (mime === 'image/png') {
        return bytes.subarray(0, 8).equals(firmaPNG) && bytes.toString('ascii', 12, 16) === 'IHDR'
            && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND';
    }
    if (mime === 'image/jpeg') {
        return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
            && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
    }
    return /^%PDF-[12]\.\d/.test(bytes.toString('ascii', 0, 8))
        && bytes.subarray(-1024).includes('%%EOF');
}

function validarArchivoOT(nombreCodificado, contenido) {
    let nombre;
    try {
        nombre = decodeURIComponent(nombreCodificado || '').trim().normalize('NFC');
    } catch {
        return { error: 'El nombre del archivo no es válido.', estado: 400 };
    }
    if (!nombre || nombre.length > 180 || /^[.]/.test(nombre) || /[\u0000-\u001f\u007f\\/:*?"<>|]/u.test(nombre)) {
        return { error: 'El nombre del archivo no es válido.', estado: 400 };
    }
    if (!Buffer.isBuffer(contenido) || !contenido.length) {
        return { error: 'Selecciona un archivo con contenido.', estado: 400 };
    }
    if (contenido.length > limiteArchivoOT) {
        return { error: 'El archivo supera el tamaño máximo de 8 MB.', estado: 413 };
    }
    const mime = formatos.get(extname(nombre).toLowerCase());
    if (!mime || !coincideFormato(mime, contenido)) {
        return { error: formatoPermitido, estado: 415 };
    }
    return { nombre, mime, contenido };
}

function validarDatosDisenoArchivo(nombreCrudo, descripcionCruda) {
    try {
        const nombre = decodeURIComponent(nombreCrudo || '').trim();
        const descripcion = decodeURIComponent(descripcionCruda || '').trim();
        if (nombre && nombre.length <= 255 && descripcion.length <= 500) return { nombre, descripcion };
    } catch {
        // Los encabezados contienen texto codificado mediante encodeURIComponent.
    }
    return null;
}

module.exports = { limiteArchivoOT, rolesLecturaArchivosOT, validarArchivoOT, validarDatosDisenoArchivo };
