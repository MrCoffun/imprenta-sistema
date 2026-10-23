
const mongoose = require('mongoose');
const conectarMongoDB = require('../../src/mongodb');
const sqlite = require('../../legacy/sqlite/database');

const Archivo = require('../../src/models/Archivo');
const LogOT = require('../../src/models/LogOT');
const OrdenTrabajo = require('../../src/models/OrdenTrabajo');
const Cotizacion = require('../../src/models/Cotizacion');
const Usuario = require('../../src/models/Usuario');

async function migrar() {
    try {
        await conectarMongoDB();

        const archivos = sqlite.prepare(
            'SELECT * FROM archivo ORDER BY id_archivo'
        ).all();

        const logs = sqlite.prepare(
            'SELECT * FROM logs_ot ORDER BY id_logs'
        ).all();

        const [ordenes, cotizaciones, usuarios] =
            await Promise.all([
                OrdenTrabajo.find({}, 'id_ot id_cotizacion').lean(),
                Cotizacion.find({}, 'id_cotizacion').lean(),
                Usuario.find({}, 'id_usuario').lean()
            ]);

        const otsPorId = new Map(
            ordenes.map(o => [o.id_ot, o])
        );

        const idsCotizaciones = new Set(
            cotizaciones.map(c => c.id_cotizacion)
        );

        const idsUsuarios = new Set(
            usuarios.map(u => u.id_usuario)
        );

        // Validar archivos antes de insertarlos.
        for (const a of archivos) {
            const ot = otsPorId.get(a.id_ot);

            if (!ot) {
                throw new Error(
                    `Archivo ${a.id_archivo}: OT inexistente`
                );
            }

            if (!idsCotizaciones.has(a.id_cotizacion)) {
                throw new Error(
                    `Archivo ${a.id_archivo}: cotizaciÃ³n inexistente`
                );
            }

            if (ot.id_cotizacion !== a.id_cotizacion) {
                throw new Error(
                    `Archivo ${a.id_archivo}: cotizaciÃ³n distinta a la de su OT`
                );
            }

            if (!idsUsuarios.has(a.id_usuario)) {
                throw new Error(
                    `Archivo ${a.id_archivo}: usuario inexistente`
                );
            }
        }

        // Validar logs antes de insertarlos.
        for (const log of logs) {
            if (!otsPorId.has(log.id_ot)) {
                throw new Error(
                    `Log ${log.id_logs}: OT inexistente`
                );
            }

            if (!idsUsuarios.has(log.id_usuario)) {
                throw new Error(
                    `Log ${log.id_logs}: usuario inexistente`
                );
            }
        }

        await Archivo.init();
        await LogOT.init();

        for (const a of archivos) {
            await Archivo.updateOne(
                { id_archivo: a.id_archivo },
                { $set: a },
                { upsert: true, runValidators: true }
            );
        }

        for (const log of logs) {
            await LogOT.updateOne(
                { id_logs: log.id_logs },
                { $set: log },
                { upsert: true, runValidators: true }
            );
        }

        const totalArchivos = await Archivo.countDocuments();
        const totalLogs = await LogOT.countDocuments();

        console.log('Archivos SQLite:', archivos.length);
        console.log('Archivos MongoDB:', totalArchivos);
        console.log('Logs SQLite:', logs.length);
        console.log('Logs MongoDB:', totalLogs);

        if (
            totalArchivos !== archivos.length ||
            totalLogs !== logs.length
        ) {
            throw new Error('Las cantidades no coinciden');
        }

        console.log('ðŸŽ‰ MigraciÃ³n de archivos y logs completada');

    } catch (error) {
        console.error('âŒ Error:', error.message);
        process.exitCode = 1;

    } finally {
        sqlite.close();
        await mongoose.disconnect();
    }
}

migrar();
