const Database = require('better-sqlite3');

const db = new Database('./database/imprenta.db');

db.pragma('foreign_keys = ON');

try {

    // =====================================================
    // LIMPIAR SOLAMENTE EL CATÁLOGO DE TARIFAS
    // =====================================================

    db.prepare(`
        DELETE FROM tarifa_cotizacion
    `).run();


    // =====================================================
    // CATÁLOGO DE TARIFAS
    // 24 VOLANTES + 24 AFICHES = 48 TARIFAS
    // =====================================================

    const tarifas = [];


    // =====================================================
    // VOLANTES
    // =====================================================

    const preciosVolantes = {

        A5: {
            'Couché 150g': {
                'Full color': 100,
                'Blanco y negro': 75
            },
            'Couché 200g': {
                'Full color': 120,
                'Blanco y negro': 95
            }
        },

        A6: {
            'Couché 150g': {
                'Full color': 90,
                'Blanco y negro': 65
            },
            'Couché 200g': {
                'Full color': 110,
                'Blanco y negro': 85
            }
        },

        A7: {
            'Couché 150g': {
                'Full color': 80,
                'Blanco y negro': 55
            },
            'Couché 200g': {
                'Full color': 100,
                'Blanco y negro': 75
            }
        }

    };


    Object.entries(preciosVolantes).forEach(
        ([tamaño, materiales]) => {

            Object.entries(materiales).forEach(
                ([material, impresiones]) => {

                    Object.entries(impresiones).forEach(
                        ([impresion, precioBase]) => {

                            tarifas.push({
                                tipo_producto: 'Volante',
                                tamaño,
                                material,
                                tipo_impresion: impresion,
                                caras: 'Frente',
                                precio_millar: precioBase
                            });

                            tarifas.push({
                                tipo_producto: 'Volante',
                                tamaño,
                                material,
                                tipo_impresion: impresion,
                                caras: 'Frente y vuelta',
                                precio_millar: precioBase + 10
                            });

                        }
                    );

                }
            );

        }
    );


    // =====================================================
    // AFICHES
    // =====================================================

    const preciosAfiches = {

        A3: {
            'Couché 150g': {
                'Full color': 140,
                'Blanco y negro': 120
            },
            'Couché 200g': {
                'Full color': 160,
                'Blanco y negro': 140
            }
        },

        A2: {
            'Couché 150g': {
                'Full color': 155,
                'Blanco y negro': 135
            },
            'Couché 200g': {
                'Full color': 175,
                'Blanco y negro': 155
            }
        },

        A1: {
            'Couché 150g': {
                'Full color': 180,
                'Blanco y negro': 160
            },
            'Couché 200g': {
                'Full color': 200,
                'Blanco y negro': 180
            }
        }

    };


    Object.entries(preciosAfiches).forEach(
        ([tamaño, materiales]) => {

            Object.entries(materiales).forEach(
                ([material, impresiones]) => {

                    Object.entries(impresiones).forEach(
                        ([impresion, precioBase]) => {

                            tarifas.push({
                                tipo_producto: 'Afiche',
                                tamaño,
                                material,
                                tipo_impresion: impresion,
                                caras: 'Frente',
                                precio_millar: precioBase
                            });

                            tarifas.push({
                                tipo_producto: 'Afiche',
                                tamaño,
                                material,
                                tipo_impresion: impresion,
                                caras: 'Frente y vuelta',
                                precio_millar: precioBase + 10
                            });

                        }
                    );

                }
            );

        }
    );


    // =====================================================
    // INSERTAR TARIFAS
    // =====================================================

    const insertarTarifa = db.prepare(`
        INSERT INTO tarifa_cotizacion (
            tipo_producto,
            tamaño,
            material,
            tipo_impresion,
            caras,
            precio_millar,
            activo
        )
        VALUES (
            @tipo_producto,
            @tamaño,
            @material,
            @tipo_impresion,
            @caras,
            @precio_millar,
            1
        )
    `);


    const insertarTodas =
        db.transaction(() => {

            for (const tarifa of tarifas) {
                insertarTarifa.run(tarifa);
            }

        });


    insertarTodas();


    // =====================================================
    // VERIFICACIÓN
    // =====================================================

    console.log(
        '✅ Tarifas cargadas correctamente.'
    );

    console.log(
        `📋 Total de tarifas insertadas: ${tarifas.length}`
    );


    const cantidad =
        db.prepare(`
            SELECT COUNT(*) AS total
            FROM tarifa_cotizacion
            WHERE activo = 1
        `).get();


    console.log(
        `📊 Total de tarifas activas en BD: ${cantidad.total}`
    );


    if (cantidad.total !== 48) {

        throw new Error(
            `Se esperaban 48 tarifas, pero existen ${cantidad.total}.`
        );

    }


    console.log(
        '✅ Catálogo completo: 24 Volantes + 24 Afiches.'
    );


} catch (error) {

    console.error(
        '❌ Error cargando tarifas:',
        error.message
    );

} finally {

    db.close();

}