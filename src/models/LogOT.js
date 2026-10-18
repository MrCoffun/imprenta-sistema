
const mongoose = require('mongoose');

const logOTSchema = new mongoose.Schema({
    id_logs: {
        type: Number,
        required: true,
        unique: true
    },
    id_ot: {
        type: Number,
        required: true,
        index: true
    },
    id_usuario: {
        type: Number,
        required: true,
        index: true
    },
    tipo_evento: {
        type: String,
        required: true
    },
    fecha_hora: {
        type: String,
        required: true
    },
    estado_anterior: String,
    estado_nuevo: String,
    detalle_evento: String
}, {
    collection: 'logs_ot',
    versionKey: false
});

module.exports = mongoose.model('LogOT', logOTSchema);
