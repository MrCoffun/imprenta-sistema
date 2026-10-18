
const mongoose = require('mongoose');
const conectarMongoDB = require('./src/mongodb');
const sqlite = require('./src/database');

const equivalencias = [
    ['cliente', 'clientes'],
    ['usuario', 'usuarios'],
    ['tarifa_cotizacion', 'tarifas'],
    ['cotizacion', 'cotizaciones'],
    ['orden_trabajo', 'ordenes_trabajo'],
    ['diseño', 'disenos'],
    ['impresion', 'impresiones'],
    ['archivo', 'archivos'],
    ['logs_ot', 'logs_ot']
];

async function verificar() {
    try {
        await conectarMongoDB();

        let correcto = true;

        console.log('\nVERIFICACIÓN GENERAL\n');

        for (const [tabla, coleccion] of equivalencias) {
            const origen = sqlite.prepare(
                `SELECT COUNT(*) AS total FROM "${tabla}"`
            ).get().total;

            const destino = await mongoose.connection.db
                .collection(coleccion)
                .countDocuments();

            const coincide = origen === destino;

            console.log(
                `${coincide ? '✅' : '❌'} ${tabla}: SQLite=${origen}, MongoDB=${destino}`
            );

            if (!coincide) correcto = false;
        }

        const costosSQLite = sqlite.prepare(
            'SELECT COUNT(*) AS total FROM cotizacion_costos'
        ).get().total;

        const costosMongo = await mongoose.connection.db
            .collection('cotizaciones')
            .countDocuments({ costos: { $exists: true } });

        console.log(
            `${costosSQLite === costosMongo ? '✅' : '❌'} Costos: SQLite=${costosSQLite}, MongoDB=${costosMongo}`
        );

        if (costosSQLite !== costosMongo) correcto = false;

        if (correcto) {
            console.log('\n🎉 Todas las cantidades coinciden');
        } else {
            console.log('\n⚠️ Se encontraron diferencias');
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;

    } finally {
        sqlite.close();
        await mongoose.disconnect();
    }
}

verificar();
