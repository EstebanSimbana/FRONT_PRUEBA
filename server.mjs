import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
]);

createServer(async (request, response) => {
  const asset = files.get(request.url.split('?')[0]);
  if (!asset || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end('Recurso no encontrado');
    return;
  }
  try {
    const body = await readFile(new URL(asset[0], import.meta.url));
    response.writeHead(200, {
      'Content-Type': asset[1] + '; charset=utf-8',
      'Content-Length': body.length,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    }).end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end('No se pudo servir el recurso');
  }
}).listen(5173, 'localhost', () => console.log('Frontend disponible en http://localhost:5173'));
