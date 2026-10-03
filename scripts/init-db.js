const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('./database/imprenta.db');

const schema = fs.readFileSync('./database/schema.sql', 'utf8');

db.exec(schema);

console.log('Base de datos creada correctamente.');

db.close();