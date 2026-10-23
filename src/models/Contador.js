
const mongoose = require('mongoose');

const contadorSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    secuencia: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    versionKey: false
});

module.exports = mongoose.model(
    'Contador',
    contadorSchema,
    'contadores'
);
