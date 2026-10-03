const db = require('../src/database');

console.log('\n========================================');
console.log('CORRECCIÓN OT-0003');
console.log('========================================\n');

try {

    db.prepare(`
        UPDATE orden_trabajo
        SET fecha_creacion = datetime(fecha_creacion, '-5 hours')
        WHERE id_ot = 3
    `).run();

    const ot = db.prepare(`
        SELECT
            id_ot,
            codigo_ot,
            fecha_creacion,
            fecha_actualizacion
        FROM orden_trabajo
        WHERE id_ot = 3
    `).get();

    console.log('✅ OT corregida:');
    console.log(ot);

} catch (error) {

    console.error('❌ Error:', error.message);

} finally {

    db.close();

}