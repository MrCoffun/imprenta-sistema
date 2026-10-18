
const mongoose = require('mongoose');
const conectarMongoDB = require('./src/mongodb');
const sqlite = require('./src/database');

const OrdenTrabajo = require('./src/models/OrdenTrabajo');
const Usuario = require('./src/models/Usuario');
const Diseno = require('./src/models/Diseno');
const Impresion = require('./src/models/Impresion');

async function migrar() {
    try {
        await conectarMongoDB();

        const disenos = sqlite.prepare(
            'SELECT * FROM "diseño" ORDER BY "id_diseño"'
        ).all();

        const impresiones = sqlite.prepare(
            'SELECT * FROM impresion ORDER BY id_impresion'
        ).all();

        const ordenesMongo = await OrdenTrabajo.find(
            {}, 'id_ot'
        ).lean();

        const usuariosMongo = await Usuario.find(
            {}, 'id_usuario'
        ).lean();

        const idsOT = new Set(ordenesMongo.map(o => o.id_ot));
        const idsUsuarios = new Set(
            usuariosMongo.map(u => u.id_usuario)
        );
        const idsDisenos = new Set(disenos.map(d => d.id_diseño));

        // Validar diseños.
        for (const d of disenos) {
            if (!idsOT.has(d.id_ot)) {
                throw new Error(
                    `Diseño ${d.id_diseño}: OT ${d.id_ot} inexistente`
                );
            }
        }

        // Validar impresiones.
        for (const i of impresiones) {
            if (!idsOT.has(i.id_ot)) {
                throw new Error(
                    `Impresión ${i.id_impresion}: OT inexistente`
                );
            }

            if (!idsDisenos.has(i.id_diseño)) {
                throw new Error(
                    `Impresión ${i.id_impresion}: diseño inexistente`
                );
            }

            if (!idsUsuarios.has(i.id_usuario)) {
                throw new Error(
                    `Impresión ${i.id_impresion}: usuario inexistente`
                );
            }

            const diseno = disenos.find(
                d => d.id_diseño === i.id_diseño
            );

            if (diseno.id_ot !== i.id_ot) {
                throw new Error(
                    `Impresión ${i.id_impresion}: el diseño pertenece a otra OT`
                );
            }
        }

        await Diseno.init();
        await Impresion.init();

        for (const d of disenos) {
            await Diseno.updateOne(
                { id_diseño: d.id_diseño },
                { $set: d },
                { upsert: true, runValidators: true }
            );
        }

        for (const i of impresiones) {
            await Impresion.updateOne(
                { id_impresion: i.id_impresion },
                { $set: i },
                { upsert: true, runValidators: true }
            );
        }

        const totalDisenos = await Diseno.countDocuments();
        const totalImpresiones = await Impresion.countDocuments();

        console.log('Diseños SQLite:', disenos.length);
        console.log('Diseños MongoDB:', totalDisenos);
        console.log('Impresiones SQLite:', impresiones.length);
        console.log('Impresiones MongoDB:', totalImpresiones);

        if (
            totalDisenos !== disenos.length ||
            totalImpresiones !== impresiones.length
        ) {
            throw new Error('Las cantidades no coinciden');
        }

        console.log('✅ Diseños e impresiones migrados correctamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;

    } finally {
        sqlite.close();
        await mongoose.disconnect();
    }
}

migrar();
