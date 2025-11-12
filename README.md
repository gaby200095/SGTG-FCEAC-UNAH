# Sistema de Gestión de Trámites de Graduación (SGTG) – FCEAC UNAH

Este proyecto es un sistema diseñado para gestionar los trámites de graduación en la Facultad de Ciencias Económicas, Administrativas y Contables (FCEAC) de la Universidad Nacional Autónoma de Honduras (UNAH). La aplicación está dividida en dos partes: un backend construido con Node.js y Express, y un frontend desarrollado con React.js y Tailwind CSS.

## Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

```
SGTG-FCEAC-UNAH
├── backend                # Código del servidor
│   ├── src                # Código fuente
│   │   ├── controllers     # Controladores de la API
│   │   ├── models          # Modelos de datos
│   │   ├── routes          # Rutas de la API
│   │   ├── config          # Configuración de la base de datos
│   │   └── app.js          # Punto de entrada del servidor
│   ├── package.json        # Dependencias y scripts del backend
│   └── README.md           # Documentación del backend
├── frontend               # Código del cliente
│   ├── public              # Archivos públicos
│   ├── src                 # Código fuente
│   │   ├── assets          # Recursos estáticos
│   │   ├── components      # Componentes de React
│   │   ├── pages           # Páginas de la aplicación
│   │   ├── App.jsx         # Componente principal
│   │   ├── index.js        # Punto de entrada de React
│   │   └── styles          # Estilos de la aplicación
│   ├── tailwind.config.js   # Configuración de Tailwind CSS
│   ├── package.json        # Dependencias y scripts del frontend
│   └── README.md           # Documentación del frontend
├── database               # Esquema de la base de datos
│   └── schema.sql         # Definición de tablas y relaciones
└── README.md              # Documentación general del proyecto
```

## Instalación

### Backend

1. Navega al directorio `backend`.
2. Ejecuta `npm install` para instalar las dependencias.
3. Configura la conexión a la base de datos en `src/config/database.js`.
4. Ejecuta `npm start` para iniciar el servidor.

### Frontend

1. Navega al directorio `frontend`.
2. Ejecuta `npm install` para instalar las dependencias.
3. Ejecuta `npm start` para iniciar la aplicación React.

## Uso

Una vez que ambos servidores estén en funcionamiento, puedes acceder a la aplicación frontend en `http://localhost:3000` y realizar solicitudes a la API en `http://localhost:5001`.

- Salud de BD: `GET http://localhost:5001/api/prueba-db`
- Trámites:
  - `GET http://localhost:5001/api/tramites`
  - `POST http://localhost:5001/api/tramites` (JSON: `{ "usuario_id": 1, "tipo_tramite": "..." }`)
- Landing dinámica (con fallback): `GET http://localhost:5001/api/landing`
- Consultas genéricas de BD:
  - Listar tablas: `GET http://localhost:5001/api/db/tables`
  - Ver columnas: `GET http://localhost:5001/api/table/{tabla}/columns`
  - Listar filas: `GET http://localhost:5001/api/table/{tabla}?limit=20&offset=0&orderBy=id&orderDir=desc`
  - Insertar fila: `POST http://localhost:5001/api/table/{tabla}` con body JSON, por ejemplo:
    `{ "columna1": "valor", "columna2": 123 }`

## Autenticación (nota importante)
- "register" NO es una tabla de BD, es un endpoint HTTP: POST /api/auth/register.
- Este endpoint inserta en usuario_sistema. En tu esquema actual existe una FK desde usuario_sistema(id_usuario) hacia solicitud(id_usuario). Por lo tanto:
  - Si no existe previamente una fila en solicitud con el id a usar, el insert fallará por FK.
  - Puedes probar con: POST http://localhost:5001/api/auth/register?trySolicitud=1 para que el backend intente crear primero una fila en solicitud (solo si solicitud.id_usuario es AUTO_INCREMENT y permite INSERT vacío).
  - Si no es posible, crea manualmente la fila en solicitud o pide al DBA invertir/ajustar esa FK.

### Pruebas rápidas de autenticación (Postman)
- Registro (si tu BD exige solicitud previa, usa ?trySolicitud=1):
  - POST http://localhost:5001/api/auth/register
  - POST http://localhost:5001/api/auth/register?trySolicitud=1
  Body:
  ```
  {
    "nombre": "Ana",
    "apellido": "Perez",
    "correo": "ana@gmail.com",
    "password": "abcd12"
  }
  ```
- Login:
  - POST http://localhost:5001/api/auth/login
  Body:
  ```
  { "correo": "ana@gmail.com", "password": "abcd12" }
  ```
- Verificar inserts:
  - GET http://localhost:5001/api/table/usuario_sistema?limit=20&orderBy=id_usuario&orderDir=desc
  - GET http://localhost:5001/api/table/usuario_rol?limit=20&orderBy=id_usuario&orderDir=desc
  - GET http://localhost:5001/api/table/rol?limit=20

## Contribuciones

Las contribuciones son bienvenidas. Si deseas colaborar, por favor abre un issue o un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.