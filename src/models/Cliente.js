
const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema(
    {
        id_cliente: {
            type: Number,
            required: true,
            unique: true
        },

        nombre: {
            type: String,
            required: true,
            maxlength: 150
        },

        telefono: {
            type: String,
            required: true,
            maxlength: 9
        },

        correo: {
            type: String,
            required: true,
            maxlength: 150
        }
    },
    {
        collection: 'clientes',
        versionKey: false
    }
);

module.exports = mongoose.model('Cliente', clienteSchema);
