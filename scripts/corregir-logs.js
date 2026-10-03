const db = require('../src/database');

console.log('\n========================================');
console.log('CORRECCIÓN DE LOGS EXISTENTES');
console.log('========================================\n');

try {

    // OT-0001 - Diseño cargado
    db.prepare(`
        UPDATE logs_ot
        SET detalle_evento = ?
        WHERE id_logs = ?
    `).run(
        'Diseño volante A5 - volantes.pdf',
        1
    );

    // OT-0002 - OT creada
    db.prepare(`
        UPDATE logs_ot
        SET estado_nuevo = ?,
            detalle_evento = ?
        WHERE id_logs = ?
    `).run(
        'Pendiente',
        'Generada desde COT-0003',
        2
    );

    // OT-0002 - Diseño cargado
    db.prepare(`
        UPDATE logs_ot
        SET detalle_evento = ?
        WHERE id_logs = ?
    `).run(
        'Diseño volante A4 - volante_a4.pdf',
        3
    );

    // OT-0002 - Impresión registrada
    db.prepare(`
        UPDATE logs_ot
        SET detalle_evento = ?
        WHERE id_logs = ?
    `).run(
        '500 unidades - MAQ-001',
        4
    );

    // OT-0002 - Pendiente → En Diseño
    db.prepare(`
        UPDATE logs_ot
        SET estado_anterior = ?,
            estado_nuevo = ?,
            detalle_evento = ?
        WHERE id_logs = ?
    `).run(
        'Pendiente',
        'En Diseño',
        'La OT cambió de Pendiente a En Diseño',
        5
    );

    // OT-0002 - En Diseño → En Impresión
    db.prepare(`
        UPDATE logs_ot
        SET estado_anterior = ?,
            estado_nuevo = ?,
            detalle_evento = ?
        WHERE id_logs = ?
    `).run(
        'En Diseño',
        'En Impresión',
        'La OT cambió de En Diseño a En Impresión',
        6
    );

    // OT-0002 - En Impresión → Finalizada
    db.prepare(`
        UPDATE logs_ot
        SET estado_anterior = ?,
            estado_nuevo = ?,
            detalle_evento = ?
        WHERE id_logs = ?
    `).run(
        'En Impresión',
        'Finalizada',
        'La OT cambió de En Impresión a Finalizada',
        7
    );

    console.log('✅ Logs existentes actualizados correctamente.\n');

    const logs = db.prepare(`
        SELECT
            id_logs,
            id_ot,
            id_usuario,
            tipo_evento,
            estado_anterior,
            estado_nuevo,
            detalle_evento,
            fecha_hora
        FROM logs_ot
        ORDER BY id_logs
    `).all();

    console.log(logs);

} catch (error) {

    console.error('❌ Error:', error.message);

} finally {

    db.close();

}