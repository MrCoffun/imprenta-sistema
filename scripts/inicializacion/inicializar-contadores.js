
const conectarMongoDB = require('../../src/mongodb');
const mongoose = require('mongoose');

const Cliente = require('../../src/models/Cliente');
const Contador = require('../../src/models/Contador');

async function iniciar() {
    try {
        await conectarMongoDB();

        const ultimoCliente = await Cliente.findOne()
            .sort({ id_cliente: -1 })
            .select('id_cliente')
            .lean();

        const maximo = ultimoCliente?.id_cliente || 0;

        const contador = await Contador.findOneAndUpdate(
            { _id: 'cliente' },
            {
                $max: { secuencia: maximo }
            },
            {
                upsert: true,
                new: true
            }
        );

        console.log('✅ Contador de clientes preparado');
        console.log('Último ID registrado:', maximo);
        console.log('Secuencia actual:', contador.secuencia);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

iniciar();
