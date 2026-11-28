const rolesRevision = ['administrador', 'cotizador'];

const transicionesOT = {
    Pendiente: { 'En Diseño': ['administrador', 'diseñador'] },
    'En Diseño': { 'En Impresión': ['administrador', 'diseñador'] },
    'En Impresión': { 'En Revisión': ['administrador', 'maquinista'] },
    'En Revisión': {
        'En Diseño': rolesRevision,
        'En Impresión': rolesRevision,
        Finalizada: rolesRevision
    },
    Finalizada: { Entregada: rolesRevision },
    Entregada: {}
};

const estadosOT = Object.keys(transicionesOT);
const estadosHistorialOT = ['Finalizada', 'Finalizada conforme', 'Entregada'];
const estadosActivosPorRol = new Map([
    ['diseñador', ['Pendiente', 'En Diseño']],
    ['maquinista', ['En Impresión']]
]);

function permiteCambiarEstadoOT(rol, estadoActual, estadoNuevo) {
    const origen = estadoActual === 'Finalizada conforme' ? 'Finalizada' : estadoActual;
    const roles = transicionesOT[origen]?.[estadoNuevo];
    return Array.isArray(roles) && roles.includes(rol);
}

module.exports = { estadosOT, estadosHistorialOT, estadosActivosPorRol, permiteCambiarEstadoOT };
