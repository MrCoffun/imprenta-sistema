const db = require('../src/database');

try {

    const resultado = db.prepare(`
        INSERT INTO logs_ot (
            id_ot,
            id_usuario,
            tipo_evento
        )
        VALUES (?, ?, ?)
    `).run(
        2,
        1,
        'OT_CREADA'
    );

    console.log('✅ Log creado correctamente.');
    console.log('ID del log:', resultado.lastInsertRowid);

} catch (error) {

    console.error('❌ Error:', error.message);

} finally {

    db.close();

}