
require('dotenv').config();

const mongoose = require('mongoose');

async function verificar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;

        const contadores = await db
            .collection('contadores')
            .find({})
            .toArray();

        console.log('\nCONTADORES ACTUALES:');
        console.table(contadores);

        const ultimaCotizacion = await db
            .collection('cotizaciones')
            .find({})
            .sort({ id_cotizacion: -1 })
            .limit(1)
            .toArray();

        console.log(
            '\nÚLTIMA COTIZACIÓN:',
            ultimaCotizacion[0]?.id_cotizacion
        );

        const cotizacionesConCostos = await db
            .collection('cotizaciones')
            .find({ 'costos.id_costo': { $exists: true } })
            .toArray();

        const mayorIdCosto = Math.max(
            0,
            ...cotizacionesConCostos.map(
                c => Number(c.costos.id_costo) || 0
            )
        );

        console.log('MAYOR ID DE COSTO:', mayorIdCosto);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verificar();
