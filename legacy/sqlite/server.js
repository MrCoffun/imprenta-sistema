const express = require('express');
const session = require('express-session');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
    session({
        secret: 'imprenta-sistema-2026',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 8 * 60 * 60 * 1000
        }
    })
);

const bcrypt = require('bcryptjs');

// ==========================================
// USUARIOS DE PRUEBA POR ROL
// ==========================================

function crearUsuariosPrueba() {

    const usuarios = [
        {
            nombres: 'Usuario',
            apellidos: 'Administrador',
            usuario: 'admin',
            contraseña: 'Admin123',
            rol: 'administrador'
        },
        {
            nombres: 'Usuario',
            apellidos: 'Diseñador',
            usuario: 'diseno',
            contraseña: 'Diseno123',
            rol: 'diseñador'
        },
        {
            nombres: 'Usuario',
            apellidos: 'Maquinista',
            usuario: 'maquina',
            contraseña: 'Maquina123',
            rol: 'maquinista'
        }
    ];

    const buscarUsuario =
        db.prepare(`
            SELECT id_usuario
            FROM usuario
            WHERE usuario = ?
        `);

    const insertarUsuario =
        db.prepare(`
            INSERT INTO usuario (
                nombres,
                apellidos,
                usuario,
                contraseña,
                rol
            )
            VALUES (?, ?, ?, ?, ?)
        `);

    for (const user of usuarios) {

        const existente =
            buscarUsuario.get(user.usuario);

        if (existente) {
            continue;
        }

        const hash =
            bcrypt.hashSync(user.contraseña, 10);

        insertarUsuario.run(
            user.nombres,
            user.apellidos,
            user.usuario,
            hash,
            user.rol
        );

        console.log(
            `✅ Usuario creado: ${user.usuario} (${user.rol})`
        );
    }
}

crearUsuariosPrueba();

app.post('/api/login', async (req, res) => {
    try {
        const { usuario, contraseña } = req.body;

        if (!usuario || !contraseña) {
            return res.status(400).json({
                error: 'Usuario y contraseña son obligatorios'
            });
        }

        const user = db.prepare(`
            SELECT
                id_usuario,
                nombres,
                apellidos,
                usuario,
                contraseña,
                rol,
                estado
            FROM usuario
            WHERE usuario = ?
        `).get(usuario.trim());

        if (!user || user.estado !== 1) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos'
            });
        }

        const contraseñaValida =
            await bcrypt.compare(contraseña, user.contraseña);

        if (!contraseñaValida) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos'
            });
        }

        req.session.user = {
            id: user.id_usuario,
            nombre: `${user.nombres} ${user.apellidos}`,
            usuario: user.usuario,
            rol: user.rol
        };

        res.json({
            mensaje: 'Inicio de sesión correcto',
            usuario: req.session.user
        });

    } catch (error) {
        console.error('❌ Error en login:', error);

        res.status(500).json({
            error: 'Error interno al iniciar sesión'
        });
    }
});

app.get('/api/perfil', (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            error: 'No hay una sesión activa'
        });
    }

    res.json({
        usuario: req.session.user
    });
});

app.post('/api/logout', (req, res) => {

    req.session.destroy(error => {

        if (error) {
            console.error('❌ Error cerrando sesión:', error);

            return res.status(500).json({
                error: 'No se pudo cerrar la sesión'
            });
        }

        res.clearCookie('connect.sid');

        res.json({
            mensaje: 'Sesión cerrada correctamente'
        });
    });
});

function auth(req, res, next) {

    if (!req.session.user) {
        return res.status(401).json({
            error: 'Debes iniciar sesión'
        });
    }

    next();
}

function permitirRoles(...rolesPermitidos) {

    return (req, res, next) => {

        if (!req.session.user) {
            return res.status(401).json({
                error: 'Debes iniciar sesión'
            });
        }

        const rolUsuario =
            req.session.user.rol.toLowerCase();

        const rolesNormalizados =
            rolesPermitidos.map(rol =>
                rol.toLowerCase()
            );

        if (!rolesNormalizados.includes(rolUsuario)) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
}

app.get('/api/protegida', auth, (req, res) => {

    res.json({
        mensaje: 'Acceso autorizado',
        usuario: req.session.user
    });

});

app.use(express.static(path.join(__dirname, '..', 'public')));

console.log('🔥 API DE COTIZACIONES CARGADA');


// ========================================
// GET - ESTADÍSTICAS DEL DASHBOARD
// ========================================

app.get('/api/dashboard',
    permitirRoles('administrador'),
    (req, res) => {

    try {

        const contar = (sql) =>
            db.prepare(sql).get().total;

        res.json({

            totalCotizaciones:
                contar(`
                    SELECT COUNT(*) AS total
                    FROM cotizacion
                `),

            totalOT:
                contar(`
                    SELECT COUNT(*) AS total
                    FROM orden_trabajo
                `),

            totalPrioritarias:
                contar(`
                    SELECT COUNT(*) AS total
                    FROM orden_trabajo
                    WHERE prioridad = 'Prioritaria'
                `),

            totalRetrasadas:
                contar(`
                    SELECT COUNT(*) AS total
                    FROM orden_trabajo
                    WHERE prioridad = 'Retrasada'
                `)

        });

    } catch (error) {

        console.error(
            '❌ Error obteniendo estadísticas del dashboard:',
            error.message
        );

        res.status(500).json({
            error:
                'Error al obtener estadísticas del dashboard',
            detalle:
                error.message
        });

    }

});

/*
========================================
FUNCIÓN - CALCULAR PRIORIDAD DE LA OT
========================================
*/
function calcularPrioridad(fechaRequerida, horaRequerida) {

    // La fecha/hora requerida pertenece al horario de Lima (UTC-5)
    const fechaHoraRequerida = new Date(
        `${fechaRequerida}T${horaRequerida}:00-05:00`
    );

    const ahora = new Date();

    const diferenciaHoras =
        (fechaHoraRequerida - ahora) / (1000 * 60 * 60);

    if (diferenciaHoras < 0) {
        return 'Retrasada';
    }

    if (diferenciaHoras <= 24) {
        return 'Prioritaria';
    }

    return 'Normal';
}

function actualizarPrioridades() {

    const ots = db.prepare(`
        SELECT
            id_ot,
            codigo_ot,
            fecha_requerida,
            hora_requerida,
            prioridad
        FROM orden_trabajo
        WHERE estado != 'Finalizada'
    `).all();

    const actualizar = db.prepare(`
        UPDATE orden_trabajo
        SET prioridad = ?,
            fecha_actualizacion = ?
        WHERE id_ot = ?
    `);

    let cambios = 0;

    for (const ot of ots) {

        const nuevaPrioridad = calcularPrioridad(
            ot.fecha_requerida,
            ot.hora_requerida
        );

        if (nuevaPrioridad !== ot.prioridad) {

            actualizar.run(
                nuevaPrioridad,
                fechaHoraLima(),
                ot.id_ot
            );

            cambios++;

            console.log(
                `⚠️ ${ot.codigo_ot}: ${ot.prioridad} → ${nuevaPrioridad}`
            );
        }
    }

    if (cambios > 0) {
        console.log(`🔄 Prioridades actualizadas: ${cambios}`);
    }
}

/*
========================================
FUNCIÓN - REGISTRAR LOG DE OT
========================================
*/
function registrarLog(
    idOT,
    idUsuario,
    tipoEvento,
    estadoAnterior = null,
    estadoNuevo = null,
    detalleEvento = null
) {

    db.prepare(`
        INSERT INTO logs_ot (
            id_ot,
            id_usuario,
            tipo_evento,
            estado_anterior,
            estado_nuevo,
            detalle_evento,
            fecha_hora
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        idOT,
        idUsuario,
        tipoEvento,
        estadoAnterior,
        estadoNuevo,
        detalleEvento,
        fechaHoraLima()
    );
}

/*
========================================
FUNCIÓN - FECHA Y HORA DE LIMA
========================================
*/
function fechaHoraLima() {
    const ahora = new Date();

    const partes = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(ahora);

    const valores = {};

    partes.forEach(parte => {
        if (parte.type !== 'literal') {
            valores[parte.type] = parte.value;
        }
    });

    return `${valores.year}-${valores.month}-${valores.day} ${valores.hour}:${valores.minute}:${valores.second}`;
}

/*
========================================
GET - LISTAR COTIZACIONES
========================================
*/
app.get('/api/cotizaciones',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    (req, res) => {

    console.log('🔥 SE RECIBIÓ GET /api/cotizaciones');

    try {

        const paginaSolicitada =
            Number.parseInt(req.query.pagina, 10) || 1;

        const porPagina = 10;

        const pagina =
            paginaSolicitada < 1
                ? 1
                : paginaSolicitada;

        const totalRegistros =
            db.prepare(`
                SELECT COUNT(*) AS total
                FROM cotizacion
            `).get().total;

        const totalPaginas =
            Math.max(
                1,
                Math.ceil(totalRegistros / porPagina)
            );

        const paginaFinal =
            Math.min(pagina, totalPaginas);

        const offset =
            (paginaFinal - 1) * porPagina;

        const cotizaciones = db.prepare(`
            SELECT
                c.id_cotizacion,
                c.codigo_cotizacion,
                cl.nombre AS cliente,
                u.nombres || ' ' || u.apellidos AS usuario,
                c.tipo_producto,
                c.tamaño,
                c.material,
                c.impresion,
                c.color,
                c.acabado,
                c.sangrado,
                c.cantidad,
                c.fecha_requerida,
                c.hora_requerida,
                c.observaciones,
                c.estado,
                c.fecha_creacion,
                c.fecha_actualizacion
            FROM cotizacion c
            INNER JOIN cliente cl
                ON c.id_cliente = cl.id_cliente
            INNER JOIN usuario u
                ON c.id_usuario = u.id_usuario
            ORDER BY c.id_cotizacion
            LIMIT ? OFFSET ?
        `).all(
            porPagina,
            offset
        );

        console.log(
            `✅ Página ${paginaFinal}/${totalPaginas} - ` +
            `${cotizaciones.length} cotizaciones`
        );

        res.json({
            cotizaciones,
            pagina: paginaFinal,
            porPagina,
            totalRegistros,
            totalPaginas
        });

    } catch (error) {

        console.error(
            '❌ Error al consultar cotizaciones:',
            error.message
        );

        res.status(500).json({
            error: 'Error al consultar las cotizaciones',
            detalle: error.message
        });

    }

});

// ========================================
// GET - COTIZACIONES PENDIENTES DE MANO DE OBRA
// ========================================

app.get('/api/cotizaciones/diseno-pendientes',
    permitirRoles('diseñador'),
    (req, res) => {

        try {

            const cotizaciones =
                db.prepare(`
                    SELECT
                        c.id_cotizacion,
                        c.codigo_cotizacion,
                        c.tipo_producto,
                        c.tamaño,
                        c.material,
                        c.impresion,
                        c.color,
                        c.acabado,
                        c.sangrado,
                        c.cantidad,
                        c.fecha_requerida,
                        c.hora_requerida,
                        c.estado,

                        cc.id_costo,
                        cc.costo_produccion,
                        cc.mano_obra_diseño,
                        cc.total,
                        cc.estado_evaluacion

                    FROM cotizacion c

                    INNER JOIN cotizacion_costos cc
                        ON c.id_cotizacion =
                           cc.id_cotizacion

                    WHERE c.estado = 'Pendiente'
                        AND cc.estado_evaluacion = 'Pendiente'

                    ORDER BY
                        c.fecha_creacion ASC
                `)
                .all();

            res.json(cotizaciones);

        } catch (error) {

            console.error(
                '❌ Error obteniendo cotizaciones pendientes de diseño:',
                error.message
            );

            res.status(500).json({
                error:
                    'Error al obtener cotizaciones pendientes de diseño',
                detalle:
                    error.message
            });

        }

    }
);

// ========================================
// PUT - COTIZACIONES PENDIENTES DISEÑO ENVIADO
// ========================================

app.put('/api/cotizaciones/:id/propuesta-diseno',
    permitirRoles('diseñador'),
    (req, res) => {

        try {

            const idCotizacion =
                Number(req.params.id);

            const manoObra =
                Number(req.body.mano_obra_diseño);

            if (
                !Number.isFinite(idCotizacion) ||
                !Number.isFinite(manoObra) ||
                manoObra < 0
            ) {
                return res.status(400).json({
                    error:
                        'El monto de mano de obra no es válido'
                });
            }

            const cotizacion =
                db.prepare(`
                    SELECT
                        c.id_cotizacion,
                        cc.id_costo,
                        cc.costo_produccion
                    FROM cotizacion c
                    INNER JOIN cotizacion_costos cc
                        ON c.id_cotizacion =
                           cc.id_cotizacion
                    WHERE c.id_cotizacion = ?
                `)
                .get(idCotizacion);

            if (!cotizacion) {
                return res.status(404).json({
                    error:
                        'Cotización no encontrada'
                });
            }

            const total =
                Number(cotizacion.costo_produccion) +
                manoObra;

            db.prepare(`
                UPDATE cotizacion_costos
                SET
                    mano_obra_diseño = ?,
                    total = ?,
                    estado_evaluacion = 'Propuesta enviada',
                    fecha_actualizacion =
                        datetime('now', '-5 hours')
                WHERE id_costo = ?
            `)
            .run(
                manoObra,
                total,
                cotizacion.id_costo
            );

            res.json({
                mensaje:
                    'Propuesta de diseño enviada correctamente',
                id_cotizacion:
                    idCotizacion,
                mano_obra_diseño:
                    manoObra,
                total:
                    total
            });

        } catch (error) {

            console.error(
                '❌ Error enviando propuesta de diseño:',
                error.message
            );

            res.status(500).json({
                error:
                    'Error al enviar propuesta de diseño',
                detalle:
                    error.message
            });

        }

    }
);

// ========================================
// PATCH - MODIFICAR PETICION ENVIADA COTIZACION DISEÑO
// ========================================

app.patch('/api/cotizaciones/:id/modificar-mano-obra',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {

        try {

            const idCotizacion =
                Number(req.params.id);

            const nuevaManoObra =
                Number(req.body.mano_obra_diseño);

            if (
                !Number.isFinite(idCotizacion) ||
                !Number.isFinite(nuevaManoObra) ||
                nuevaManoObra < 0
            ) {
                return res.status(400).json({
                    error:
                        'El monto de mano de obra no es válido'
                });
            }

            const cotizacion =
                db.prepare(`
                    SELECT
                        cc.id_costo,
                        cc.costo_produccion
                    FROM cotizacion_costos cc
                    INNER JOIN cotizacion c
                        ON c.id_cotizacion =
                           cc.id_cotizacion
                    WHERE c.id_cotizacion = ?
                `)
                .get(idCotizacion);

            if (!cotizacion) {
                return res.status(404).json({
                    error:
                        'Cotización no encontrada'
                });
            }

            const nuevoTotal =
                Number(cotizacion.costo_produccion) +
                nuevaManoObra;

            db.prepare(`
                UPDATE cotizacion_costos
                SET
                    mano_obra_diseño = ?,
                    total = ?,
                    fecha_actualizacion =
                        datetime('now', '-5 hours')
                WHERE id_costo = ?
            `)
            .run(
                nuevaManoObra,
                nuevoTotal,
                cotizacion.id_costo
            );

            res.json({
                mensaje:
                    'Mano de obra modificada correctamente',
                mano_obra_diseño:
                    nuevaManoObra,
                total:
                    nuevoTotal
            });

        } catch (error) {

            console.error(
                '❌ Error modificando mano de obra:',
                error.message
            );

            res.status(500).json({
                error:
                    'Error modificando mano de obra',
                detalle:
                    error.message
            });
        }
    }
);

// ========================================
// GET - PENDIENTES DE DISEÑADOR (COSTOS)
// ========================================
app.get('/api/cotizaciones/pendientes-disenador',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {

        try {

            const cotizaciones =
                db.prepare(`
                    SELECT
                        c.id_cotizacion,
                        c.codigo_cotizacion,
                        cl.nombre AS cliente,
                        c.tipo_producto,
                        c.cantidad,
                        c.fecha_requerida,
                        c.hora_requerida,
                        c.estado,

                        cc.costo_produccion,
                        cc.mano_obra_diseño,
                        cc.total,
                        cc.estado_evaluacion

                    FROM cotizacion c

                    INNER JOIN cliente cl
                        ON c.id_cliente = cl.id_cliente

                    INNER JOIN cotizacion_costos cc
                        ON c.id_cotizacion =
                           cc.id_cotizacion

                    WHERE c.estado = 'Pendiente'
                      AND cc.estado_evaluacion = 'Pendiente'

                    ORDER BY c.fecha_creacion ASC
                `)
                .all();

            res.json(cotizaciones);

        } catch (error) {

            console.error(
                '❌ Error obteniendo pendientes de diseñador:',
                error.message
            );

            res.status(500).json({
                error:
                    'Error al obtener pendientes de diseñador',
                detalle:
                    error.message
            });
        }
    }
);

// ========================================
// GET - PENDIENTES DE APROBACIÓN (COSTOS)
// ========================================
app.get('/api/cotizaciones/pendientes-aprobacion',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {

        try {

            const cotizaciones =
                db.prepare(`
                    SELECT
                        c.id_cotizacion,
                        c.codigo_cotizacion,
                        cl.nombre AS cliente,
                        c.tipo_producto,
                        c.cantidad,
                        c.fecha_requerida,
                        c.hora_requerida,
                        c.estado,

                        cc.costo_produccion,
                        cc.mano_obra_diseño,
                        cc.total,
                        cc.estado_evaluacion

                    FROM cotizacion c

                    INNER JOIN cliente cl
                        ON c.id_cliente = cl.id_cliente

                    INNER JOIN cotizacion_costos cc
                        ON c.id_cotizacion =
                           cc.id_cotizacion

                    WHERE c.estado = 'Pendiente'
                      AND cc.estado_evaluacion =
                          'Propuesta enviada'

                    ORDER BY c.fecha_creacion ASC
                `)
                .all();

            res.json(cotizaciones);

        } catch (error) {

            console.error(
                '❌ Error obteniendo pendientes de aprobación:',
                error.message
            );

            res.status(500).json({
                error:
                    'Error al obtener pendientes de aprobación',
                detalle:
                    error.message
            });
        }
    }
);

// ========================================
// GET - HISTORIAL COTIZACIONES APROBADAS Y RECHAZADAS
// ========================================
app.get('/api/cotizaciones/historial/aprobadas',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {

        try {

            const cotizaciones =
                db.prepare(`
                    SELECT
                        c.id_cotizacion,
                        c.codigo_cotizacion,
                        cl.nombre AS cliente,
                        c.tipo_producto,
                        c.cantidad,
                        c.estado,
                        c.fecha_actualizacion,

                        COALESCE(
                            cc.total,
                            0
                        ) AS total

                    FROM cotizacion c

                    INNER JOIN cliente cl
                        ON c.id_cliente = cl.id_cliente

                    LEFT JOIN cotizacion_costos cc
                        ON c.id_cotizacion =
                           cc.id_cotizacion

                    WHERE c.estado = 'Aprobada'

                    ORDER BY
                        c.fecha_actualizacion DESC
                `)
                .all();

            res.json(cotizaciones);

        } catch (error) {

            console.error(
                '❌ Error obteniendo cotizaciones aprobadas:',
                error.message
            );

            res.status(500).json({
                error:
                    'Error al obtener cotizaciones aprobadas',
                detalle:
                    error.message
            });
        }
    }
);


app.get('/api/cotizaciones/historial/rechazadas',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {

        try {

            const cotizaciones =
                db.prepare(`
                    SELECT
                        c.id_cotizacion,
                        c.codigo_cotizacion,
                        cl.nombre AS cliente,
                        c.tipo_producto,
                        c.cantidad,
                        c.estado,
                        c.fecha_actualizacion,

                        COALESCE(
                            cc.total,
                            0
                        ) AS total

                    FROM cotizacion c

                    INNER JOIN cliente cl
                        ON c.id_cliente = cl.id_cliente

                    LEFT JOIN cotizacion_costos cc
                        ON c.id_cotizacion =
                           cc.id_cotizacion

                    WHERE c.estado = 'Rechazada'

                    ORDER BY
                        c.fecha_actualizacion DESC
                `)
                .all();

            res.json(cotizaciones);

        } catch (error) {

            console.error(
                '❌ Error obteniendo cotizaciones rechazadas:',
                error.message
            );

            res.status(500).json({
                error:
                    'Error al obtener cotizaciones rechazadas',
                detalle:
                    error.message
            });
        }
    }
);

/*
========================================
GET - OBTENER DETALLE DE COTIZACIÓN
========================================
*/
app.get('/api/cotizaciones/:id',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    (req, res) => {

    const idCotizacion = Number(req.params.id);

    console.log(
        '🔎 SE RECIBIÓ GET /api/cotizaciones/:id',
        idCotizacion
    );

    try {

        const cotizacion = db.prepare(`
            SELECT
                c.id_cotizacion,
                c.codigo_cotizacion,

                cl.id_cliente,
                cl.nombre AS cliente,
                cl.telefono,
                cl.correo,

                u.nombres || ' ' || u.apellidos AS usuario,

                c.tipo_producto,
                c.tamaño,
                c.material,
                c.impresion,
                c.color,
                tc.caras,
                c.acabado,
                c.sangrado,
                c.cantidad,
                c.fecha_requerida,
                c.hora_requerida,
                c.observaciones,
                c.estado,
                c.fecha_creacion,
                c.fecha_actualizacion,

                cc.id_costo,
                cc.id_tarifa,
                cc.cantidad_millares,
                cc.costo_produccion,
                cc.mano_obra_diseño,
                cc.total,
                cc.estado_evaluacion,

                tc.precio_millar

            FROM cotizacion c

            INNER JOIN cliente cl
                ON c.id_cliente = cl.id_cliente

            INNER JOIN usuario u
                ON c.id_usuario = u.id_usuario

            LEFT JOIN cotizacion_costos cc
                ON c.id_cotizacion = cc.id_cotizacion

            LEFT JOIN tarifa_cotizacion tc
                ON cc.id_tarifa = tc.id_tarifa

            WHERE c.id_cotizacion = ?
        `).get(idCotizacion);


        if (!cotizacion) {

            return res.status(404).json({
                error: 'Cotización no encontrada'
            });

        }


        console.log(
            `✅ Cotización ${cotizacion.codigo_cotizacion} encontrada`
        );


        res.json(cotizacion);


    } catch (error) {

        console.error(
            '❌ Error al consultar detalle de cotización:',
            error.message
        );


        res.status(500).json({
            error: 'Error al consultar la cotización',
            detalle: error.message
        });

    }

});

/*
========================================
GET - LISTAR TARIFAS
========================================
*/
app.get('/api/tarifas', permitirRoles('administrador', 'cotizador'), (req, res) => {

    try {

        const tarifas = db.prepare(`
            SELECT
                id_tarifa,
                tipo_producto,
                tamaño,
                material,
                tipo_impresion,
                caras,
                precio_millar,
                activo
            FROM tarifa_cotizacion
            WHERE activo = 1
            ORDER BY
                tipo_producto,
                tamaño,
                material,
                tipo_impresion,
                caras
        `).all();

        res.json(tarifas);

    } catch (error) {

        console.error(
            '❌ Error obteniendo tarifas:',
            error.message
        );

        res.status(500).json({
            error: 'No se pudieron obtener las tarifas'
        });

    }

});

// ==========================================
// POST - CREAR CLIENTE
// ==========================================

app.post('/api/clientes',
    permitirRoles('Administrador', 'Cotizador'),
    (req, res) => {

    try {

        const {
            nombre,
            telefono,
            correo
        } = req.body;


        // ==========================================
        // VALIDAR DATOS OBLIGATORIOS
        // ==========================================

        if (!nombre || !telefono || !correo) {

            return res.status(400).json({
                error: 'Faltan datos obligatorios para crear el cliente'
            });

        }


        // ==========================================
        // CREAR CLIENTE
        // ==========================================

        const resultado =
            db.prepare(`
                INSERT INTO cliente (
                    nombre,
                    telefono,
                    correo
                )
                VALUES (?, ?, ?)
            `).run(
                nombre,
                telefono,
                correo
            );


        // ==========================================
        // RESPUESTA
        // ==========================================

        const nuevoCliente =
            db.prepare(`
                SELECT
                    id_cliente,
                    nombre,
                    telefono,
                    correo
                FROM cliente
                WHERE id_cliente = ?
            `).get(
                resultado.lastInsertRowid
            );


        console.log(
            `👤 Cliente ${nuevoCliente.id_cliente} creado correctamente.`
        );


        res.status(201).json({
            mensaje: 'Cliente creado correctamente',
            cliente: nuevoCliente
        });


    } catch (error) {

        console.error(
            '❌ Error al crear cliente:',
            error.message
        );


        res.status(500).json({
            error: 'Error al crear el cliente',
            detalle: error.message
        });

    }

});

 // ==========================================
 // GET - LISTAR CLIENTES
 // ==========================================

 app.get('/api/clientes',
     permitirRoles('administrador', 'cotizador'),
     (req, res) => {

     try {

         const paginaSolicitada =
             Number.parseInt(req.query.pagina, 10) || 1;

         const porPagina = 10;

         const pagina =
             paginaSolicitada < 1
                 ? 1
                 : paginaSolicitada;

         const totalRegistros =
             db.prepare(`
                 SELECT COUNT(*) AS total
                 FROM cliente
             `).get().total;

         const totalPaginas =
             Math.max(
                 1,
                 Math.ceil(totalRegistros / porPagina)
             );

         const paginaFinal =
             Math.min(pagina, totalPaginas);

         const offset =
             (paginaFinal - 1) * porPagina;

         const clientes =
             db.prepare(`
                 SELECT
                     id_cliente,
                     nombre,
                     telefono,
                     correo
                 FROM cliente
                 ORDER BY nombre ASC
                 LIMIT ? OFFSET ?
             `).all(
                 porPagina,
                 offset
             );

         console.log(
             `✅ Página ${paginaFinal}/${totalPaginas} - ` +
             `${clientes.length} clientes`
         );

         res.json({
             clientes,
             pagina: paginaFinal,
             porPagina,
             totalRegistros,
             totalPaginas
         });

     } catch (error) {

         console.error(
             '❌ Error al consultar clientes:',
             error.message
         );

         res.status(500).json({
             error: 'Error al consultar los clientes',
             detalle: error.message
         });

     }

 });

// ==========================================
// POST - CREAR COTIZACIÓN + CLIENTE
// ==========================================

app.post('/api/cotizaciones',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {

    console.log('🔥 SE RECIBIÓ POST /api/cotizaciones');

    try {

        const {
            id_cliente,
            tipo_producto,
            tamaño,
            material,
            impresion,
            color,
            caras,
            acabado,
            sangrado,
            cantidad,
            fecha_requerida,
            hora_requerida,
            observaciones
        } = req.body;


        // ==========================================
        // VALIDAR DATOS OBLIGATORIOS
        // ==========================================

        if (
            !id_cliente ||
            !tipo_producto ||
            !tamaño ||
            !material ||
            !impresion ||
            !color ||
            !caras ||
            !cantidad ||
            !fecha_requerida ||
            !hora_requerida
        ) {

            return res.status(400).json({
                error: 'Faltan datos obligatorios para crear la cotización'
            });

        }

        // ==========================================
        // VALIDAR CANTIDAD POR MILLARES
        // ==========================================

        if (cantidad < 1000 || cantidad % 1000 !== 0) {

            return res.status(400).json({
                error: 'La cantidad debe solicitarse en millares completos.'
            });

        }

            const id_usuario = req.session.user.id;



        // ==========================================
        // GENERAR CÓDIGO DE COTIZACIÓN
        // ==========================================

        const ultimaCotizacion =
            db.prepare(`
                SELECT codigo_cotizacion
                FROM cotizacion
                ORDER BY id_cotizacion DESC
                LIMIT 1
            `).get();


        let siguienteNumero = 1;


        if (ultimaCotizacion) {

            const numeroActual =
                parseInt(
                    ultimaCotizacion.codigo_cotizacion
                        .replace('COT-', ''),
                    10
                );


            if (!isNaN(numeroActual)) {

                siguienteNumero =
                    numeroActual + 1;

            }

        }


        const codigoCotizacion =
            `COT-${String(siguienteNumero).padStart(4, '0')}`;


        const fechaActual =
            fechaHoraLima();


 // ==========================================
// VALIDAR QUE EL CLIENTE EXISTA
// ==========================================

const clienteExistente =
    db.prepare(`
        SELECT
            id_cliente,
            nombre,
            telefono,
            correo
        FROM cliente
        WHERE id_cliente = ?
    `)
    .get(id_cliente);


if (!clienteExistente) {

    return res.status(404).json({
        error: 'El cliente seleccionado no existe'
    });

}


// ==========================================
// CREAR COTIZACIÓN
// ==========================================

const resultadoCotizacion =
    db.prepare(`
        INSERT INTO cotizacion (
            codigo_cotizacion,
            id_cliente,
            id_usuario,
            tipo_producto,
            tamaño,
            material,
            impresion,
            color,
            acabado,
            sangrado,
            cantidad,
            fecha_requerida,
            hora_requerida,
            observaciones,
            estado,
            fecha_creacion,
            fecha_actualizacion
        )
        VALUES (
            @codigo_cotizacion,
            @id_cliente,
            @id_usuario,
            @tipo_producto,
            @tamaño,
            @material,
            @impresion,
            @color,
            @acabado,
            @sangrado,
            @cantidad,
            @fecha_requerida,
            @hora_requerida,
            @observaciones,
            @estado,
            @fecha_creacion,
            @fecha_actualizacion
        )
    `)
    .run({

        codigo_cotizacion:
            codigoCotizacion,

        id_cliente,

        id_usuario,

        tipo_producto,
        tamaño,
        material,
        impresion,
        color,

        acabado:
            acabado || null,

        sangrado:
            sangrado || null,

        cantidad,
        fecha_requerida,
        hora_requerida,

        observaciones:
            observaciones || null,

        estado: 'Pendiente',

        fecha_creacion:
            fechaActual,

        fecha_actualizacion:
            fechaActual

    });


    const idCotizacion =
    resultadoCotizacion.lastInsertRowid;


// ==========================================
// OBTENER TARIFA APLICABLE
// ==========================================

const tarifa =
    db.prepare(`
        SELECT
            id_tarifa,
            precio_millar
        FROM tarifa_cotizacion
        WHERE tipo_producto = ?
          AND tamaño = ?
          AND material = ?
          AND tipo_impresion = ?
          AND caras = ?
          AND activo = 1
        LIMIT 1
    `)
    .get(
        tipo_producto,
        tamaño,
        material,
        impresion,
        caras
    );


if (!tarifa) {

    return res.status(400).json({
        error:
            'No existe una tarifa activa para la combinación seleccionada.'
    });

}


// ==========================================
// CALCULAR COSTOS DE LA COTIZACIÓN
// ==========================================

const cantidadMillares =
    cantidad / 1000;


const costoProduccion =
    Number(tarifa.precio_millar) *
    cantidadMillares;


const manoObraDiseño =
    0;


const total =
    costoProduccion +
    manoObraDiseño;


// ==========================================
// CREAR REGISTRO DE COSTOS
// ==========================================

db.prepare(`
    INSERT INTO cotizacion_costos (
        id_cotizacion,
        id_tarifa,
        cantidad_millares,
        costo_produccion,
        mano_obra_diseño,
        total,
        estado_evaluacion,
        fecha_creacion,
        fecha_actualizacion
    )
    VALUES (
        @id_cotizacion,
        @id_tarifa,
        @cantidad_millares,
        @costo_produccion,
        @mano_obra_diseño,
        @total,
        @estado_evaluacion,
        @fecha_creacion,
        @fecha_actualizacion
    )
`)
.run({

    id_cotizacion:
        idCotizacion,

    id_tarifa:
        tarifa.id_tarifa,

    cantidad_millares:
        cantidadMillares,

    costo_produccion:
        costoProduccion,

    mano_obra_diseño:
        manoObraDiseño,

    total,

    estado_evaluacion:
        'Pendiente',

    fecha_creacion:
        fechaActual,

    fecha_actualizacion:
        fechaActual

});


        // ==========================================
        // OBTENER COTIZACIÓN CREADA
        // ==========================================

        const nuevaCotizacion =
            db.prepare(`
                SELECT
                    c.id_cotizacion,
                    c.codigo_cotizacion,

                    cl.id_cliente,
                    cl.nombre AS cliente,
                    cl.telefono,
                    cl.correo,

                    u.nombres || ' ' || u.apellidos
                        AS usuario,

                    c.tipo_producto,
                    c.tamaño,
                    c.material,
                    c.impresion,
                    c.color,
                    c.acabado,
                    c.sangrado,
                    c.cantidad,
                    c.fecha_requerida,
                    c.hora_requerida,
                    c.observaciones,
                    c.estado,
                    c.fecha_creacion,
                    c.fecha_actualizacion

                FROM cotizacion c

                INNER JOIN cliente cl
                    ON c.id_cliente = cl.id_cliente

                INNER JOIN usuario u
                    ON c.id_usuario = u.id_usuario

                WHERE c.id_cotizacion = ?
            `)
            .get(
                idCotizacion
            );


        console.log(
            `✅ ${codigoCotizacion} creada correctamente.`
        );

        
        res.status(201).json({

            mensaje:
                'Cotización creada correctamente',

            cotizacion:
                nuevaCotizacion

        });


    } catch (error) {

        console.error(
            '❌ Error al crear cliente/cotización:',
            error.message
        );


        res.status(500).json({

            error:
                'Error al crear la cotización',

            detalle:
                error.message

        });

    }

});

// ==========================================
// GET - TRABAJOS DE DISEÑO POR LOGS
// ==========================================

app.get(
    '/api/ordenes-trabajo/historial-disenador',
    permitirRoles('diseñador'),
    (req, res) => {

        try {

            const idUsuario =
                req.session.user.id;

            const ordenes =
                db.prepare(`
                    SELECT DISTINCT
                        ot.id_ot,
                        ot.codigo_ot,
                        ot.id_cotizacion,
                        c.codigo_cotizacion,
                        ot.fecha_requerida,
                        ot.hora_requerida,
                        ot.fecha_actualizacion

                    FROM orden_trabajo ot

                    INNER JOIN cotizacion c
                        ON ot.id_cotizacion =
                           c.id_cotizacion

                    INNER JOIN logs_ot l
                        ON ot.id_ot =
                           l.id_ot

                    WHERE
                        l.id_usuario = ?
                        AND ot.estado = 'Finalizada'

                    ORDER BY
                        ot.fecha_actualizacion DESC
                `)
                .all(idUsuario);

            res.json({
                ordenes
            });

        } catch (error) {

            console.error(
                '❌ Error obteniendo historial del diseñador:',
                error
            );

            res.status(500).json({
                error:
                    'Error interno al obtener historial del diseñador'
            });
        }
    }
);

// ==========================================
// GET - TRABAJOS DE IMPRESIONES POR LOGS
// ==========================================

app.get('/api/ordenes-trabajo/historial-maquinista',
    permitirRoles('maquinista'),
    (req, res) => {

        try {

            const idUsuario =
                req.session.user.id;

            const ordenes =
                db.prepare(`
                    SELECT DISTINCT
                        ot.id_ot,
                        ot.codigo_ot,
                        ot.id_cotizacion,
                        c.codigo_cotizacion,
                        ot.fecha_requerida,
                        ot.hora_requerida,
                        ot.fecha_actualizacion

                    FROM orden_trabajo ot

                    INNER JOIN cotizacion c
                        ON ot.id_cotizacion =
                           c.id_cotizacion

                    INNER JOIN logs_ot l
                        ON ot.id_ot =
                           l.id_ot

                    WHERE
                        l.id_usuario = ?
                        AND ot.estado = 'Finalizada'

                    ORDER BY
                        ot.fecha_actualizacion DESC
                `)
                .all(idUsuario);

            res.json({
                ordenes
            });

        } catch (error) {

            console.error(
                '❌ Error obteniendo historial del maquinista:',
                error
            );

            res.status(500).json({
                error:
                    'Error interno al obtener historial del maquinista'
            });
        }
    }
);

/*
========================================
GET - LISTAR ÓRDENES DE TRABAJO
========================================
*/
app.get('/api/ordenes-trabajo',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    (req, res) => {

    console.log(
        '🔥 SE RECIBIÓ GET /api/ordenes-trabajo'
    );

    try {

        const paginaSolicitada =
            Number.parseInt(req.query.pagina, 10) || 1;

        const porPagina = 10;

        const pagina =
            paginaSolicitada < 1
                ? 1
                : paginaSolicitada;

        // ========================================
        // FILTROS
        // ========================================

        const estado =
            req.query.estado || '';

        const prioridad =
            req.query.prioridad || '';

        const codigoOT =
            req.query.codigo_ot || '';

        const codigoCotizacion =
            req.query.codigo_cotizacion || '';

        let condiciones = [];
        let parametros = [];

const rolUsuario =
    req.session.user.rol.toLowerCase();

if (rolUsuario === 'diseñador') {

    if (estado) {

        condiciones.push(
            'ot.estado = ?'
        );

        parametros.push(estado);

    } else {

        condiciones.push(
            "ot.estado IN ('Pendiente', 'En Diseño')"
        );

    }

} else if (rolUsuario === 'maquinista') {

    if (estado) {

        condiciones.push(
            'ot.estado = ?'
        );

        parametros.push(estado);

    } else {

        condiciones.push(
            "ot.estado = 'En Impresión'"
        );

    }

} else if (estado) {

    condiciones.push(
        'ot.estado = ?'
    );

    parametros.push(estado);

} else {

    condiciones.push(
        "ot.estado NOT IN ('Finalizada', 'En Revisión')"
    );

}

if (prioridad) {

    condiciones.push(
        'ot.prioridad = ?'
    );

    parametros.push(prioridad);

}

if (codigoOT) {

    condiciones.push(
        'ot.codigo_ot LIKE ?'
    );

    parametros.push(
        `%OT-${codigoOT.padStart(4, '0')}%`
    );

}

if (codigoCotizacion) {

    condiciones.push(
        'c.codigo_cotizacion LIKE ?'
    );

    parametros.push(
        `%COT-${codigoCotizacion.padStart(4, '0')}%`
    );

}

        const where =
            condiciones.length > 0
                ? `WHERE ${condiciones.join(' AND ')}`
                : '';

        // ========================================
        // TOTAL DE REGISTROS FILTRADOS
        // ========================================

        const totalRegistros =
            db.prepare(`
                SELECT COUNT(*) AS total
                FROM orden_trabajo ot

                INNER JOIN cotizacion c
                    ON ot.id_cotizacion =
                    c.id_cotizacion

                ${where}
            `).get(
                ...parametros
            ).total;

        const totalPaginas =
            Math.max(
                1,
                Math.ceil(
                    totalRegistros /
                    porPagina
                )
            );

        const paginaFinal =
            Math.min(
                pagina,
                totalPaginas
            );

        const offset =
            (paginaFinal - 1) *
            porPagina;

        // ========================================
        // CONSULTAR ÓRDENES
        // ========================================

        const ordenes =
            db.prepare(`
                SELECT
                    ot.id_ot,
                    ot.codigo_ot,
                    ot.id_cotizacion,
                    c.codigo_cotizacion,
                    cl.nombre AS cliente,
                    c.tipo_producto,
                    c.cantidad,
                    ot.estado,
                    ot.prioridad,
                    ot.fecha_requerida,
                    ot.hora_requerida,
                    ot.fecha_creacion,
                    ot.fecha_actualizacion
                FROM orden_trabajo ot
                INNER JOIN cotizacion c
                    ON ot.id_cotizacion =
                       c.id_cotizacion
                INNER JOIN cliente cl
                    ON c.id_cliente =
                       cl.id_cliente

                ${where}

                ORDER BY ot.id_ot

                LIMIT ? OFFSET ?
            `).all(
                ...parametros,
                porPagina,
                offset
            );

        console.log(
            `✅ Página ${paginaFinal}/${totalPaginas} - ` +
            `${ordenes.length} órdenes`
        );

        res.json({

            ordenes,

            pagina:
                paginaFinal,

            porPagina,

            totalRegistros,

            totalPaginas

        });

    } catch (error) {

        console.error(
            '❌ Error al consultar órdenes de trabajo:',
            error.message
        );

        res.status(500).json({

            error:
                'Error al consultar las órdenes de trabajo',

            detalle:
                error.message

        });

    }

});

// ========================================
// GET - OBTENER OT POR ID
// ========================================

app.get('/api/ordenes-trabajo/:id',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    (req, res) => {

    try {

        const ot =
    db.prepare(`
        SELECT
            id_ot,
            codigo_ot,
            id_cotizacion,
            estado,
            prioridad,
            fecha_requerida,
            hora_requerida
        FROM orden_trabajo
        WHERE id_ot = ?
    `)
    .get(req.params.id);

        if (!ot) {

            return res.status(404).json({
                error:
                    'Orden de trabajo no encontrada'
            });

        }

        res.json(ot);

    } catch (error) {

        console.error(
            '❌ Error obteniendo OT:',
            error.message
        );

        res.status(500).json({
            error:
                'Error al obtener la orden de trabajo',
            detalle:
                error.message
        });

    }

});

/*
========================================
PATCH - APROBAR COTIZACIÓN Y CREAR OT
========================================
*/
app.patch('/api/cotizaciones/:id/aprobar',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {
    const idCotizacion = Number(req.params.id);
    const idUsuario = req.session.user.id;

    try {

        const cotizacion = db.prepare(`
            SELECT *
            FROM cotizacion
            WHERE id_cotizacion = ?
        `).get(idCotizacion);

        if (!cotizacion) {
            return res.status(404).json({
                error: 'Cotización no encontrada'
            });
        }

        // No permitir aprobar una cotización ya aprobada
        if (cotizacion.estado === 'Aprobada') {
            return res.status(400).json({
                error: 'La cotización ya está aprobada'
            });
        }

        // Una cotización rechazada debe permanecer rechazada
        if (cotizacion.estado === 'Rechazada') {
            return res.status(400).json({
                error: 'Una cotización rechazada no puede ser aprobada'
            });
        }

        // Verificar que todavía no exista una OT para esta cotización
        const otExistente = db.prepare(`
            SELECT id_ot, codigo_ot
            FROM orden_trabajo
            WHERE id_cotizacion = ?
        `).get(idCotizacion);

        if (otExistente) {
            return res.status(400).json({
                error: `La cotización ya tiene asociada la OT ${otExistente.codigo_ot}`
            });
        }

        // Calcular prioridad automáticamente
        const prioridad = calcularPrioridad(
            cotizacion.fecha_requerida,
            cotizacion.hora_requerida
        );

        const fechaActual = fechaHoraLima();

        const resultado = db.transaction(() => {

            // 1. Aprobar cotización
            db.prepare(`
                UPDATE cotizacion
                SET estado = 'Aprobada',
                    fecha_actualizacion = ?
                WHERE id_cotizacion = ?
            `).run(
                fechaActual,
                idCotizacion
            );

            // 2. Generar código de OT
            const ultimaOT = db.prepare(`
                SELECT codigo_ot
                FROM orden_trabajo
                ORDER BY id_ot DESC
                LIMIT 1
            `).get();

            let numeroOT = 1;

            if (ultimaOT) {
                const numeroActual = parseInt(
                    ultimaOT.codigo_ot.replace('OT-', ''),
                    10
                );

                if (!isNaN(numeroActual)) {
                    numeroOT = numeroActual + 1;
                }
            }

            const codigoOT =
                `OT-${String(numeroOT).padStart(4, '0')}`;

            // 3. Crear OT
            const resultadoOT = db.prepare(`
                INSERT INTO orden_trabajo (
                    codigo_ot,
                    id_cotizacion,
                    estado,
                    prioridad,
                    fecha_requerida,
                    hora_requerida,
                    fecha_creacion,
                    fecha_actualizacion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                codigoOT,
                idCotizacion,
                'Pendiente',
                prioridad,
                cotizacion.fecha_requerida,
                cotizacion.hora_requerida,
                fechaActual,
                fechaActual
            );

            // 4. Registrar creación de OT
            registrarLog(
                resultadoOT.lastInsertRowid,
                idUsuario,
                'OT_CREADA',
                null,
                'Pendiente',
                `Generada desde ${cotizacion.codigo_cotizacion}`
            );

            return {
                idOT: resultadoOT.lastInsertRowid,
                codigoOT
            };
        })();

        res.json({
            mensaje: 'Cotización aprobada y OT creada correctamente',
            id_cotizacion: idCotizacion,
            id_ot: resultado.idOT,
            codigo_ot: resultado.codigoOT,
            prioridad
        });

    } catch (error) {

        console.error(
            '❌ Error al aprobar cotización:',
            error
        );

        res.status(500).json({
            error: 'Error al aprobar cotización y crear OT',
            detalle: error.message
        });
    }
});

// ========================================
// PATCH - RECHAZAR COTIZACIÓN
// ========================================

app.patch('/api/cotizaciones/:id/rechazar',
    permitirRoles('administrador', 'cotizador'),
    (req, res) => {

    const idCotizacion = Number(req.params.id);

    try {

        const cotizacion = db.prepare(`
            SELECT
                id_cotizacion,
                codigo_cotizacion,
                estado
            FROM cotizacion
            WHERE id_cotizacion = ?
        `).get(idCotizacion);

        if (!cotizacion) {
            return res.status(404).json({
                error: 'Cotización no encontrada'
            });
        }

        if (cotizacion.estado === 'Aprobada') {
            return res.status(400).json({
                error: 'Una cotización aprobada no puede ser rechazada'
            });
        }

        if (cotizacion.estado === 'Rechazada') {
            return res.status(400).json({
                error: 'La cotización ya está rechazada'
            });
        }

        const fechaActual = fechaHoraLima();

        db.prepare(`
            UPDATE cotizacion
            SET estado = 'Rechazada',
                fecha_actualizacion = ?
            WHERE id_cotizacion = ?
        `).run(
            fechaActual,
            idCotizacion
        );

        console.log(
            `❌ ${cotizacion.codigo_cotizacion} rechazada correctamente.`
        );

        res.json({
            mensaje: 'Cotización rechazada correctamente',
            id_cotizacion: idCotizacion,
            codigo_cotizacion: cotizacion.codigo_cotizacion,
            estado: 'Rechazada'
        });

    } catch (error) {

        console.error(
            '❌ Error al rechazar cotización:',
            error
        );

        res.status(500).json({
            error: 'Error al rechazar cotización',
            detalle: error.message
        });
    }
});

/*
========================================
GET - LOGS DE UNA ORDEN DE TRABAJO
========================================
*/
app.get('/api/ordenes-trabajo/:id/logs',
    permitirRoles('administrador'),
    (req, res) => {

    const idOT = req.params.id;

    console.log(`🔥 Consultando logs de OT ${idOT}`);

    try {

        // Verificar que la OT exista
        const ot = db.prepare(`
            SELECT
                id_ot,
                codigo_ot
            FROM orden_trabajo
            WHERE id_ot = ?
        `).get(idOT);

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        // Obtener únicamente los logs de esta OT
        const logs = db.prepare(`
            SELECT
                l.id_logs,
                l.id_ot,
                ot.codigo_ot,
                l.id_usuario,
                u.usuario,
                l.tipo_evento,
                l.estado_anterior,
                l.estado_nuevo,
                l.detalle_evento,
                l.fecha_hora
            FROM logs_ot l
            INNER JOIN orden_trabajo ot
                ON l.id_ot = ot.id_ot
            INNER JOIN usuario u
                ON l.id_usuario = u.id_usuario
            WHERE l.id_ot = ?
            ORDER BY l.fecha_hora ASC, l.id_logs ASC
        `).all(idOT);

        console.log(
            `✅ Logs encontrados para ${ot.codigo_ot}:`,
            logs.length
        );

        res.json({
            orden_trabajo: ot,
            logs: logs
        });

    } catch (error) {

        console.error(
            '❌ Error al consultar logs:',
            error.message
        );

        res.status(500).json({
            error: 'Error al consultar los logs de la orden de trabajo',
            detalle: error.message
        });

    }

});

/*
========================================
POST - REGISTRAR DISEÑO EN UNA OT
========================================
*/
app.post('/api/ordenes-trabajo/:id/diseno',
    permitirRoles('diseñador'),
    (req, res) => {

    const idOT = req.params.id;

    const {
    nombre_diseño,
    descripcion,
    archivo_diseño
    } = req.body;

    const id_usuario = req.session.user.id;

    console.log(`🔥 Registrando diseño para OT ${idOT}`);

    try {

        // Verificar que la OT exista
        const ot = db.prepare(`
            SELECT
                id_ot,
                codigo_ot,
                estado
            FROM orden_trabajo
            WHERE id_ot = ?
        `).get(idOT);

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        // Validar campos obligatorios
        if (!nombre_diseño || !archivo_diseño) {
            return res.status(400).json({
                error: 'nombre_diseño y archivo_diseño son obligatorios'
            });
        }

        // Verificar que el usuario exista
        const usuario = db.prepare(`
            SELECT id_usuario, usuario
            FROM usuario
            WHERE id_usuario = ?
        `).get(id_usuario);

        if (!usuario) {
            return res.status(400).json({
                error: 'El usuario indicado no existe'
            });
        }

        // Registrar el diseño
        const resultado = db.prepare(`
            INSERT INTO diseño (
                id_ot,
                nombre_diseño,
                descripcion,
                archivo_diseño,
                fecha_carga
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            idOT,
            nombre_diseño,
            descripcion || null,
            archivo_diseño,
            fechaHoraLima()
        );

        // Registrar evento en el historial de la OT
            registrarLog(
                idOT,
                id_usuario,
                'DISEÑO_CARGADO',
                null,
                null,
                `${nombre_diseño} - ${archivo_diseño}`
            );

        // Obtener el diseño recién creado
        const nuevoDiseño = db.prepare(`
            SELECT
                d.id_diseño,
                d.id_ot,
                ot.codigo_ot,
                d.nombre_diseño,
                d.descripcion,
                d.archivo_diseño,
                d.fecha_carga
            FROM diseño d
            INNER JOIN orden_trabajo ot
                ON d.id_ot = ot.id_ot
            WHERE d.id_diseño = ?
        `).get(resultado.lastInsertRowid);

        res.status(201).json({
            mensaje: 'Diseño registrado correctamente',
            diseño: nuevoDiseño
        });

    } catch (error) {

        console.error(
            '❌ Error al registrar diseño:',
            error.message
        );

        res.status(500).json({
            error: 'Error al registrar el diseño',
            detalle: error.message
        });

    }

});

/*
========================================
GET - DISEÑOS DE UNA OT
========================================
*/
app.get('/api/ordenes-trabajo/:id/disenos',
    permitirRoles('administrador', 'diseñador', 'maquinista', 'cotizador'),
    (req, res) => {

    const idOT = req.params.id;

    console.log(`🔥 Consultando diseños de OT ${idOT}`);

    try {

        const ot = db.prepare(`
            SELECT
                id_ot,
                codigo_ot
            FROM orden_trabajo
            WHERE id_ot = ?
        `).get(idOT);

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        const diseños = db.prepare(`
            SELECT
                d.id_diseño,
                d.id_ot,
                ot.codigo_ot,
                d.nombre_diseño,
                d.descripcion,
                d.archivo_diseño,
                d.fecha_carga
            FROM diseño d
            INNER JOIN orden_trabajo ot
                ON d.id_ot = ot.id_ot
            WHERE d.id_ot = ?
            ORDER BY d.fecha_carga ASC, d.id_diseño ASC
        `).all(idOT);

        res.json({
            orden_trabajo: ot,
            diseños: diseños
        });

    } catch (error) {

        console.error(
            '❌ Error al consultar diseños:',
            error.message
        );

        res.status(500).json({
            error: 'Error al consultar los diseños',
            detalle: error.message
        });

    }

});

/*
========================================
POST - REGISTRAR IMPRESIÓN EN UNA OT
========================================
*/
app.post('/api/ordenes-trabajo/:id/impresion',
    permitirRoles('administrador', 'maquinista'),
    (req, res) => {

    const idOT = req.params.id;

    const {
    id_diseño,
    codigo_maquina,
    cantidad_impresa,
    observaciones
    } = req.body;

    const id_usuario = req.session.user.id;

    console.log('🖨️ Datos impresión recibidos:', {
    id_diseño,
    codigo_maquina,
    cantidad_impresa,
    observaciones,
    id_usuario
});

    console.log(`🔥 Registrando impresión para OT ${idOT}`);

    try {

        // Verificar que la OT exista
        const ot = db.prepare(`
            SELECT
                id_ot,
                codigo_ot,
                estado
            FROM orden_trabajo
            WHERE id_ot = ?
        `).get(idOT);

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        // Validar campos obligatorios
        if (
            !id_diseño ||
            !codigo_maquina ||
            !cantidad_impresa
        ) {
            return res.status(400).json({
                error: 'id_diseño, codigo_maquina y cantidad_impresa son obligatorios'
            });
        }

        // Verificar que el diseño exista y pertenezca a esta OT
        const diseño = db.prepare(`
            SELECT
                id_diseño,
                id_ot,
                nombre_diseño,
                archivo_diseño
            FROM diseño
            WHERE id_diseño = ?
              AND id_ot = ?
        `).get(id_diseño, idOT);

        if (!diseño) {
            return res.status(400).json({
                error: 'El diseño no existe o no pertenece a esta OT'
            });
        }

        // Verificar que el usuario exista
        const usuario = db.prepare(`
            SELECT
                id_usuario,
                usuario
            FROM usuario
            WHERE id_usuario = ?
        `).get(id_usuario);

        if (!usuario) {
            return res.status(400).json({
                error: 'El usuario indicado no existe'
            });
        }

        // Registrar impresión
        const resultado = db.prepare(`
                INSERT INTO impresion (
                    id_ot,
                    id_diseño,
                    id_usuario,
                    codigo_maquina,
                    cantidad_impresa,
                    observaciones,
                    fecha_impresion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                idOT,
                id_diseño,
                id_usuario,
                codigo_maquina,
                cantidad_impresa,
                observaciones || null,
                fechaHoraLima()
            );

        // Registrar evento en el historial de la OT
            registrarLog(
                idOT,
                id_usuario,
                'IMPRESION_REGISTRADA',
                null,
                null,
                `${cantidad_impresa} unidades - ${codigo_maquina}`
            );

        // Obtener la impresión recién creada
        const nuevaImpresion = db.prepare(`
            SELECT
                i.id_impresion,
                i.id_ot,
                ot.codigo_ot,
                i.id_diseño,
                d.nombre_diseño,
                i.id_usuario,
                u.usuario,
                i.codigo_maquina,
                i.cantidad_impresa,
                i.fecha_impresion,
                i.observaciones
            FROM impresion i
            INNER JOIN orden_trabajo ot
                ON i.id_ot = ot.id_ot
            INNER JOIN diseño d
                ON i.id_diseño = d.id_diseño
            INNER JOIN usuario u
                ON i.id_usuario = u.id_usuario
            WHERE i.id_impresion = ?
        `).get(resultado.lastInsertRowid);

        res.status(201).json({
            mensaje: 'Impresión registrada correctamente',
            impresion: nuevaImpresion
        });

    } catch (error) {

        console.error(
            '❌ Error al registrar impresión:',
            error.message
        );

        res.status(500).json({
            error: 'Error al registrar la impresión',
            detalle: error.message
        });

    }

});

/*
========================================
GET - IMPRESIONES DE UNA OT
========================================
*/
app.get('/api/ordenes-trabajo/:id/impresiones',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    (req, res) => {

    const idOT = req.params.id;

    console.log(`🔥 Consultando impresiones de OT ${idOT}`);

    try {

        const ot = db.prepare(`
            SELECT
                id_ot,
                codigo_ot
            FROM orden_trabajo
            WHERE id_ot = ?
        `).get(idOT);

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        const impresiones = db.prepare(`
            SELECT
                i.id_impresion,
                i.id_ot,
                ot.codigo_ot,
                i.id_diseño,
                d.nombre_diseño,
                i.id_usuario,
                u.usuario,
                i.codigo_maquina,
                i.cantidad_impresa,
                i.fecha_impresion,
                i.observaciones
            FROM impresion i
            INNER JOIN orden_trabajo ot
                ON i.id_ot = ot.id_ot
            INNER JOIN diseño d
                ON i.id_diseño = d.id_diseño
            INNER JOIN usuario u
                ON i.id_usuario = u.id_usuario
            WHERE i.id_ot = ?
            ORDER BY i.fecha_impresion ASC, i.id_impresion ASC
        `).all(idOT);

        console.log(
            `✅ Impresiones encontradas para ${ot.codigo_ot}:`,
            impresiones.length
        );

        res.json({
            orden_trabajo: ot,
            impresiones: impresiones
        });

    } catch (error) {

        console.error(
            '❌ Error al consultar impresiones:',
            error.message
        );

        res.status(500).json({
            error: 'Error al consultar las impresiones',
            detalle: error.message
        });

    }

});

/*
========================================
PATCH - ACTUALIZAR ESTADO DE OT
========================================
*/
app.patch('/api/ordenes-trabajo/:id/estado',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    (req, res) => {

    const idOT = req.params.id;
    const { estado_nuevo } = req.body;
    const id_usuario = req.session.user.id;

    console.log(`🔥 Actualizando estado de OT ${idOT}`);
    console.log(`➡️ Nuevo estado solicitado: ${estado_nuevo}`);
    console.log('🔎 Backend recibió estado_nuevo:', estado_nuevo);

    try {

        const ot = db.prepare(`
            SELECT *
            FROM orden_trabajo
            WHERE id_ot = ?
        `).get(idOT);

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        const estadosPermitidos = [
            'Pendiente',
            'En Diseño',
            'En Impresión',
            'En Revisión',
            'Finalizada'
        ];

        // Validar nuevo estado
        if (
            !estado_nuevo ||
            !estadosPermitidos.includes(estado_nuevo)
        ) {
            return res.status(400).json({
                error: 'Estado no válido',
                estado_recibido: estado_nuevo,
                estados_permitidos: estadosPermitidos
            });
        }

        const rolUsuario =
            req.session.user.rol.toLowerCase();

let transicionValida = false;

if (rolUsuario === 'administrador') {

    const siguienteEstado = {
        'Pendiente': 'En Diseño',
        'En Diseño': 'En Impresión',
        'En Impresión': 'En Revisión'
    };

    if (siguienteEstado[ot.estado] === estado_nuevo) {
        transicionValida = true;
    }

    if (
        ot.estado === 'En Revisión' &&
        (
            estado_nuevo === 'Finalizada' ||
            estado_nuevo === 'En Diseño' ||
            estado_nuevo === 'En Impresión'
        )
    ) {
        transicionValida = true;
    }
}

if (rolUsuario === 'diseñador') {

    if (
        ot.estado === 'Pendiente' &&
        estado_nuevo === 'En Diseño'
    ) {
        transicionValida = true;
    }

    if (
        ot.estado === 'En Diseño' &&
        estado_nuevo === 'En Impresión'
    ) {
        transicionValida = true;
    }
}

if (rolUsuario === 'maquinista') {

    if (
        ot.estado === 'En Impresión' &&
        estado_nuevo === 'En Revisión'
    ) {
        transicionValida = true;
    }
}

if (rolUsuario === 'cotizador') {

    if (
        ot.estado === 'En Revisión' &&
        (
            estado_nuevo === 'Finalizada' ||
            estado_nuevo === 'En Diseño' ||
            estado_nuevo === 'En Impresión'
        )
    ) {
        transicionValida = true;
    }
}

        if (ot.estado === estado_nuevo) {
            return res.status(400).json({
                error: 'La OT ya se encuentra en ese estado',
                estado_actual: ot.estado
            });
        }

        if (!transicionValida) {
            return res.status(400).json({
                error: 'Transición de estado no permitida',
                estado_actual: ot.estado,
                estado_solicitado: estado_nuevo
            });
        }

        const estadoAnterior = ot.estado;

        db.prepare(`
            UPDATE orden_trabajo
            SET estado = ?,
                fecha_actualizacion = ?
            WHERE id_ot = ?
        `).run(
            estado_nuevo,
            fechaHoraLima(),
            idOT
        );

        registrarLog(
            idOT,
            id_usuario,
            'ESTADO_CAMBIADO',
            estadoAnterior,
            estado_nuevo,
            `La OT cambió de ${estadoAnterior} a ${estado_nuevo}`
        );

        const otActualizada = db.prepare(`
            SELECT
                id_ot,
                codigo_ot,
                id_cotizacion,
                estado,
                prioridad,
                fecha_requerida,
                hora_requerida,
                fecha_creacion,
                fecha_actualizacion
            FROM orden_trabajo
            WHERE id_ot = ?
        `).get(idOT);

        res.json({
            mensaje: 'Estado de la OT actualizado correctamente',
            orden_trabajo: otActualizada
        });

    } catch (error) {

        console.error(
            '❌ Error actualizando estado de OT:',
            error
        );

        res.status(500).json({
            error: 'Error interno al actualizar el estado de la OT'
        });
    }
});

/*
========================================
INICIAR SERVIDOR
========================================
*/

app.listen(PORT, () => {

    console.log('========================================');
    console.log('SERVIDOR EXPRESS');
    console.log('========================================');
    console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
    console.log('✅ SQLite conectado mediante better-sqlite3');
    console.log('========================================');

});

actualizarPrioridades();

setInterval(actualizarPrioridades, 60 * 1000);