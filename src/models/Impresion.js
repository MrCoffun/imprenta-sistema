
const mongoose = require('mongoose');

const impresionSchema = new mongoose.Schema({
    id_impresion: {
        type: Number,
        required: true,
        unique: true
    },
    id_ot: {
        type: Number,
        required: true,
        index: true
    },
    id_diseño: {
        type: Number,
        required: true,
        index: true
    },
    id_usuario: {
        type: Number,
        required: true,
        index: true
    },
    codigo_maquina: {
        type: String,
        required: true
    },
    cantidad_impresa: {
        type: Number,
        required: true
    },
    fecha_impresion: {
        type: String,
        required: true
    },
    observaciones: String
}, {
    collection: 'impresiones',
    versionKey: false
});

module.exports = mongoose.model('Impresion', impresionSchema);
