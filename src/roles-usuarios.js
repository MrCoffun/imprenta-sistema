const rolesOperativos = ['cotizador', 'diseñador', 'maquinista'];

function normalizarRolOperativo(valor) {
    const rol = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
    return rolesOperativos.includes(rol) ? rol : null;
}

async function cambiarRolOperativo(Usuario, idUsuario, rolAnterior, rol) {
    // Comparar con el rol que vio el administrador y revocar sesiones en la misma escritura.
    const cuenta = await Usuario.findOneAndUpdate(
        { id_usuario: idUsuario, rol: { $eq: rolAnterior, $ne: rol } },
        { $set: { rol }, $inc: { version_sesion: 1 } },
        { new: true, runValidators: true, collation: { locale: 'es', strength: 2 } }
    ).select('id_usuario rol -_id').lean();
    if (cuenta) return { estado: 200, mensaje: 'Rol actualizado correctamente.', cuenta };

    const actual = await Usuario.findOne({ id_usuario: idUsuario }).select('id_usuario rol -_id').lean();
    if (!actual) return { estado: 404, error: 'La cuenta no existe.' };
    const rolActual = normalizarRolOperativo(actual.rol);
    if (!rolActual) {
        return { estado: 403, error: 'Solo puedes cambiar el rol de las cuentas operativas.' };
    }
    if (rolActual === rol) return { estado: 200, mensaje: 'La cuenta ya tiene ese rol.', cuenta: actual };
    return { estado: 409, error: 'El rol cambió desde que abriste la lista. Revisa el rol vigente e inténtalo de nuevo.' };
}

module.exports = { normalizarRolOperativo, cambiarRolOperativo };
