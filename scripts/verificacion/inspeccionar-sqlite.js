const db = require('../../legacy/sqlite/database');

const tablas = db.prepare(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
`).all();

for (const tabla of tablas) {
    console.log('\n' + '='.repeat(60));
    console.log('TABLA:', tabla.name);
    console.log('='.repeat(60));
    console.log(tabla.sql);

    const cantidad = db.prepare(
        `SELECT COUNT(*) AS total FROM "${tabla.name.replace(/"/g, '""')}"`
    ).get();

    console.log('REGISTROS:', cantidad.total);
}

db.close();