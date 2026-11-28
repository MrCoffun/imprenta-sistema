const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizarRolOperativo, cambiarRolOperativo } = require('../src/roles-usuarios');

function modeloUsuario(cuenta) {
    const consulta = resultado => ({ select: () => ({ lean: async () => resultado }) });
    return {
        findOne: filtro => consulta(cuenta?.id_usuario === filtro.id_usuario ? cuenta : null),
        findOneAndUpdate: (filtro, cambios, opciones) => {
            assert.equal(opciones.collation.strength, 2);
            const rolActual = normalizarRolOperativo(cuenta?.rol);
            if (cuenta?.id_usuario !== filtro.id_usuario || rolActual !== filtro.rol.$eq || rolActual === filtro.rol.$ne) {
                return consulta(null);
            }
            Object.assign(cuenta, cambios.$set);
            cuenta.version_sesion = (cuenta.version_sesion ?? 0) + cambios.$inc.version_sesion;
            return consulta(cuenta);
        }
    };
}

test('RF-18 permite los roles operativos y rechaza asignar Administrador', () => {
    for (const rol of ['cotizador', 'diseñador', 'maquinista']) {
        assert.equal(normalizarRolOperativo(` ${rol.toUpperCase()} `), rol);
    }
    for (const valor of ['administrador', 'otro', '', null, { rol: 'cotizador' }]) {
        assert.equal(normalizarRolOperativo(valor), null);
    }
});

test('CU-15 cambia el rol operativo y revoca la sesión una sola vez', async () => {
    const cuenta = { id_usuario: 8, rol: 'Diseñador', estado: true };
    const Usuario = modeloUsuario(cuenta);
    const primera = await cambiarRolOperativo(Usuario, 8, 'diseñador', 'maquinista');
    assert.equal(primera.estado, 200);
    assert.deepEqual(cuenta, { id_usuario: 8, rol: 'maquinista', estado: true, version_sesion: 1 });

    const reintento = await cambiarRolOperativo(Usuario, 8, 'diseñador', 'maquinista');
    assert.equal(reintento.estado, 200);
    assert.equal(cuenta.version_sesion, 1);

    const desactualizado = await cambiarRolOperativo(Usuario, 8, 'diseñador', 'cotizador');
    assert.equal(desactualizado.estado, 409);
    assert.equal(cuenta.rol, 'maquinista');
});

test('CU-15 protege las cuentas administrativas y distingue una cuenta inexistente', async () => {
    const cuenta = { id_usuario: 1, rol: 'administrador', version_sesion: 2 };
    const Usuario = modeloUsuario(cuenta);
    assert.equal((await cambiarRolOperativo(Usuario, 1, 'diseñador', 'maquinista')).estado, 403);
    assert.equal((await cambiarRolOperativo(Usuario, 100, 'diseñador', 'maquinista')).estado, 404);
    assert.deepEqual(cuenta, { id_usuario: 1, rol: 'administrador', version_sesion: 2 });
});
