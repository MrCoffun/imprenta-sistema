const Database = require('better-sqlite3');

const db = new Database('./database/imprenta.db');

console.log('\n=== ESTRUCTURA ===');
console.log(
    db.prepare(`
        PRAGMA table_info(cotizacion_costos)
    `).all()
);

console.log('\n=== DATOS ===');
console.log(
    db.prepare(`
        SELECT *
        FROM cotizacion_costos
    `).all()
);

db.close();