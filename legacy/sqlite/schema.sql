PRAGMA foreign_keys = ON;

-- =========================================
-- TABLA: CLIENTE
-- =========================================

CREATE TABLE cliente (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(9) NOT NULL,
    correo VARCHAR(150) NOT NULL
);

-- =========================================
-- TABLA: USUARIO
-- =========================================

CREATE TABLE usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT 1
);

-- =========================================
-- TABLA: COTIZACION
-- =========================================

CREATE TABLE cotizacion (
    id_cotizacion INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_cotizacion VARCHAR(20) NOT NULL UNIQUE,
    id_cliente INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,

    tipo_producto VARCHAR(100) NOT NULL,
    tamaño VARCHAR(50) NOT NULL,
    material VARCHAR(100) NOT NULL,
    impresion VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    acabado VARCHAR(100),
    sangrado VARCHAR(50),
    cantidad INTEGER NOT NULL,

    fecha_requerida DATE NOT NULL,
    hora_requerida TIME NOT NULL,

    observaciones VARCHAR(500),
    estado VARCHAR(20) NOT NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT (datetime('now', '-5 hours')),
    fecha_actualizacion DATETIME NOT NULL,

    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- =========================================
-- TABLA: ORDEN_TRABAJO
-- =========================================

CREATE TABLE orden_trabajo (
    id_ot INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_ot VARCHAR(20) NOT NULL UNIQUE,

    id_cotizacion INTEGER NOT NULL UNIQUE,

    estado VARCHAR(30) NOT NULL,
    prioridad VARCHAR(20) NOT NULL,

    fecha_requerida DATE NOT NULL,
    hora_requerida TIME NOT NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT (datetime('now', '-5 hours')),
    fecha_actualizacion DATETIME NOT NULL,

    FOREIGN KEY (id_cotizacion) REFERENCES cotizacion(id_cotizacion)
);

-- =========================================
-- TABLA: DISEÑO
-- =========================================

CREATE TABLE diseño (
    id_diseño INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ot INTEGER NOT NULL,

    nombre_diseño VARCHAR(255) NOT NULL,
    descripcion VARCHAR(500),
    archivo_diseño VARCHAR(255) NOT NULL,

    fecha_carga DATETIME NOT NULL DEFAULT (datetime('now', '-5 hours')),

    FOREIGN KEY (id_ot) REFERENCES orden_trabajo(id_ot)
);

-- =========================================
-- TABLA: ARCHIVO
-- =========================================

CREATE TABLE archivo (
    id_archivo INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ot INTEGER NOT NULL,
    id_cotizacion INTEGER NOT NULL,

    nombre_archivo VARCHAR(255) NOT NULL,
    ruta VARCHAR(500) NOT NULL,

    fecha_carga DATETIME NOT NULL DEFAULT (datetime('now', '-5 hours')),

    id_usuario INTEGER NOT NULL,

    FOREIGN KEY (id_ot) REFERENCES orden_trabajo(id_ot),
    FOREIGN KEY (id_cotizacion) REFERENCES cotizacion(id_cotizacion),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- =========================================
-- TABLA: IMPRESION
-- =========================================

CREATE TABLE impresion (
    id_impresion INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ot INTEGER NOT NULL,
    id_diseño INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,

    codigo_maquina VARCHAR(30) NOT NULL,
    cantidad_impresa INTEGER NOT NULL,

    fecha_impresion DATETIME NOT NULL DEFAULT (datetime('now', '-5 hours')),

    observaciones VARCHAR(500),

    FOREIGN KEY (id_ot) REFERENCES orden_trabajo(id_ot),
    FOREIGN KEY (id_diseño) REFERENCES diseño(id_diseño),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- =========================================
-- TABLA: LOGS_OT
-- =========================================

CREATE TABLE logs_ot (
    id_logs INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ot INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30),
    detalle_evento VARCHAR(500),
    fecha_hora DATETIME NOT NULL DEFAULT (datetime('now', '-5 hours')),

    FOREIGN KEY (id_ot)
        REFERENCES orden_trabajo(id_ot),

    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);
