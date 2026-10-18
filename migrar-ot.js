
const mongoose = require('mongoose');
const conectarMongoDB = require('./src/mongodb');
const sqlite = require('./src/database');

const Cotizacion = require('./src/models/Cotizacion');
const OrdenTrabajo = require('./src/models/OrdenTrabajo');

async function migrar() {
    try {
        await conectarMongoDB();

        const ordenes = sqlite.prepare(`
            SELECT * FROM orden_trabajo
            ORDER BY id_ot
        `).all();

        console.log('📦 Órdenes encontradas en SQLite:', ordenes.length);

        const cotizaciones = await Cotizacion.find(
            {},
            'id_cotizacion'
        ).lean();

        const idsCotizaciones = new Set(
            cotizaciones.map(c => c.id_cotizacion)
        );

        // Validar todas las relaciones antes de escribir.
        for (const ot of ordenes) {
            if (!idsCotizaciones.has(ot.id_cotizacion)) {
                throw new Error(
                    `La OT ${ot.id_ot} referencia una cotización inexistente: ${ot.id_cotizacion}`
                );
            }
        }

        await OrdenTrabajo.init();

        let insertadas = 0;
        let actualizadas = 0;

        for (const ot of ordenes) {
            const resultado = await OrdenTrabajo.updateOne(
                { id_ot: ot.id_ot },
                { $set: ot },
                { upsert: true, runValidators: true }
            );

            if (resultado.upsertedCount > 0) {
                insertadas++;
            } else {
                actualizadas++;
            }
        }

        const totalMongo = await OrdenTrabajo.countDocuments();

        console.log('✅ OT insertadas:', insertadas);
        console.log('🔄 OT existentes procesadas:', actualizadas);
        console.log('📊 Total de OT en MongoDB:', totalMongo);

        if (totalMongo !== ordenes.length) {
            throw new Error('La cantidad de OT no coincide');
        }

        console.log('🎉 Migración de órdenes de trabajo completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;

    } finally {
        sqlite.close();
        await mongoose.disconnect();
    }
}

migrar();
