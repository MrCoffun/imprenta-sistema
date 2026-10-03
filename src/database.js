const Database = require('better-sqlite3');
const path = require('path');

const rutaBD = path.join(__dirname, '..', 'database', 'imprenta.db');

const db = new Database(rutaBD);

db.pragma('foreign_keys = ON');

console.log('✅ Conexión con SQLite establecida.');
console.log('📁 Base de datos:', rutaBD);

module.exports = db;