const db = require('../src/database');

console.log('\n========================================');
console.log('ACTUALIZACIÓN DE TABLA logs_ot');
console.log('========================================\n');

try {

    db.exec(`
        ALTER TABLE logs_ot
        ADD COLUMN estado_anterior VARCHAR(30);
    `);

    db.exec(`
        ALTER TABLE logs_ot
        ADD COLUMN estado_nuevo VARCHAR(30);
    `);

    db.exec(`
        ALTER TABLE logs_ot
        ADD COLUMN detalle_evento VARCHAR(500);
    `);

    console.log('✅ Campo estado_anterior agregado.');
    console.log('✅ Campo estado_nuevo agregado.');
    console.log('✅ Campo detalle_evento agregado.');

    console.log('\n========================================');
    console.log('ESTRUCTURA ACTUAL DE logs_ot');
    console.log('========================================\n');

    const columnas = db.prepare(`
        PRAGMA table_info(logs_ot)
    `).all();

    columnas.forEach(columna => {
        console.log(
            `${columna.cid}. ${columna.name} | ${columna.type} | NOT NULL: ${columna.notnull}`
        );
    });

    console.log('\n========================================');
    console.log('LOGS EXISTENTES');
    console.log('========================================\n');

    const logs = db.prepare(`
        SELECT *
        FROM logs_ot
        ORDER BY id_logs
    `).all();

    console.log(logs);

    console.log('\n✅ Actualización completada correctamente.');

} catch (error) {

    console.error('\n❌ Error durante la actualización:');
    console.error(error.message);

} finally {

    db.close();

}