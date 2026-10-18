
const mongoose = require('mongoose');
const conectarMongoDB = require('./src/mongodb');
const sqlite = require('./src/database');

const Cliente = require('./src/models/Cliente');
const Usuario = require('./src/models/Usuario');
const Tarifa = require('./src/models/Tarifa');
const Cotizacion = require('./src/models/Cotizacion');

async function migrar() {
    try {
        await conectarMongoDB();

        const cotizaciones = sqlite.prepare(
            'SELECT * FROM cotizacion ORDER BY id_cotizacion'
        ).all();

        const costos = sqlite.prepare(
            'SELECT * FROM cotizacion_costos'
        ).all();

        const costosPorCotizacion = new Map(
            costos.map(c => [c.id_cotizacion, c])
        );

        // Comprobar que las referencias originales existen.
        const idsClientes = new Set(
            (await Cliente.find({}, 'id_cliente').lean())
                .map(c => c.id_cliente)
        );

        const idsUsuarios = new Set(
            (await Usuario.find({}, 'id_usuario').lean())
                .map(u => u.id_usuario)
        );

        const idsTarifas = new Set(
            (await Tarifa.find({}, 'id_tarifa').lean())
                .map(t => t.id_tarifa)
        );

        for (const c of cotizaciones) {
            if (!idsClientes.has(c.id_cliente)) {
                throw new Error(
                    `Cliente inexistente: cotización ${c.id_cotizacion}`
                );
            }

            if (!idsUsuarios.has(c.id_usuario)) {
                throw new Error(
                    `Usuario inexistente: cotización ${c.id_cotizacion}`
                );
            }
        }

        for (const costo of costos) {
            if (!idsTarifas.has(costo.id_tarifa)) {
                throw new Error(
                    `Tarifa inexistente: costo ${costo.id_costo}`
                );
            }

            if (!cotizaciones.some(
                c => c.id_cotizacion === costo.id_cotizacion
            )) {
                throw new Error(
                    `Cotización inexistente: costo ${costo.id_costo}`
                );
            }
        }

        await Cotizacion.init();

        for (const c of cotizaciones) {
            const costo = costosPorCotizacion.get(c.id_cotizacion);

            const documento = {
                ...c,
                costos: costo ? {
                    id_costo: costo.id_costo,
                    id_tarifa: costo.id_tarifa,
                    cantidad_millares: costo.cantidad_millares,
                    costo_produccion: costo.costo_produccion,
                    mano_obra_diseño: costo.mano_obra_diseño,
                    total: costo.total,
                    estado_evaluacion: costo.estado_evaluacion,
                    fecha_creacion: costo.fecha_creacion,
                    fecha_actualizacion: costo.fecha_actualizacion
                } : undefined
            };

            await Cotizacion.updateOne(
                { id_cotizacion: c.id_cotizacion },
                { $set: documento },
                { upsert: true, runValidators: true }
            );
        }

        const total = await Cotizacion.countDocuments();
        const conCostos = await Cotizacion.countDocuments({
            costos: { $exists: true }
        });

        console.log('Cotizaciones SQLite:', cotizaciones.length);
        console.log('Costos SQLite:', costos.length);
        console.log('Cotizaciones MongoDB:', total);
        console.log('Cotizaciones con costos:', conCostos);

        if (
            total !== cotizaciones.length ||
            conCostos !== costos.length
        ) {
            throw new Error('Las cantidades no coinciden');
        }

        console.log('✅ Migración de cotizaciones completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;

    } finally {
        sqlite.close();
        await mongoose.disconnect();
    }
}

migrar();
