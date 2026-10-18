
const mongoose = require('mongoose');

const archivoSchema = new mongoose.Schema({
    id_archivo: {
        type: Number,
        required: true,
        unique: true
    },
    id_ot: {
        type: Number,
        required: true,
        index: true
    },
    id_cotizacion: {
        type: Number,
        required: true
    },
    nombre_archivo: {
        type: String,
        required: true
    },
    ruta: {
        type: String,
        required: true
    },
    fecha_carga: {
        type: String,
        required: true
    },
    id_usuario: {
        type: Number,
        required: true
    }
}, {
    collection: 'archivos',
    versionKey: false
});

module.exports = mongoose.model('Archivo', archivoSchema);
