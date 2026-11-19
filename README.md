# Frontend BDProductos

Interfaz local en español para administrar los productos de la API REST. Incluye consulta, búsqueda, orden, paginación, creación, edición y eliminación.

1. Inicia el [backend BDProductos](https://github.com/EstebanSimbana/BACKEND_PRUEBA/tree/main/backend) con PostgreSQL y su archivo `.env`.
2. Desde esta carpeta ejecuta `node server.mjs`.
3. Abre http://localhost:5173.

El frontend no requiere instalar dependencias. Usa la URL predeterminada `http://127.0.0.1:5050/api/v1/productos`. Si modificas el puerto o el prefijo de la API, actualiza `endpoint` en `app.js`. El backend debe incluir `http://localhost:5173` en `CORS_ORIGINS`.
