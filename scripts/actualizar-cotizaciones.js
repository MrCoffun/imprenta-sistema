const Database = require('better-sqlite3');

const db = new Database('./database/imprenta.db');

db.pragma('foreign_keys = ON');

try {

    // =========================================
    // TABLA: TARIFA_COTIZACION
    // =========================================

    db.exec(`
        CREATE TABLE IF NOT EXISTS tarifa_cotizacion (
            id_tarifa INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_producto VARCHAR(100) NOT NULL,
            tamaño VARCHAR(50) NOT NULL,
            material VARCHAR(100) NOT NULL,
            tipo_impresion VARCHAR(50) NOT NULL,
            caras VARCHAR(50) NOT NULL,
            precio_millar DECIMAL(10,2) NOT NULL,
            activo BOOLEAN NOT NULL DEFAULT 1
        );
    `);


    // =========================================
    // TABLA: COTIZACION_COSTOS
    // =========================================

    db.exec(`
        CREATE TABLE IF NOT EXISTS cotizacion_costos (
            id_costo INTEGER PRIMARY KEY AUTOINCREMENT,
            id_cotizacion INTEGER NOT NULL UNIQUE,
            id_tarifa INTEGER NOT NULL,
            cantidad_millares INTEGER NOT NULL,
            costo_produccion DECIMAL(10,2) NOT NULL DEFAULT 0,
            mano_obra_diseño DECIMAL(10,2) NOT NULL DEFAULT 0,
            total DECIMAL(10,2) NOT NULL DEFAULT 0,
            estado_evaluacion VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
            fecha_creacion DATETIME NOT NULL,
            fecha_actualizacion DATETIME NOT NULL,

            FOREIGN KEY (id_cotizacion)
                REFERENCES cotizacion(id_cotizacion),

            FOREIGN KEY (id_tarifa)
                REFERENCES tarifa_cotizacion(id_tarifa)
        );
    `);


    console.log('✅ Tablas de cotización creadas/verificadas correctamente.');


    // =========================================
    // VERIFICAR TABLAS
    // =========================================

    const tablas = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name IN (
            'tarifa_cotizacion',
            'cotizacion_costos'
        )
        ORDER BY name;
    `).all();

    console.log('📋 Tablas encontradas:');

    tablas.forEach(tabla => {
        console.log(`- ${tabla.name}`);
    });

} catch (error) {

    console.error(
        '❌ Error actualizando la base de datos:',
        error.message
    );

} finally {

    db.close();

}