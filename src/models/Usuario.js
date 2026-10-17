
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    id_usuario: {
        type: Number,
        required: true,
        unique: true
    },
    nombres: {
        type: String,
        required: true
    },
    apellidos: {
        type: String,
        required: true
    },
    usuario: {
        type: String,
        required: true,
        unique: true
    },
    contraseña: {
        type: String,
        required: true,
        select: false
    },
    rol: {
        type: String,
        required: true
    },
    estado: {
        type: Boolean,
        default: true
    }
}, {
    collection: 'usuarios',
    versionKey: false
});

module.exports = mongoose.model('Usuario', usuarioSchema);
