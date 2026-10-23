
const mongoose = require('mongoose');
const conectarMongoDB = require('../../src/mongodb');
const Cliente = require('../../src/models/Cliente');
const sqlite = require('../../legacy/sqlite/database');

async function migrarClientes() {
    try {
        await conectarMongoDB();

        // Leer los clientes originales desde SQLite.
        const clientesSQLite = sqlite.prepare(`
            SELECT id_cliente, nombre, telefono, correo
            FROM cliente
            ORDER BY id_cliente
        `).all();

        console.log('ðŸ“¦ Clientes encontrados en SQLite:', clientesSQLite.length);

        let insertados = 0;
        let existentes = 0;

        for (const cliente of clientesSQLite) {
            // Actualiza por ID si ya existe; inserta si no existe.
            const resultado = await Cliente.updateOne(
                { id_cliente: cliente.id_cliente },
                {
                    $set: {
                        nombre: cliente.nombre,
                        telefono: cliente.telefono,
                        correo: cliente.correo
                    },
                    $setOnInsert: {
                        id_cliente: cliente.id_cliente
                    }
                },
                { upsert: true }
            );

            if (resultado.upsertedCount > 0) {
                insertados++;
            } else {
                existentes++;
            }
        }

        const totalMongoDB = await Cliente.countDocuments();

        console.log('âœ… Clientes insertados:', insertados);
        console.log('ðŸ”„ Clientes ya existentes:', existentes);
        console.log('ðŸ“Š Total en MongoDB:', totalMongoDB);

        if (totalMongoDB === clientesSQLite.length) {
            console.log('ðŸŽ‰ Cantidad de clientes verificada correctamente');
        } else {
            console.warn('âš ï¸ Las cantidades no coinciden. Revisar antes de continuar.');
        }

    } catch (error) {
        console.error('âŒ Error durante la migraciÃ³n:', error);
        process.exitCode = 1;

    } finally {
        sqlite.close();
        await mongoose.disconnect();
    }
}

migrarClientes();
