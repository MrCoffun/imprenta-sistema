
const mongoose = require('mongoose');
const conectarMongoDB = require('../../src/mongodb');

const Cliente = require('../../src/models/Cliente');

async function iniciar() {
    try {
        await conectarMongoDB();

        const resultado = await Cliente.collection.createIndex(
            { id_cliente: 1 },
            {
                unique: true,
                name: 'id_cliente_unico'
            }
        );

        console.log('✅ Índice único creado o verificado');
        console.log('Nombre:', resultado);

        const total = await Cliente.countDocuments();

        console.log('Clientes actuales:', total);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

iniciar();
