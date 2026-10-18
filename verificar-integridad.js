
const mongoose = require('mongoose');
const conectarMongoDB = require('./src/mongodb');
const sqlite = require('./src/database');

const tablas = [
    ['cliente', 'clientes', 'id_cliente'],
    ['usuario', 'usuarios', 'id_usuario'],
    ['tarifa_cotizacion', 'tarifas', 'id_tarifa'],
    ['cotizacion', 'cotizaciones', 'id_cotizacion'],
    ['orden_trabajo', 'ordenes_trabajo', 'id_ot'],
    ['diseño', 'disenos', 'id_diseño'],
    ['impresion', 'impresiones', 'id_impresion'],
    ['archivo', 'archivos', 'id_archivo'],
    ['logs_ot', 'logs_ot', 'id_logs']
];

function normalizar(valor) {
    if (valor === null || valor === undefined) return null;

    if (typeof valor === 'boolean') {
        return Number(valor);
    }

    if (typeof valor === 'number') {
        return valor;
    }

    return String(valor);
}

async function verificar() {
    let diferencias = 0;

    try {
        await conectarMongoDB();

        for (const [tabla, coleccion, clave] of tablas) {
            const registros = sqlite.prepare(
                `SELECT * FROM "${tabla}"`
            ).all();

            const mongo = mongoose.connection.db.collection(coleccion);

            for (const registro of registros) {
                const documento = await mongo.findOne({
                    [clave]: registro[clave]
                });

                if (!documento) {
                    console.log(`❌ ${tabla}: falta ID ${registro[clave]}`);
                    diferencias++;
                    continue;
                }

                for (const campo of Object.keys(registro)) {
                    const origen = normalizar(registro[campo]);
                    const destino = normalizar(documento[campo]);

                    if (origen !== destino) {
                        // No imprimir valores de campos sensibles.
                        console.log(
                            `❌ ${tabla} ID ${registro[clave]}: diferencia en ${campo}`
                        );
                        diferencias++;
                    }
                }
            }

            console.log(`✅ Revisión terminada: ${tabla}`);
        }

        // Verificar costos integrados.
        const costos = sqlite.prepare(
            'SELECT * FROM cotizacion_costos'
        ).all();

        const cotizacionesMongo =
            mongoose.connection.db.collection('cotizaciones');

        for (const costo of costos) {
            const cotizacion = await cotizacionesMongo.findOne({
                id_cotizacion: costo.id_cotizacion
            });

            if (!cotizacion || !cotizacion.costos) {
                console.log(
                    `❌ Costos faltantes: cotización ${costo.id_cotizacion}`
                );
                diferencias++;
                continue;
            }

            for (const campo of Object.keys(costo)) {
                if (campo === 'id_cotizacion') continue;

                if (
                    normalizar(costo[campo]) !==
                    normalizar(cotizacion.costos[campo])
                ) {
                    console.log(
                        `❌ Costo de cotización ${costo.id_cotizacion}: diferencia en ${campo}`
                    );
                    diferencias++;
                }
            }
        }

        console.log('\nDiferencias encontradas:', diferencias);

        if (diferencias === 0) {
            console.log('🎉 Integridad de datos verificada correctamente');
        } else {
            console.log('⚠️ Revisar las diferencias antes de continuar');
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
