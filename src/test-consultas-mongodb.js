
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const conectarMongoDB = require('./mongodb');

const Usuario = require('./models/Usuario');
const Cliente = require('./models/Cliente');
const Tarifa = require('./models/Tarifa');
const Cotizacion = require('./models/Cotizacion');
const OrdenTrabajo = require('./models/OrdenTrabajo');
const Contador = require('./models/Contador');
const mongoose = require('mongoose');
const Diseno = require('./models/Diseno');

const app = express();
const PORT = 3002;

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET ||
        'solo-pruebas-locales-cambiar-antes-de-desplegar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 8 * 60 * 60 * 1000
    }
}));

// ==========================================
// MODELO - LOGS DE ÓRDENES DE TRABAJO
// ==========================================

const LogOT = mongoose.model(
    'LogOT',
    new mongoose.Schema(
        {
            id_logs: Number,
            id_ot: Number,
            id_usuario: Number,
            tipo_evento: String,
            estado_anterior: String,
            estado_nuevo: String,
            detalle_evento: String,
            fecha_hora: String
        },
        {
            collection: 'logs_ot'
        }
    )
);

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

function permitirRoles(...roles) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({
                error: 'Debes iniciar sesión'
            });
        }

        if (!roles.includes(req.session.user.rol.toLowerCase())) {
            return res.status(403).json({
                error: 'No tienes permisos'
            });
        }

        next();
    };
}

app.post('/api/login', async (req, res) => {
    try {
        const { usuario, contraseña } = req.body || {};

        if (typeof usuario !== 'string' ||
            typeof contraseña !== 'string' ||
            !usuario.trim() || !contraseña) {
            return res.status(400).json({
                error: 'Usuario y contraseña son obligatorios'
            });
        }

        const user = await Usuario.findOne({
            usuario: usuario.trim()
        }).select('+contraseña');

        if (!user || !user.estado ||
            !await bcrypt.compare(contraseña, user.contraseña)) {
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
        console.error(error.message);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.get('/api/dashboard',
    permitirRoles('administrador'),
    async (req, res) => {
        try {
            const [
                totalCotizaciones,
                totalOT,
                totalPrioritarias,
                totalRetrasadas
            ] = await Promise.all([
                Cotizacion.countDocuments(),
                OrdenTrabajo.countDocuments(),
                OrdenTrabajo.countDocuments({
                    prioridad: 'Prioritaria'
                }),
                OrdenTrabajo.countDocuments({
                    prioridad: 'Retrasada'
                })
            ]);

            res.json({
                totalCotizaciones,
                totalOT,
                totalPrioritarias,
                totalRetrasadas
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

app.get('/api/clientes',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {
        try {
            const paginaSolicitada =
                Number.parseInt(req.query.pagina, 10) || 1;

            const porPagina = 10;
            const pagina = Math.max(1, paginaSolicitada);

            const totalRegistros = await Cliente.countDocuments();
            const totalPaginas = Math.max(
                1,
                Math.ceil(totalRegistros / porPagina)
            );

            const paginaFinal = Math.min(pagina, totalPaginas);
            const offset = (paginaFinal - 1) * porPagina;

            const clientes = await Cliente.find(
                {},
                'id_cliente nombre telefono correo -_id'
            )
                .sort({ nombre: 1, id_cliente: 1 })
                .skip(offset)
                .limit(porPagina)
                .lean();

            res.json({
                clientes,
                pagina: paginaFinal,
                porPagina,
                totalRegistros,
                totalPaginas
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

app.get('/api/tarifas',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {
        try {
            const tarifas = await Tarifa.find(
                { activo: true },
                'id_tarifa tipo_producto tamaño material tipo_impresion caras precio_millar activo -_id'
            )
                .sort({
                    tipo_producto: 1,
                    tamaño: 1,
                    material: 1,
                    tipo_impresion: 1,
                    caras: 1
                })
                .lean();

            res.json(tarifas.map(t => ({
                ...t,
                activo: t.activo ? 1 : 0
            })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

app.post('/api/clientes',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {
        try {
            const { nombre, telefono, correo } = req.body;

            if (
                typeof nombre !== 'string' ||
                typeof telefono !== 'string' ||
                typeof correo !== 'string' ||
                !nombre.trim() ||
                !telefono.trim() ||
                !correo.trim()
            ) {
                return res.status(400).json({
                    error: 'Faltan datos obligatorios para crear el cliente'
                });
            }

            const contador = await Contador.findOneAndUpdate(
                { _id: 'cliente' },
                { $inc: { secuencia: 1 } },
                { returnDocument: 'after' }
            );

            if (!contador) {
                return res.status(500).json({
                    error: 'El contador de clientes no está inicializado'
                });
            }

            const nuevoCliente = await Cliente.create({
                id_cliente: contador.secuencia,
                nombre: nombre.trim(),
                telefono: telefono.trim(),
                correo: correo.trim()
            });

            console.log(
                `👤 Cliente ${nuevoCliente.id_cliente} creado en MongoDB`
            );

            res.status(201).json({
                mensaje: 'Cliente creado correctamente',
                cliente: {
                    id_cliente: nuevoCliente.id_cliente,
                    nombre: nuevoCliente.nombre,
                    telefono: nuevoCliente.telefono,
                    correo: nuevoCliente.correo
                }
            });

        } catch (error) {
            console.error(
                '❌ Error al crear cliente:',
                error.message
            );

            res.status(500).json({
                error: 'Error al crear el cliente'
            });
        }
    }
);

app.get('/api/cotizaciones',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    async (req, res) => {
        try {
            const paginaSolicitada =
                Number.parseInt(req.query.pagina, 10) || 1;

            const porPagina = 10;
            const pagina = Math.max(1, paginaSolicitada);

            const totalRegistros =
                await Cotizacion.countDocuments();

            const totalPaginas = Math.max(
                1,
                Math.ceil(totalRegistros / porPagina)
            );

            const paginaFinal = Math.min(pagina, totalPaginas);
            const offset = (paginaFinal - 1) * porPagina;

            const registros = await Cotizacion.find()
                .sort({ id_cotizacion: 1 })
                .skip(offset)
                .limit(porPagina)
                .lean();

            const [clientes, usuarios] = await Promise.all([
                Cliente.find({
                    id_cliente: {
                        $in: registros.map(c => c.id_cliente)
                    }
                }).lean(),
                Usuario.find({
                    id_usuario: {
                        $in: registros.map(c => c.id_usuario)
                    }
                }).lean()
            ]);

            const mapaClientes = new Map(
                clientes.map(c => [c.id_cliente, c])
            );

            const mapaUsuarios = new Map(
                usuarios.map(u => [u.id_usuario, u])
            );

            const cotizaciones = registros
                .filter(c =>
                    mapaClientes.has(c.id_cliente) &&
                    mapaUsuarios.has(c.id_usuario)
                )
                .map(c => {
                    const cliente = mapaClientes.get(c.id_cliente);
                    const usuario = mapaUsuarios.get(c.id_usuario);

                    return {
                        id_cotizacion: c.id_cotizacion,
                        codigo_cotizacion: c.codigo_cotizacion,
                        cliente: cliente.nombre,
                        usuario: `${usuario.nombres} ${usuario.apellidos}`,
                        tipo_producto: c.tipo_producto,
                        tamaño: c.tamaño,
                        material: c.material,
                        impresion: c.impresion,
                        color: c.color,
                        acabado: c.acabado,
                        sangrado: c.sangrado,
                        cantidad: c.cantidad,
                        fecha_requerida: c.fecha_requerida,
                        hora_requerida: c.hora_requerida,
                        observaciones: c.observaciones,
                        estado: c.estado,
                        fecha_creacion: c.fecha_creacion,
                        fecha_actualizacion: c.fecha_actualizacion
                    };
                });

            res.json({
                cotizaciones,
                pagina: paginaFinal,
                porPagina,
                totalRegistros,
                totalPaginas
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Error al consultar las cotizaciones',
                detalle: error.message
            });
        }
    }
);

app.get('/api/ordenes-trabajo/:id/disenos',
    permitirRoles('administrador', 'diseñador', 'maquinista', 'cotizador'),
    async (req, res) => {

    const idOT = Number(req.params.id);

    try {
        const ot = await OrdenTrabajo.findOne({
            id_ot: idOT
        }).select('id_ot codigo_ot -_id').lean();

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        const diseños = await Diseno.aggregate([
            { $match: { id_ot: idOT } },
            {
                $lookup: {
                    from: OrdenTrabajo.collection.name,
                    localField: 'id_ot',
                    foreignField: 'id_ot',
                    as: 'ot'
                }
            },
            { $unwind: '$ot' },
            { $sort: { fecha_carga: 1, id_diseño: 1 } },
            {
                $project: {
                    _id: 0,
                    id_diseño: 1,
                    id_ot: 1,
                    codigo_ot: '$ot.codigo_ot',
                    nombre_diseño: 1,
                    descripcion: 1,
                    archivo_diseño: 1,
                    fecha_carga: 1
                }
            }
        ]);

        res.json({
            orden_trabajo: ot,
            diseños
        });

    } catch (error) {
        console.error('❌ Error al consultar diseños:', error.message);

        res.status(500).json({
            error: 'Error al consultar los diseños',
            detalle: error.message
        });
    }
});

app.post('/api/ordenes-trabajo/:id/diseno',
    permitirRoles('diseñador'),
    async (req, res) => {

    const idOT = Number(req.params.id);

    const {
        nombre_diseño,
        descripcion,
        archivo_diseño
    } = req.body;

    const id_usuario = req.session.user.id;

    try {
        const ot = await OrdenTrabajo.findOne({
            id_ot: idOT
        }).select('id_ot codigo_ot estado -_id').lean();

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        if (!nombre_diseño || !archivo_diseño) {
            return res.status(400).json({
                error: 'nombre_diseño y archivo_diseño son obligatorios'
            });
        }

        const usuario = await Usuario.findOne({
            id_usuario
        }).select('id_usuario usuario -_id').lean();

        if (!usuario) {
            return res.status(400).json({
                error: 'El usuario indicado no existe'
            });
        }

        const contadorDiseño = await Contador.findOneAndUpdate(
            { _id: 'diseno' },
            { $inc: { secuencia: 1 } },
            { returnDocument: 'after' }
        );

        if (!contadorDiseño) {
            throw new Error('Contador de diseños no inicializado');
        }

        const nuevo = await Diseno.create({
            id_diseño: contadorDiseño.secuencia,
            id_ot: idOT,
            nombre_diseño,
            descripcion: descripcion || null,
            archivo_diseño,
            fecha_carga: fechaHoraLima()
        });

        const contadorLog = await Contador.findOneAndUpdate(
            { _id: 'log_ot' },
            { $inc: { secuencia: 1 } },
            { returnDocument: 'after' }
        );

        if (!contadorLog) {
            throw new Error('Contador de logs no inicializado');
        }

        await LogOT.create({
            id_logs: contadorLog.secuencia,
            id_ot: idOT,
            id_usuario,
            tipo_evento: 'DISEÑO_CARGADO',
            estado_anterior: null,
            estado_nuevo: null,
            detalle_evento: `${nombre_diseño} - ${archivo_diseño}`,
            fecha_hora: fechaHoraLima()
        });

        res.status(201).json({
            mensaje: 'Diseño registrado correctamente',
            diseño: {
                id_diseño: nuevo.id_diseño,
                id_ot: nuevo.id_ot,
                codigo_ot: ot.codigo_ot,
                nombre_diseño: nuevo.nombre_diseño,
                descripcion: nuevo.descripcion,
                archivo_diseño: nuevo.archivo_diseño,
                fecha_carga: nuevo.fecha_carga
            }
        });

    } catch (error) {
        console.error('❌ Error al registrar diseño:', error.message);

        res.status(500).json({
            error: 'Error al registrar el diseño',
            detalle: error.message
        });
    }
});

/*
========================================
GET - OBTENER OT POR ID
========================================
*/
app.get('/api/ordenes-trabajo/:id',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    async (req, res) => {

    try {

        const ot = await OrdenTrabajo.findOne({
            id_ot: Number(req.params.id)
        })
        .select(
            'id_ot codigo_ot id_cotizacion estado ' +
            'prioridad fecha_requerida hora_requerida -_id'
        )
        .lean();

        if (!ot) {

            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });

        }

        res.json(ot);

    } catch (error) {

        console.error(
            '❌ Error obteniendo OT:',
            error.message
        );

        res.status(500).json({
            error: 'Error al obtener la orden de trabajo',
            detalle: error.message
        });

    }

});

// ========================================
// GET - PENDIENTES DE DISEÑADOR (COSTOS)
// ========================================

app.get('/api/cotizaciones/pendientes-disenador',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {
        try {
            const cotizaciones = await Cotizacion.aggregate([
                {
                    $match: {
                        estado: 'Pendiente',
                        'costos.estado_evaluacion': 'Pendiente'
                    }
                },
                {
                    $lookup: {
                        from: Cliente.collection.name,
                        localField: 'id_cliente',
                        foreignField: 'id_cliente',
                        as: 'clienteDatos'
                    }
                },
                { $unwind: '$clienteDatos' },
                { $sort: { fecha_creacion: 1 } },
                {
                    $project: {
                        _id: 0,
                        id_cotizacion: 1,
                        codigo_cotizacion: 1,
                        cliente: '$clienteDatos.nombre',
                        tipo_producto: 1,
                        cantidad: 1,
                        fecha_requerida: 1,
                        hora_requerida: 1,
                        estado: 1,
                        costo_produccion: '$costos.costo_produccion',
                        mano_obra_diseño: '$costos.mano_obra_diseño',
                        total: '$costos.total',
                        estado_evaluacion: '$costos.estado_evaluacion'
                    }
                }
            ]);

            res.json(cotizaciones);

        } catch (error) {
            console.error(
                '❌ Error obteniendo pendientes de diseñador:',
                error.message
            );

            res.status(500).json({
                error: 'Error al obtener pendientes de diseñador',
                detalle: error.message
            });
        }
    }
);

// ========================================
// GET - PENDIENTES DE APROBACIÓN (COSTOS)
// ========================================

app.get('/api/cotizaciones/pendientes-aprobacion',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {
        try {
            const cotizaciones = await Cotizacion.aggregate([
                {
                    $match: {
                        estado: 'Pendiente',
                        'costos.estado_evaluacion': 'Propuesta enviada'
                    }
                },
                {
                    $lookup: {
                        from: Cliente.collection.name,
                        localField: 'id_cliente',
                        foreignField: 'id_cliente',
                        as: 'clienteDatos'
                    }
                },
                { $unwind: '$clienteDatos' },
                { $sort: { fecha_creacion: 1 } },
                {
                    $project: {
                        _id: 0,
                        id_cotizacion: 1,
                        codigo_cotizacion: 1,
                        cliente: '$clienteDatos.nombre',
                        tipo_producto: 1,
                        cantidad: 1,
                        fecha_requerida: 1,
                        hora_requerida: 1,
                        estado: 1,
                        costo_produccion: '$costos.costo_produccion',
                        mano_obra_diseño: '$costos.mano_obra_diseño',
                        total: '$costos.total',
                        estado_evaluacion: '$costos.estado_evaluacion'
                    }
                }
            ]);

            res.json(cotizaciones);

        } catch (error) {
            console.error(
                '❌ Error obteniendo pendientes de aprobación:',
                error.message
            );

            res.status(500).json({
                error: 'Error al obtener pendientes de aprobación',
                detalle: error.message
            });
        }
    }
);

app.get('/api/cotizaciones/:id',
    permitirRoles(
        'administrador',
        'cotizador',
        'diseñador',
        'maquinista'
    ),
    async (req, res) => {
        try {
            const idCotizacion = Number(req.params.id);

            if (!Number.isSafeInteger(idCotizacion) ||
                idCotizacion < 1) {
                return res.status(400).json({
                    error: 'ID de cotización inválido'
                });
            }

            const c = await Cotizacion.findOne({
                id_cotizacion: idCotizacion
            }).lean();

            if (!c) {
                return res.status(404).json({
                    error: 'Cotización no encontrada'
                });
            }

            const [cliente, usuario] = await Promise.all([
                Cliente.findOne({
                    id_cliente: c.id_cliente
                }).lean(),
                Usuario.findOne({
                    id_usuario: c.id_usuario
                }).lean()
            ]);

            if (!cliente || !usuario) {
                return res.status(404).json({
                    error: 'Datos relacionados no encontrados'
                });
            }

            const costo = c.costos || null;

            const tarifa = costo?.id_tarifa
                ? await Tarifa.findOne({
                    id_tarifa: costo.id_tarifa
                }).lean()
                : null;

            res.json({
                id_cotizacion: c.id_cotizacion,
                codigo_cotizacion: c.codigo_cotizacion,
                id_cliente: cliente.id_cliente,
                cliente: cliente.nombre,
                telefono: cliente.telefono,
                correo: cliente.correo,
                usuario: `${usuario.nombres} ${usuario.apellidos}`,
                tipo_producto: c.tipo_producto,
                tamaño: c.tamaño,
                material: c.material,
                impresion: c.impresion,
                color: c.color,
                caras: tarifa?.caras ?? null,
                acabado: c.acabado,
                sangrado: c.sangrado,
                cantidad: c.cantidad,
                fecha_requerida: c.fecha_requerida,
                hora_requerida: c.hora_requerida,
                observaciones: c.observaciones,
                estado: c.estado,
                fecha_creacion: c.fecha_creacion,
                fecha_actualizacion: c.fecha_actualizacion,
                id_costo: costo?.id_costo ?? null,
                id_tarifa: costo?.id_tarifa ?? null,
                cantidad_millares: costo?.cantidad_millares ?? null,
                costo_produccion: costo?.costo_produccion ?? null,
                mano_obra_diseño: costo?.mano_obra_diseño ?? null,
                total: costo?.total ?? null,
                estado_evaluacion: costo?.estado_evaluacion ?? null,
                precio_millar: tarifa?.precio_millar ?? null
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Error al consultar la cotización',
                detalle: error.message
            });
        }
    }
);


app.post('/api/cotizaciones',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {

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

        const ultimaCotizacion = await Cotizacion
            .findOne()
            .sort({ id_cotizacion: -1 })
            .select('codigo_cotizacion')
            .lean();

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

        const clienteExistente = await Cliente.findOne({
            id_cliente: Number(id_cliente)
        }).lean();

        if (!clienteExistente) {

            return res.status(404).json({
                error: 'El cliente seleccionado no existe'
            });

        }

        // ==========================================
        // CREAR COTIZACIÓN
        // ==========================================

        const contadorCotizacion = await Contador.findOneAndUpdate(
            { _id: 'cotizacion' },
            { $inc: { secuencia: 1 } },
            { returnDocument: 'after' }
        );

        const idCotizacion = contadorCotizacion.secuencia;

        const cotizacion = await Cotizacion.create({

            id_cotizacion: idCotizacion,

            codigo_cotizacion: codigoCotizacion,

            id_cliente: Number(id_cliente),

            id_usuario,

            tipo_producto,
            tamaño,
            material,
            impresion,
            color,

            acabado: acabado || null,

            sangrado: sangrado || null,

            cantidad,
            fecha_requerida,
            hora_requerida,

            observaciones: observaciones || null,

            estado: 'Pendiente',

            fecha_creacion: fechaActual,

            fecha_actualizacion: fechaActual

        });

        // ==========================================
        // OBTENER TARIFA APLICABLE
        // ==========================================

        const tarifa = await Tarifa.findOne({
            tipo_producto,
            tamaño,
            material,
            tipo_impresion: impresion,
            caras,
            activo: true
        }).lean();

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

        const contadorCosto = await Contador.findOneAndUpdate(
            { _id: 'cotizacion_costo' },
            { $inc: { secuencia: 1 } },
            { returnDocument: 'after' }
        );

        cotizacion.costos = {

            id_costo: contadorCosto.secuencia,

            id_tarifa: tarifa.id_tarifa,

            cantidad_millares: cantidadMillares,

            costo_produccion: costoProduccion,

            mano_obra_diseño: manoObraDiseño,

            total,

            estado_evaluacion: 'Pendiente',

            fecha_creacion: fechaActual,

            fecha_actualizacion: fechaActual

        };

        await cotizacion.save();

        // ==========================================
        // OBTENER COTIZACIÓN CREADA
        // ==========================================

        const usuario = await Usuario.findOne({
            id_usuario
        }).lean();

        const nuevaCotizacion = {

            id_cotizacion: cotizacion.id_cotizacion,
            codigo_cotizacion: cotizacion.codigo_cotizacion,

            id_cliente: clienteExistente.id_cliente,
            cliente: clienteExistente.nombre,
            telefono: clienteExistente.telefono,
            correo: clienteExistente.correo,

            usuario: usuario
                ? `${usuario.nombres} ${usuario.apellidos}`
                : null,

            tipo_producto: cotizacion.tipo_producto,
            tamaño: cotizacion.tamaño,
            material: cotizacion.material,
            impresion: cotizacion.impresion,
            color: cotizacion.color,
            acabado: cotizacion.acabado,
            sangrado: cotizacion.sangrado,
            cantidad: cotizacion.cantidad,
            fecha_requerida: cotizacion.fecha_requerida,
            hora_requerida: cotizacion.hora_requerida,
            observaciones: cotizacion.observaciones,
            estado: cotizacion.estado,
            fecha_creacion: cotizacion.fecha_creacion,
            fecha_actualizacion: cotizacion.fecha_actualizacion

        };

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

// ========================================
// PUT - COTIZACIONES PENDIENTES DISEÑO ENVIADO
// ========================================

app.put('/api/cotizaciones/:id/propuesta-diseno',
    permitirRoles('diseñador'),
    async (req, res) => {

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
                await Cotizacion.findOne({
                    id_cotizacion: idCotizacion,
                    'costos.id_costo': { $exists: true }
                }).lean();

            if (!cotizacion) {
                return res.status(404).json({
                    error:
                        'Cotización no encontrada'
                });
            }

            const total =
                Number(cotizacion.costos.costo_produccion) +
                manoObra;

            await Cotizacion.updateOne(
                {
                    id_cotizacion: idCotizacion,
                    'costos.id_costo': cotizacion.costos.id_costo
                },
                {
                    $set: {
                        'costos.mano_obra_diseño': manoObra,
                        'costos.total': total,
                        'costos.estado_evaluacion': 'Propuesta enviada',
                        'costos.fecha_actualizacion': fechaHoraLima()
                    }
                }
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
    async (req, res) => {

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
                await Cotizacion.findOne({
                    id_cotizacion: idCotizacion,
                    'costos.id_costo': { $exists: true }
                }).lean();

            if (!cotizacion) {
                return res.status(404).json({
                    error:
                        'Cotización no encontrada'
                });
            }

            const nuevoTotal =
                Number(cotizacion.costos.costo_produccion) +
                nuevaManoObra;

            await Cotizacion.updateOne(
                {
                    id_cotizacion: idCotizacion,
                    'costos.id_costo': cotizacion.costos.id_costo
                },
                {
                    $set: {
                        'costos.mano_obra_diseño': nuevaManoObra,
                        'costos.total': nuevoTotal,
                        'costos.fecha_actualizacion': fechaHoraLima()
                    }
                }
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


app.get('/api/cotizaciones/historial/aprobadas',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {

        try {

            const cotizaciones = await Cotizacion.aggregate([
                {
                    $match: {
                        estado: 'Aprobada'
                    }
                },
                {
                    $lookup: {
                        from: Cliente.collection.name,
                        localField: 'id_cliente',
                        foreignField: 'id_cliente',
                        as: 'clienteDatos'
                    }
                },
                {
                    $unwind: '$clienteDatos'
                },
                {
                    $sort: {
                        fecha_actualizacion: -1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id_cotizacion: 1,
                        codigo_cotizacion: 1,
                        cliente: '$clienteDatos.nombre',
                        tipo_producto: 1,
                        cantidad: 1,
                        estado: 1,
                        fecha_actualizacion: 1,
                        total: {
                            $ifNull: ['$costos.total', 0]
                        }
                    }
                }
            ]);

            res.json(cotizaciones);

        } catch (error) {

            console.error(
                '❌ Error obteniendo cotizaciones aprobadas:',
                error.message
            );

            res.status(500).json({
                error: 'Error al obtener cotizaciones aprobadas',
                detalle: error.message
            });
        }
    }
);


app.get('/api/cotizaciones/historial/rechazadas',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {

        try {

            const cotizaciones = await Cotizacion.aggregate([
                {
                    $match: {
                        estado: 'Rechazada'
                    }
                },
                {
                    $lookup: {
                        from: Cliente.collection.name,
                        localField: 'id_cliente',
                        foreignField: 'id_cliente',
                        as: 'clienteDatos'
                    }
                },
                {
                    $unwind: '$clienteDatos'
                },
                {
                    $sort: {
                        fecha_actualizacion: -1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id_cotizacion: 1,
                        codigo_cotizacion: 1,
                        cliente: '$clienteDatos.nombre',
                        tipo_producto: 1,
                        cantidad: 1,
                        estado: 1,
                        fecha_actualizacion: 1,
                        total: {
                            $ifNull: ['$costos.total', 0]
                        }
                    }
                }
            ]);

            res.json(cotizaciones);

        } catch (error) {

            console.error(
                '❌ Error obteniendo cotizaciones rechazadas:',
                error.message
            );

            res.status(500).json({
                error: 'Error al obtener cotizaciones rechazadas',
                detalle: error.message
            });
        }
    }
);

app.patch('/api/cotizaciones/:id/rechazar',
    permitirRoles('administrador', 'cotizador'),
    async (req, res) => {

        const idCotizacion = Number(req.params.id);

        try {

            const cotizacion = await Cotizacion.findOne({
                id_cotizacion: idCotizacion
            })
            .select('id_cotizacion codigo_cotizacion estado')
            .lean();

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

            await Cotizacion.updateOne(
                { id_cotizacion: idCotizacion },
                {
                    $set: {
                        estado: 'Rechazada',
                        fecha_actualizacion: fechaActual
                    }
                }
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
    }
);

app.patch('/api/ordenes-trabajo/:id/estado',
    permitirRoles('administrador', 'cotizador', 'diseñador', 'maquinista'),
    async (req, res) => {

    const idOT = Number(req.params.id);
    const { estado_nuevo } = req.body;
    const id_usuario = req.session.user.id;

    try {
        const ot = await OrdenTrabajo.findOne({ id_ot: idOT }).lean();

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

        if (!estado_nuevo || !estadosPermitidos.includes(estado_nuevo)) {
            return res.status(400).json({
                error: 'Estado no válido',
                estado_recibido: estado_nuevo,
                estados_permitidos: estadosPermitidos
            });
        }

        const rolUsuario = req.session.user.rol.toLowerCase();
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
                ['Finalizada', 'En Diseño', 'En Impresión'].includes(estado_nuevo)
            ) {
                transicionValida = true;
            }
        }

        if (rolUsuario === 'diseñador') {
            if (
                (ot.estado === 'Pendiente' && estado_nuevo === 'En Diseño') ||
                (ot.estado === 'En Diseño' && estado_nuevo === 'En Impresión')
            ) {
                transicionValida = true;
            }
        }

        if (rolUsuario === 'maquinista') {
            if (ot.estado === 'En Impresión' && estado_nuevo === 'En Revisión') {
                transicionValida = true;
            }
        }

        if (rolUsuario === 'cotizador') {
            if (
                ot.estado === 'En Revisión' &&
                ['Finalizada', 'En Diseño', 'En Impresión'].includes(estado_nuevo)
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
        const fecha = fechaHoraLima();

        // Actualización condicional para evitar sobrescribir otro cambio simultáneo
        const resultado = await OrdenTrabajo.updateOne(
            { id_ot: idOT, estado: estadoAnterior },
            {
                $set: {
                    estado: estado_nuevo,
                    fecha_actualizacion: fecha
                }
            }
        );

        if (resultado.modifiedCount !== 1) {
            return res.status(400).json({
                error: 'Transición de estado no permitida',
                estado_actual: (await OrdenTrabajo.findOne({ id_ot: idOT }).lean())?.estado,
                estado_solicitado: estado_nuevo
            });
        }

        const contadorLog = await Contador.findOneAndUpdate(
            { _id: 'log_ot' },
            { $inc: { secuencia: 1 } },
            { returnDocument: 'after' }
        );

        if (!contadorLog) {
            throw new Error('Contador de logs no inicializado');
        }

        await LogOT.create({
            id_logs: contadorLog.secuencia,
            id_ot: idOT,
            id_usuario,
            tipo_evento: 'ESTADO_CAMBIADO',
            estado_anterior: estadoAnterior,
            estado_nuevo,
            detalle_evento: `La OT cambió de ${estadoAnterior} a ${estado_nuevo}`,
            fecha_hora: fechaHoraLima()
        });

        const otActualizada = await OrdenTrabajo.findOne({
            id_ot: idOT
        }).select(
            'id_ot codigo_ot id_cotizacion estado prioridad fecha_requerida hora_requerida fecha_creacion fecha_actualizacion -_id'
        ).lean();

        res.json({
            mensaje: 'Estado de la OT actualizado correctamente',
            orden_trabajo: otActualizada
        });

    } catch (error) {
        console.error('❌ Error actualizando estado de OT:', error);

        res.status(500).json({
            error: 'Error interno al actualizar el estado de la OT'
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
    async (req, res) => {

    const idOT = req.params.id;

    console.log(`🔥 Consultando logs de OT ${idOT}`);

    try {

        // Verificar que la OT exista
        const ot = await OrdenTrabajo.findOne({
            id_ot: Number(idOT)
        })
        .select('id_ot codigo_ot -_id')
        .lean();

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        // Obtener únicamente los logs de esta OT
        const logs = await LogOT.aggregate([
            {
                $match: {
                    id_ot: Number(idOT)
                }
            },
            {
                $lookup: {
                    from: OrdenTrabajo.collection.name,
                    localField: 'id_ot',
                    foreignField: 'id_ot',
                    as: 'ot'
                }
            },
            {
                $unwind: '$ot'
            },
            {
                $lookup: {
                    from: Usuario.collection.name,
                    localField: 'id_usuario',
                    foreignField: 'id_usuario',
                    as: 'usuarioInfo'
                }
            },
            {
                $unwind: '$usuarioInfo'
            },
            {
                $sort: {
                    fecha_hora: 1,
                    id_logs: 1
                }
            },
            {
                $project: {
                    _id: 0,
                    id_logs: 1,
                    id_ot: 1,
                    codigo_ot: '$ot.codigo_ot',
                    id_usuario: 1,
                    usuario: '$usuarioInfo.usuario',
                    tipo_evento: 1,
                    estado_anterior: 1,
                    estado_nuevo: 1,
                    detalle_evento: 1,
                    fecha_hora: 1
                }
            }
        ]);

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
    async (req, res) => {

    console.log('🔥 SE RECIBIÓ GET /api/ordenes-trabajo');

    try {
        const paginaSolicitada =
            Number.parseInt(req.query.pagina, 10) || 1;

        const porPagina = 10;

        const pagina = paginaSolicitada < 1
            ? 1
            : paginaSolicitada;

        const estado = req.query.estado || '';
        const prioridad = req.query.prioridad || '';
        const codigoOT = req.query.codigo_ot || '';
        const codigoCotizacion =
            req.query.codigo_cotizacion || '';

        const rolUsuario =
            req.session.user.rol.toLowerCase();

        const condicionesOT = {};

        // ========================================
        // FILTROS POR ROL
        // ========================================

        if (rolUsuario === 'diseñador') {

            condicionesOT.estado = estado
                ? estado
                : { $in: ['Pendiente', 'En Diseño'] };

        } else if (rolUsuario === 'maquinista') {

            condicionesOT.estado = estado
                ? estado
                : 'En Impresión';

        } else {

            condicionesOT.estado = estado
                ? estado
                : { $nin: ['Finalizada', 'En Revisión'] };
        }

        if (prioridad) {
            condicionesOT.prioridad = prioridad;
        }

        // Reproducir el LIKE de SQLite
        // usando una expresión regular sin distinguir mayúsculas.
        // Los códigos tienen formato OT-0001 y COT-0001.

        const escaparRegex = (valor) =>
            valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (codigoOT) {
            const codigoBuscado =
                `OT-${codigoOT.padStart(4, '0')}`;

            condicionesOT.codigo_ot = {
                $regex: escaparRegex(codigoBuscado),
                $options: 'i'
            };
        }

        const pipeline = [
            {
                $match: condicionesOT
            },
            {
                $lookup: {
                    from: Cotizacion.collection.name,
                    localField: 'id_cotizacion',
                    foreignField: 'id_cotizacion',
                    as: 'cotizacion'
                }
            },
            {
                $unwind: '$cotizacion'
            }
        ];

        if (codigoCotizacion) {
            const codigoBuscado =
                `COT-${codigoCotizacion.padStart(4, '0')}`;

            pipeline.push({
                $match: {
                    'cotizacion.codigo_cotizacion': {
                        $regex: escaparRegex(codigoBuscado),
                        $options: 'i'
                    }
                }
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: Cliente.collection.name,
                    localField: 'cotizacion.id_cliente',
                    foreignField: 'id_cliente',
                    as: 'clienteDatos'
                }
            },
            {
                $unwind: '$clienteDatos'
            },
            {
                $sort: {
                    id_ot: 1
                }
            },
            {
                $facet: {
                    registros: [
                        {
                            $project: {
                                _id: 0,
                                id_ot: 1,
                                codigo_ot: 1,
                                id_cotizacion: 1,
                                codigo_cotizacion:
                                    '$cotizacion.codigo_cotizacion',
                                cliente: '$clienteDatos.nombre',
                                tipo_producto:
                                    '$cotizacion.tipo_producto',
                                cantidad: '$cotizacion.cantidad',
                                estado: 1,
                                prioridad: 1,
                                fecha_requerida: 1,
                                hora_requerida: 1,
                                fecha_creacion: 1,
                                fecha_actualizacion: 1
                            }
                        }
                    ],
                    conteo: [
                        { $count: 'total' }
                    ]
                }
            }
        );

        const [resultado] =
            await OrdenTrabajo.aggregate(pipeline);

        const totalRegistros =
            resultado.conteo[0]?.total || 0;

        const totalPaginas = Math.max(
            1,
            Math.ceil(totalRegistros / porPagina)
        );

        const paginaFinal =
            Math.min(pagina, totalPaginas);

        const offset =
            (paginaFinal - 1) * porPagina;

        const ordenes = resultado.registros.slice(
            offset,
            offset + porPagina
        );

        console.log(
            `✅ Página ${paginaFinal}/${totalPaginas} - ` +
            `${ordenes.length} órdenes`
        );

        res.json({
            ordenes,
            pagina: paginaFinal,
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
            error: 'Error al consultar las órdenes de trabajo',
            detalle: error.message
        });
    }
});

app.post('/api/ordenes-trabajo/:id/impresion',
    permitirRoles('administrador', 'maquinista'),
    async (req, res) => {

    const idOT = Number(req.params.id);

    const {
        id_diseño,
        codigo_maquina,
        cantidad_impresa,
        observaciones
    } = req.body;

    const id_usuario = req.session.user.id;

    try {
        // Verificar que la OT exista
        const ot = await OrdenTrabajo.findOne({
            id_ot: idOT
        }).select('id_ot codigo_ot estado -_id').lean();

        if (!ot) {
            return res.status(404).json({
                error: 'Orden de trabajo no encontrada'
            });
        }

        // Validar campos obligatorios
        if (!id_diseño || !codigo_maquina || !cantidad_impresa) {
            return res.status(400).json({
                error: 'id_diseño, codigo_maquina y cantidad_impresa son obligatorios'
            });
        }

        // Verificar que el diseño pertenezca a esta OT
        const diseño = await Diseno.findOne({
            id_diseño: Number(id_diseño),
            id_ot: idOT
        }).select('id_diseño id_ot nombre_diseño archivo_diseño -_id').lean();

        if (!diseño) {
            return res.status(400).json({
                error: 'El diseño no existe o no pertenece a esta OT'
            });
        }

        // Verificar usuario
        const usuario = await Usuario.findOne({
            id_usuario: id_usuario
        }).select('id_usuario usuario -_id').lean();

        if (!usuario) {
            return res.status(400).json({
                error: 'El usuario indicado no existe'
            });
        }

        // Obtener siguiente ID de impresión
        const contadorImpresion = await Contador.findOneAndUpdate(
            { _id: 'impresion' },
            { $inc: { secuencia: 1 } },
            { returnDocument: 'after' }
        );

        if (!contadorImpresion) {
            throw new Error('Contador de impresiones no inicializado');
        }

        const fecha = fechaHoraLima();

        // Registrar impresión
        const nueva = await Impresion.create({
            id_impresion: contadorImpresion.secuencia,
            id_ot: idOT,
            id_diseño: Number(id_diseño),
            id_usuario,
            codigo_maquina,
            cantidad_impresa,
            observaciones: observaciones || null,
            fecha_impresion: fecha
        });

        // Obtener siguiente ID de log
        const contadorLog = await Contador.findOneAndUpdate(
            { _id: 'log_ot' },
            { $inc: { secuencia: 1 } },
            { returnDocument: 'after' }
        );

        if (!contadorLog) {
            throw new Error('Contador de logs no inicializado');
        }

        // Registrar historial
        await LogOT.create({
            id_logs: contadorLog.secuencia,
            id_ot: idOT,
            id_usuario,
            tipo_evento: 'IMPRESION_REGISTRADA',
            estado_anterior: null,
            estado_nuevo: null,
            detalle_evento: `${cantidad_impresa} unidades - ${codigo_maquina}`,
            fecha_hora: fechaHoraLima()
        });

        res.status(201).json({
            mensaje: 'Impresión registrada correctamente',
            impresion: {
                id_impresion: nueva.id_impresion,
                id_ot: nueva.id_ot,
                codigo_ot: ot.codigo_ot,
                id_diseño: nueva.id_diseño,
                nombre_diseño: diseño.nombre_diseño,
                id_usuario: nueva.id_usuario,
                usuario: usuario.usuario,
                codigo_maquina: nueva.codigo_maquina,
                cantidad_impresa: nueva.cantidad_impresa,
                fecha_impresion: nueva.fecha_impresion,
                observaciones: nueva.observaciones
            }
        });

    } catch (error) {
        console.error('❌ Error al registrar impresión:', error.message);

        res.status(500).json({
            error: 'Error al registrar la impresión',
            detalle: error.message
        });
    }
});

const Impresion = mongoose.model(
    'Impresion',
    new mongoose.Schema(
        {
            id_impresion: Number,
            id_ot: Number,
            id_diseño: Number,
            id_usuario: Number,
            codigo_maquina: String,
            cantidad_impresa: Number,
            observaciones: String,
            fecha_impresion: String
        },
        { collection: 'impresiones' }
    )
);

async function iniciar() {
    try {
        await conectarMongoDB();

        app.listen(PORT, () => {
            console.log(
                `✅ Consultas MongoDB: http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exitCode = 1;
    }
}

iniciar();
