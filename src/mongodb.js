require('dotenv').config();

const mongoose = require('mongoose');

async function conectarMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('✅ MongoDB conectado correctamente');
        console.log('📁 Base de datos:', mongoose.connection.name);

    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        throw error;
    }
}

module.exports = conectarMongoDB;