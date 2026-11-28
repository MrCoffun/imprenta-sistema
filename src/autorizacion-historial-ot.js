const { estadosActivosPorRol, estadosHistorialOT } = require('./estados-ot');

const rolesHistorialOT = ['administrador', 'cotizador', ...estadosActivosPorRol.keys()];

async function puedeConsultarHistorialOT(usuario, orden, { Cotizacion, LogOT }) {
    const rol = usuario.rol.toLowerCase();
    if (rol === 'administrador') return true;
    if (rol === 'cotizador') {
        return Boolean(await Cotizacion.exists({
            id_cotizacion: orden.id_cotizacion,
            id_usuario: usuario.id
        }));
    }

    const estadosActivos = estadosActivosPorRol.get(rol);
    if (!estadosActivos) return false;
    if (estadosActivos.includes(orden.estado)) return true;
    if (!estadosHistorialOT.includes(orden.estado)) return false;

    return Boolean(await LogOT.exists({
        id_ot: orden.id_ot,
        id_usuario: usuario.id
    }));
}

module.exports = { rolesHistorialOT, puedeConsultarHistorialOT };
