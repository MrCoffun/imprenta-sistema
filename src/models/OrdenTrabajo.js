
const mongoose = require('mongoose');

const ordenTrabajoSchema = new mongoose.Schema({
    id_ot: {
        type: Number,
        required: true,
        unique: true
    },
    codigo_ot: {
        type: String,
        required: true,
        unique: true
    },
    id_cotizacion: {
        type: Number,
        required: true,
        unique: true
    },
    estado: {
        type: String,
        required: true
    },
    prioridad: {
        type: String,
        required: true
    },
    fecha_requerida: {
        type: String,
        required: true
    },
    hora_requerida: {
        type: String,
        required: true
    },
    fecha_creacion: {
        type: String,
        required: true
    },
    fecha_actualizacion: {
        type: String,
        required: true
    }
}, {
    collection: 'ordenes_trabajo',
    versionKey: false
});

module.exports = mongoose.model('OrdenTrabajo', ordenTrabajoSchema);
