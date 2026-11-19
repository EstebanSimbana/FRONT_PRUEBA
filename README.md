# Frontend BDProductos

Interfaz en español para administrar los productos de la API REST. Incluye consulta, búsqueda, orden, paginación, creación, edición y eliminación.

## Desarrollo local

1. Inicia el [backend BDProductos](https://github.com/EstebanSimbana/BACKEND_PRUEBA/tree/main/backend) con PostgreSQL y su archivo `.env`.
2. Desde esta carpeta ejecuta `node server.mjs`.
3. Abre http://localhost:5173.

El frontend no requiere instalar dependencias. Usa la URL predeterminada `http://127.0.0.1:5050/api/v1/productos`. Si modificas el puerto o el prefijo de la API, actualiza `endpoint` en `app.js`. El backend debe incluir `http://localhost:5173` en `CORS_ORIGINS`.

## CI/CD y GitHub Pages

El sitio usa HTML, CSS y JavaScript nativos. Node.js 24 se usa en CI para comprobar la sintaxis y preparar los tres archivos estáticos en `dist/`. El workflow valida los pull requests a `main` y despliega al publicar cambios en `main`. También puede ejecutarse manualmente desde Actions. La fuente de publicación en Settings → Pages debe ser **GitHub Actions**.

Para habilitar las operaciones del catálogo publicado, configura la variable de repositorio `PRODUCTS_API_URL` en Settings → Secrets and variables → Actions → Variables, con la URL HTTPS completa hasta `/api/v1/productos`. La URL queda visible en el HTML y debe estar libre de credenciales. Agrega `https://estebansimbana.github.io` a `CORS_ORIGINS` en el backend y vuelve a ejecutar el workflow. El backend y PostgreSQL se alojan por separado.
