const Database = require('better-sqlite3');

const db = new Database('./database/imprenta.db');

const columnas = db.prepare(`
    PRAGMA table_info(cotizacion);
`).all();

console.log('Columnas de la tabla cotizacion:');

for (const columna of columnas) {
    console.log('-', columna.name);
}

db.close();