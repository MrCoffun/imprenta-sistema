const db = require('../src/database');

console.log('\n========================================');
console.log('CORRECCIÓN DE HORARIO - LIMA, PERÚ');
console.log('========================================\n');

try {

    /*
    SQLite guarda CURRENT_TIMESTAMP en UTC.
    Lima = UTC-5.
    Por eso restamos 5 horas a los
    registros existentes.
    */

    db.exec(`
        UPDATE cotizacion
        SET fecha_creacion = datetime(fecha_creacion, '-5 hours'),
            fecha_actualizacion = datetime(fecha_actualizacion, '-5 hours');

        UPDATE orden_trabajo
        SET fecha_creacion = datetime(fecha_creacion, '-5 hours'),
            fecha_actualizacion = datetime(fecha_actualizacion, '-5 hours');

        UPDATE diseño
        SET fecha_carga = datetime(fecha_carga, '-5 hours');

        UPDATE archivo
        SET fecha_carga = datetime(fecha_carga, '-5 hours');

        UPDATE impresion
        SET fecha_impresion = datetime(fecha_impresion, '-5 hours');

        UPDATE logs_ot
        SET fecha_hora = datetime(fecha_hora, '-5 hours');
    `);

    console.log('✅ Horarios de cotizaciones corregidos.');
    console.log('✅ Horarios de órdenes de trabajo corregidos.');
    console.log('✅ Horarios de diseños corregidos.');
    console.log('✅ Horarios de archivos corregidos.');
    console.log('✅ Horarios de impresiones corregidos.');
    console.log('✅ Horarios de logs corregidos.');

    console.log('\n========================================');
    console.log('VERIFICACIÓN');
    console.log('========================================\n');

    const logs = db.prepare(`
        SELECT
            id_logs,
            id_ot,
            tipo_evento,
            fecha_hora
        FROM logs_ot
        ORDER BY id_logs
    `).all();

    console.log(logs);

    console.log('\n✅ Corrección de horario completada.');

} catch (error) {

    console.error('\n❌ Error durante la corrección:');
    console.error(error.message);

} finally {

    db.close();

}