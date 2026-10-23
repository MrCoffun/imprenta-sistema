
require('dotenv').config();

const mongoose = require('mongoose');

async function iniciar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;
        const contadores = db.collection('contadores');

        const ultimaCotizacion = await db
            .collection('cotizaciones')
            .find({})
            .sort({ id_cotizacion: -1 })
            .limit(1)
            .next();

        const mayorIdCotizacion =
            ultimaCotizacion?.id_cotizacion || 0;

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

        await contadores.updateOne(
            { _id: 'cotizacion' },
            { $setOnInsert: { secuencia: mayorIdCotizacion } },
            { upsert: true }
        );

        await contadores.updateOne(
            { _id: 'cotizacion_costo' },
            { $setOnInsert: { secuencia: mayorIdCosto } },
            { upsert: true }
        );

        console.log('Contadores inicializados:');

        console.table(
            await contadores.find({}).toArray()
        );

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

iniciar();
