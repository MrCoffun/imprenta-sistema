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
const estadosHistorialOT = ['Finalizada', 'Entregada'];

function permiteCambiarEstadoOT(rol, estadoActual, estadoNuevo) {
    const roles = transicionesOT[estadoActual]?.[estadoNuevo];
    return Array.isArray(roles) && roles.includes(rol);
}

module.exports = { estadosOT, estadosHistorialOT, permiteCambiarEstadoOT };
