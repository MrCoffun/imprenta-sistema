const conectarMongoDB = require('./src/mongodb');
const mongoose = require('mongoose');

async function probarConexion() {
    try {
        await conectarMongoDB();

        const resultado = await mongoose.connection.db.admin().ping();

        console.log('✅ Ping exitoso:', resultado);
        console.log('🎉 MongoDB está listo para la migración');

    } catch (error) {
        console.error('❌ Falló la prueba:', error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

probarConexion();