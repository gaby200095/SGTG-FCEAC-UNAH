# Sistema de Gestión de Trámites de Graduación (SGTG) – FCEAC UNAH

Este es el backend del proyecto "Sistema de Gestión de Trámites de Graduación (SGTG)" desarrollado para la Facultad de Ciencias Económicas, Administrativas y Contables (FCEAC) de la Universidad Nacional Autónoma de Honduras (UNAH). Este sistema tiene como objetivo facilitar la gestión de trámites de graduación para los estudiantes.

## Estructura del Proyecto

El backend está construido utilizando Node.js y Express, y se conecta a una base de datos MySQL. A continuación se detalla la estructura de carpetas y archivos:

```
backend
├── src
│   ├── controllers       # Controladores que manejan la lógica de negocio
│   ├── models            # Modelos de datos para interactuar con la base de datos
│   ├── routes            # Rutas de la aplicación
│   ├── config            # Configuración de la base de datos
│   └── app.js            # Punto de entrada de la aplicación
├── package.json          # Configuración de npm y dependencias
└── README.md             # Documentación del backend
```

## Instalación

1. Clona el repositorio:
   ```
   git clone <URL_DEL_REPOSITORIO>
   ```

2. Navega al directorio del backend:
   ```
   cd SGTG-FCEAC-UNAH/backend
   ```

3. Instala las dependencias:
   ```
   npm install
   ```

4. Configura la conexión a la base de datos en `src/config/database.js`.

## Uso

Para iniciar el servidor:
```
npm start
```
El servidor se ejecutará en `http://localhost:5001`.

- Salud de BD: `GET http://localhost:5001/api/prueba-db`
- Trámites:
  - `GET /api/tramites`
  - `POST /api/tramites` con JSON `{ "usuario_id": 1, "tipo_tramite": "..." }`
- Landing dinámica (con fallback): `GET /api/landing`

## Configuración de BD por variables de entorno (recomendado)
Define estas variables en un archivo `.env` (no se sube a git):
```
DB_HOST=srv487.hstgr.io
DB_USER=u937135973_fceac
DB_PASSWORD=fceac_2025UNAH
DB_NAME=u937135973_fceac
DB_PORT=3306
```

## Endpoints útiles de BD
- `GET /api/db/tables` → Lista de tablas.
- `GET /api/table/:name/columns` → Columnas de la tabla.
- `GET /api/table/:name?limit=20&offset=0&orderBy=id&orderDir=desc` → Filas.
- `POST /api/table/:name` → Inserta una fila. Body JSON con claves iguales a columnas existentes.

Ejemplo:
```
POST http://localhost:5001/api/table/estudiante
Content-Type: application/json

{
  "nombre": "Ana",
  "cuenta": "20201234",
  "correo": "ana@unah.hn"
}
```

Respuesta:
```
{ "id": 123, "affectedRows": 1 }
```

## Autenticación (self-hosted JWT)
- Login: POST /api/auth/login con body { correo, password } → devuelve { ok, user, accessToken } y setea cookie httpOnly 'rt'.
- Refresh: POST /api/auth/refresh (la cookie rt se envía sola en navegador) → devuelve nuevo accessToken.
- Logout: POST /api/auth/logout → limpia cookie rt.

Protección de endpoints:
- Los endpoints de datos como /api/expedientes y /api/table/* requieren header Authorization: Bearer <accessToken>.

Pruebas rápidas:
- Salud:
  curl -i http://localhost:5001/api/health
- Login:
  curl -i -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d "{\"correo\":\"tu@correo\",\"password\":\"tuPass\"}"
- Con token:
  curl -i http://localhost:5001/api/expedientes -H "Authorization: Bearer ACCESS_TOKEN_AQUI"
- Refresh (con cookie rt):
  curl -i -X POST http://localhost:5001/api/auth/refresh --cookie "rt=VALOR_COOKIE"

Notas:
- Inactividad: tras 15 min sin uso, los tokens responderán 401 y el frontend cerrará sesión.
- No se usa Firebase ni proveedores externos de autenticación.

## Verificar registros (API genérica de tablas)
- Listar usuarios insertados:
  - GET http://localhost:5001/api/table/usuario_sistema?limit=20&orderBy=id_usuario&orderDir=desc
- Ver roles de un usuario:
  - GET http://localhost:5001/api/table/usuario_rol?limit=20&orderBy=id_usuario&orderDir=desc
- Catálogo de roles:
  - GET http://localhost:5001/api/table/rol?limit=20

## Notas
- Si tu esquema impide registrar en usuario_sistema por la FK hacia solicitud(id_usuario), puedes:
  - Usar ?trySolicitud=1 (si solicitud.id_usuario es AUTO_INCREMENT y permite INSERT mínimo).
  - O crear manualmente la fila en solicitud y registrar sin trySolicitud.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia
