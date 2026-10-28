const { randomBytes } = require('node:crypto');

// Proteger la sesión según dónde se esté usando el sistema.
function crearConfiguracionSesion(entorno = process.env) {
    const produccion = entorno.NODE_ENV === 'production';
    const claveConfigurada = (entorno.SESSION_SECRET || '').trim();

    if (produccion && Buffer.byteLength(claveConfigurada, 'utf8') < 32) {
        throw new Error('En producción configura SESSION_SECRET con al menos 32 bytes.');
    }

    return {
        confiarProxy: produccion,
        opciones: {
            // En la computadora se usa una clave temporal si no hay una configurada.
            secret: claveConfigurada || randomBytes(32).toString('hex'),
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                sameSite: 'lax',
                secure: produccion,
                maxAge: 8 * 60 * 60 * 1000
            }
        }
    };
}

module.exports = crearConfiguracionSesion;
