
const mongoose = require('mongoose');
const conectarMongoDB = require('../../src/mongodb');
const Cliente = require('../../src/models/Cliente');

async function probarModelo() {
    try {
        await conectarMongoDB();

        const total = await Cliente.countDocuments();

        console.log('✅ Modelo Cliente cargado correctamente');
        console.log('📊 Clientes actuales en MongoDB:', total);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

probarModelo();
