
require('dotenv').config();

const mongoose = require('mongoose');

async function diagnosticar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;

        console.log('✅ Conectado a:', db.databaseName);

        const colecciones = await db.listCollections().toArray();

        console.log(
            '\n📁 Colecciones:',
            colecciones.map(c => c.name)
        );

        const cotizaciones = await db
            .collection('cotizaciones')
            .find({})
            .toArray();

        console.log(
            '\n📊 Total de cotizaciones:',
            cotizaciones.length
        );

        const conCostos = cotizaciones.filter(c =>
            c.costos &&
            typeof c.costos === 'object' &&
            !Array.isArray(c.costos)
        );

        const totalCostos = conCostos.length;

        console.log(
            'Cotizaciones con costos:',
            conCostos.length
        );

        console.log(
            'Total de costos incrustados:',
            totalCostos
        );

        console.log('\n🔎 Primera cotización:');
        console.log(
            JSON.stringify(cotizaciones[0], null, 2)
        );

        console.log('\n📋 Últimas cotizaciones con costos:');

            console.table(
                conCostos
                    .sort((a, b) => b.id_cotizacion - a.id_cotizacion)
                    .map(c => ({
                        id_cotizacion: c.id_cotizacion,
                        codigo: c.codigo_cotizacion,
                        cliente: c.id_cliente,
                        tarifa: c.costos.id_tarifa,
                        total: c.costos.total,
                        estado: c.estado
                    }))
            );

        console.log('\n💰 Ejemplo con costos:');
        console.log(
            JSON.stringify(conCostos[0] || null, null, 2)
        );

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

diagnosticar();
