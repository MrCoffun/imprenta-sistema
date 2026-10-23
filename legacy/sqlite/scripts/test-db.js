const Database = require('better-sqlite3');

const db = new Database('./database/imprenta.db');

db.pragma('foreign_keys = ON');

console.log('========================================');
console.log('PASO 18 - INSERCIONES VÁLIDAS Y RELACIONES');
console.log('========================================\n');

try {

    // ========================================
    // 1. VERIFICAR OT-0001
    // ========================================

    const ot = db.prepare(`
        SELECT *
        FROM orden_trabajo
        WHERE id_ot = ?
    `).get(1);

    if (!ot) {
        throw new Error('No existe OT-0001.');
    }

    console.log('1. OT encontrada correctamente.');
    console.log('   Código:', ot.codigo_ot);
    console.log('   Estado:', ot.estado);
    console.log('   Prioridad:', ot.prioridad);


    // ========================================
    // 2. CREAR DISEÑO
    // ========================================

    console.log('\n2. Creando diseño relacionado con OT-0001...');

    const diseñoExistente = db.prepare(`
        SELECT *
        FROM diseño
        WHERE id_ot = ?
    `).get(1);

    let idDiseño;

    if (diseñoExistente) {

        idDiseño = diseñoExistente.id_diseño;

        console.log('   ℹ️ Ya existe un diseño para OT-0001.');
        console.log('   ID diseño:', idDiseño);

    } else {

        const resultadoDiseño = db.prepare(`
            INSERT INTO diseño (
                id_ot,
                nombre_diseño,
                descripcion,
                archivo_diseño
            )
            VALUES (?, ?, ?, ?)
        `).run(
            1,
            'Diseño volante A5',
            'Diseño de prueba para OT-0001',
            'volante-prueba.pdf'
        );

        idDiseño = resultadoDiseño.lastInsertRowid;

        console.log('   ✅ Diseño creado correctamente.');
        console.log('   ID diseño:', idDiseño);
    }


    // ========================================
    // 3. CREAR ARCHIVO
    // ========================================

    console.log('\n3. Creando archivo relacionado con OT-0001...');

    const archivoExistente = db.prepare(`
        SELECT *
        FROM archivo
        WHERE id_ot = ?
    `).get(1);

    if (archivoExistente) {

        console.log('   ℹ️ Ya existe un archivo para OT-0001.');
        console.log('   ID archivo:', archivoExistente.id_archivo);

    } else {

        const resultadoArchivo = db.prepare(`
            INSERT INTO archivo (
                id_ot,
                id_cotizacion,
                nombre_archivo,
                ruta,
                id_usuario
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            1,
            1,
            'volantes.pdf',
            '/archivos/volantes.pdf',
            1
        );

        console.log('   ✅ Archivo creado correctamente.');
        console.log('   ID archivo:', resultadoArchivo.lastInsertRowid);
    }


    // ========================================
    // 4. CREAR LOG
    // ========================================

    console.log('\n4. Creando log perteneciente a OT-0001...');

    const resultadoLog = db.prepare(`
        INSERT INTO logs_ot (
            id_ot,
            id_usuario,
            tipo_evento
        )
        VALUES (?, ?, ?)
    `).run(
        1,
        1,
        'DISEÑO_CARGADO'
    );

    console.log('   ✅ Log creado correctamente.');
    console.log('   ID log:', resultadoLog.lastInsertRowid);


    // ========================================
    // 5. CREAR IMPRESIÓN
    // ========================================

    console.log('\n5. Creando impresión relacionada con OT-0001...');

    const resultadoImpresion = db.prepare(`
        INSERT INTO impresion (
            id_ot,
            id_diseño,
            id_usuario,
            codigo_maquina,
            cantidad_impresa,
            observaciones
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        1,
        idDiseño,
        1,
        'MAQ-001',
        500,
        'Impresión de prueba'
    );

    console.log('   ✅ Impresión creada correctamente.');
    console.log('   ID impresión:', resultadoImpresion.lastInsertRowid);


    // ========================================
    // 6. CONSULTAR RELACIONES
    // ========================================

    console.log('\n6. Consultando relaciones de OT-0001...');

    const resumen = db.prepare(`
        SELECT
            ot.codigo_ot,
            c.codigo_cotizacion,
            c.estado AS estado_cotizacion,
            ot.estado AS estado_ot,
            ot.prioridad,
            d.nombre_diseño,
            a.nombre_archivo,
            i.codigo_maquina,
            i.cantidad_impresa,
            l.tipo_evento
        FROM orden_trabajo ot

        INNER JOIN cotizacion c
            ON c.id_cotizacion = ot.id_cotizacion

        LEFT JOIN diseño d
            ON d.id_ot = ot.id_ot

        LEFT JOIN archivo a
            ON a.id_ot = ot.id_ot

        LEFT JOIN impresion i
            ON i.id_ot = ot.id_ot

        LEFT JOIN logs_ot l
            ON l.id_ot = ot.id_ot

        WHERE ot.id_ot = ?
    `).get(1);

    console.log('\n========================================');
    console.log('RESUMEN DE OT-0001');
    console.log('========================================');

    console.log('OT:', resumen.codigo_ot);
    console.log('Cotización:', resumen.codigo_cotizacion);
    console.log('Estado cotización:', resumen.estado_cotizacion);
    console.log('Estado OT:', resumen.estado_ot);
    console.log('Prioridad:', resumen.prioridad);
    console.log('Diseño:', resumen.nombre_diseño);
    console.log('Archivo:', resumen.nombre_archivo);
    console.log('Máquina:', resumen.codigo_maquina);
    console.log('Cantidad impresa:', resumen.cantidad_impresa);
    console.log('Último evento registrado:', resumen.tipo_evento);


    // ========================================
    // RESULTADO
    // ========================================

    console.log('\n========================================');
    console.log('RESULTADO DEL PASO 18');
    console.log('========================================');

    console.log('✅ OT-0001 relacionada correctamente con su cotización.');
    console.log('✅ Diseño relacionado correctamente con la OT.');
    console.log('✅ Archivo relacionado correctamente con la OT.');
    console.log('✅ Impresión relacionada correctamente con la OT.');
    console.log('✅ Log registrado dentro de OT-0001.');
    console.log('✅ Las relaciones pueden consultarse correctamente.');

} catch (error) {

    console.error('\n❌ Error:', error.message);

} finally {

    db.close();

}