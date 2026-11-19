import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const source = new URL('../', import.meta.url);
const output = new URL('dist/', source);
const apiUrl = process.env.PRODUCTS_API_URL?.trim();
let api = '';

if (apiUrl) {
  const url = new URL(apiUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
      || !url.pathname.endsWith('/productos')) {
    throw new Error('PRODUCTS_API_URL debe ser la URL HTTPS pública de la colección /productos.');
  }
  api = url.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

const html = await readFile(new URL('index.html', source), 'utf8');
const config = '<meta name="products-api" content="">';
if (!html.includes(config) || !html.includes('href="styles.css"') || !html.includes('src="app.js"')) {
  throw new Error('index.html debe incluir la configuración de la API y las rutas relativas de los recursos.');
}

await mkdir(output, { recursive: true });
await Promise.all([
  copyFile(new URL('app.js', source), new URL('app.js', output)),
  copyFile(new URL('styles.css', source), new URL('styles.css', output)),
  writeFile(new URL('index.html', output), html.replace(config, () => `<meta name="products-api" content="${api}">`)),
]);
