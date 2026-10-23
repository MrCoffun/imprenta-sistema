
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const conectarMongoDB = require('./mongodb');
const Usuario = require('./models/Usuario');

const app = express();
const PORT = 3001;

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

app.post('/api/login', async (req, res) => {
    try {
        const { usuario, contraseña } = req.body || {};

        if (
            typeof usuario !== 'string' ||
            typeof contraseña !== 'string' ||
            !usuario.trim() ||
            !contraseña
        ) {
            return res.status(400).json({
                error: 'Usuario y contraseña son obligatorios'
            });
        }

        const user = await Usuario.findOne({
            usuario: usuario.trim()
        }).select('+contraseña');

        if (!user || !user.estado) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos'
            });
        }

        const contraseñaValida = await bcrypt.compare(
            contraseña,
            user.contraseña
        );

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
        console.error('Error en login:', error.message);

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

async function iniciar() {
    try {
        await conectarMongoDB();

        app.listen(PORT, () => {
            console.log(
                `✅ Prueba MongoDB: http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            '❌ No se pudo iniciar:',
            error.message
        );
        process.exitCode = 1;
    }
}

iniciar();
