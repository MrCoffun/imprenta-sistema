
const mongoose = require('mongoose');

const disenoSchema = new mongoose.Schema({
    id_diseño: {
        type: Number,
        required: true,
        unique: true
    },
    id_ot: {
        type: Number,
        required: true,
        index: true
    },
    nombre_diseño: {
        type: String,
        required: true
    },
    descripcion: String,
    archivo_diseño: {
        type: String,
        required: true
    },
    fecha_carga: {
        type: String,
        required: true
    }
}, {
    collection: 'disenos',
    versionKey: false
});

module.exports = mongoose.model('Diseno', disenoSchema);
