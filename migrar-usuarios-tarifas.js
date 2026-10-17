
const mongoose = require('mongoose');
const conectarMongoDB = require('./src/mongodb');
const sqlite = require('./src/database');

const Usuario = require('./src/models/Usuario');
const Tarifa = require('./src/models/Tarifa');

async function migrar() {
    try {
        await conectarMongoDB();

        const usuarios = sqlite.prepare(`
            SELECT * FROM usuario
        `).all();

        const tarifas = sqlite.prepare(`
            SELECT * FROM tarifa_cotizacion
        `).all();

        console.log('Usuarios en SQLite:', usuarios.length);
        console.log('Tarifas en SQLite:', tarifas.length);

        // Asegurar índices únicos antes de insertar.
        await Usuario.init();
        await Tarifa.init();

        for (const u of usuarios) {
            await Usuario.updateOne(
                { id_usuario: u.id_usuario },
                {
                    $set: {
                        nombres: u.nombres,
                        apellidos: u.apellidos,
                        usuario: u.usuario,
                        contraseña: u.contraseña,
                        rol: u.rol,
                        estado: Boolean(u.estado)
                    },
                    $setOnInsert: {
                        id_usuario: u.id_usuario
                    }
                },
                { upsert: true }
            );
        }

        for (const t of tarifas) {
            await Tarifa.updateOne(
                { id_tarifa: t.id_tarifa },
                {
                    $set: {
                        tipo_producto: t.tipo_producto,
                        tamaño: t.tamaño,
                        material: t.material,
                        tipo_impresion: t.tipo_impresion,
                        caras: t.caras,
                        precio_millar: Number(t.precio_millar),
                        activo: Boolean(t.activo)
                    },
                    $setOnInsert: {
                        id_tarifa: t.id_tarifa
                    }
                },
                { upsert: true }
            );
        }

        const totalUsuarios = await Usuario.countDocuments();
        const totalTarifas = await Tarifa.countDocuments();

        console.log('Usuarios MongoDB:', totalUsuarios);
        console.log('Tarifas MongoDB:', totalTarifas);

        if (
            totalUsuarios === usuarios.length &&
            totalTarifas === tarifas.length
        ) {
            console.log('✅ Migración completada correctamente');
        } else {
            console.log('⚠️ Las cantidades no coinciden');
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

migrar();
