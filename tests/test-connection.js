const db = require('./database');

console.log('\n========================================');
console.log('PASO 20 - PRUEBA DE CONEXIÓN NODE → SQLITE');
console.log('========================================\n');

try {

    const tablas = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
    `).all();

    console.log('✅ Conexión con SQLite establecida.\n');

    console.log('Tablas encontradas:');

    tablas.forEach(tabla => {
        console.log(`- ${tabla.name}`);
    });

    console.log('\n========================================');
    console.log('RESULTADO DEL PASO 20');
    console.log('========================================');

    console.log('✅ Node.js puede conectarse a SQLite.');
    console.log('✅ better-sqlite3 funciona correctamente.');
    console.log('✅ La base de datos imprenta.db fue encontrada.');
    console.log('✅ Node.js puede consultar sus tablas.');

} catch (error) {

    console.error('\n❌ Error:', error.message);

} finally {

    db.close();

}