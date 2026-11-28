const rolesHistorialOT = ['administrador', 'cotizador'];

async function puedeConsultarHistorialOT(usuario, orden, Cotizacion) {
    const rol = usuario.rol.toLowerCase();
    if (rol === 'administrador') return true;
    if (rol !== 'cotizador') return false;

    return Boolean(await Cotizacion.exists({
        id_cotizacion: orden.id_cotizacion,
        id_usuario: usuario.id
    }));
}

module.exports = { rolesHistorialOT, puedeConsultarHistorialOT };
