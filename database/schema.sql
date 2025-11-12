CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tramites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_tramite VARCHAR(100) NOT NULL,
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tramite_id INT NOT NULL,
    nombre_documento VARCHAR(255) NOT NULL,
    ruta_documento VARCHAR(255) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS landing_prueba (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO landing_prueba (titulo, descripcion)
VALUES (
  'Bienvenido al Sistema de Gestión de Trámites de Graduación',
  'Gestiona tu proceso de graduación de manera rápida y sencilla desde una sola plataforma.'
)
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo);

-- NUEVO: Tablas de seguridad (si no existieran)
CREATE TABLE IF NOT EXISTS usuario_sistema (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(100) NOT NULL,
  apellido_usuario VARCHAR(100) NOT NULL,
  contraseña_usuario VARCHAR(255) NOT NULL,
  correo_usuario VARCHAR(150) NOT NULL UNIQUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS rol (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS usuario_rol (
  id_usuario INT NOT NULL,
  id_rol INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_rol),
  FOREIGN KEY (id_usuario) REFERENCES usuario_sistema(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login (
  id_login INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  exitoso TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuario_sistema(id_usuario) ON DELETE SET NULL
);

-- Registro de actividad general
CREATE TABLE IF NOT EXISTS actividad_usuario (
  id_actividad INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  accion VARCHAR(255) NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuario_sistema(id_usuario) ON DELETE CASCADE
);

-- Seed de roles
INSERT IGNORE INTO rol (nombre_rol, descripcion) VALUES
('estudiante', 'Acceso a su propio expediente'),
('coordinador', 'Acceso a expedientes de su carrera'),
('administrativo', 'Acceso a expedientes de toda la facultad'),
('secretaria_general', 'Acceso total');

-- Ejemplo: crear usuario admin y asignar rol (reemplaza el hash por uno real de bcrypt)
-- Genera un hash con bcrypt (POST /api/auth/register o script) y reemplaza :HASH_AQUI
-- INSERT INTO usuario_sistema (nombre_usuario, apellido_usuario, contraseña_usuario, correo_usuario)
-- VALUES ('Admin', 'FCEAC', ':HASH_AQUI', 'admin@unah.edu.hn');

-- Luego asignar rol (ajusta el id_usuario resultante)
-- INSERT INTO usuario_rol (id_usuario, id_rol)
-- SELECT u.id_usuario, r.id_rol FROM usuario_sistema u, rol r
-- WHERE u.correo_usuario='admin@unah.edu.hn' AND r.nombre_rol='secretaria_general'
-- ON DUPLICATE KEY UPDATE id_usuario=id_usuario;