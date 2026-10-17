
const mongoose = require('mongoose');

const tarifaSchema = new mongoose.Schema({
    id_tarifa: {
        type: Number,
        required: true,
        unique: true
    },
    tipo_producto: {
        type: String,
        required: true
    },
    tamaño: {
        type: String,
        required: true
    },
    material: {
        type: String,
        required: true
    },
    tipo_impresion: {
        type: String,
        required: true
    },
    caras: {
        type: String,
        required: true
    },
    precio_millar: {
        type: Number,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    collection: 'tarifas',
    versionKey: false
});

module.exports = mongoose.model('Tarifa', tarifaSchema);
