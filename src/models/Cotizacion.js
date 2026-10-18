
const mongoose = require('mongoose');

const costosSchema = new mongoose.Schema({
    id_costo: Number,
    id_tarifa: { type: Number, required: true },
    cantidad_millares: { type: Number, required: true },
    costo_produccion: { type: Number, required: true },
    mano_obra_diseño: { type: Number, required: true },
    total: { type: Number, required: true },
    estado_evaluacion: String,
    fecha_creacion: String,
    fecha_actualizacion: String
}, { _id: false });

const cotizacionSchema = new mongoose.Schema({
    id_cotizacion: {
        type: Number,
        required: true,
        unique: true
    },
    codigo_cotizacion: {
        type: String,
        required: true,
        unique: true
    },
    id_cliente: { type: Number, required: true },
    id_usuario: { type: Number, required: true },

    tipo_producto: { type: String, required: true },
    tamaño: { type: String, required: true },
    material: { type: String, required: true },
    impresion: { type: String, required: true },
    color: { type: String, required: true },
    acabado: String,
    sangrado: String,
    cantidad: { type: Number, required: true },

    fecha_requerida: { type: String, required: true },
    hora_requerida: { type: String, required: true },
    observaciones: String,
    estado: { type: String, required: true },
    fecha_creacion: String,
    fecha_actualizacion: String,

    costos: {
        type: costosSchema,
        default: undefined
    }
}, {
    collection: 'cotizaciones',
    versionKey: false
});

module.exports = mongoose.model('Cotizacion', cotizacionSchema);
