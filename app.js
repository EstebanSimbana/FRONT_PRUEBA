const endpoint = 'http://127.0.0.1:5050/api/v1/productos';
const get = (id) => document.getElementById(id);
const filters = get('filters');
const table = get('table');
const products = get('products');
const state = get('state');
const editor = get('editor');
const removal = get('removal');
const productForm = get('product-form');
const deleteForm = get('delete-form');
const number = new Intl.NumberFormat('es-EC');
const price = new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let query = { page: 1, limit: 20, nombre: '', orden: 'id_asc' };
let listRequest;
let selectedId;
let saving = false;

async function request(path = '', options = {}) {
  let response;
  try {
    response = await fetch(endpoint + path, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con la API. Verifica que el backend esté activo en el puerto 5050 y que la URL del frontend esté permitida en CORS.');
  }
  if (response.status === 204) return;
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error?.mensaje ?? 'La API devolvió un error HTTP ' + response.status + '.');
  if (!result) throw new Error('La respuesta de la API no contiene JSON válido.');
  return result;
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function httpsImage(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return url.href;
  } catch {
    return null;
  }
  return null;
}

function cell(row, text) {
  const node = element('td', text);
  row.append(node);
  return node;
}

function renderProduct(product) {
  const row = element('tr');
  const preview = element('div', undefined, 'product');
  const fallback = element('span', product.nombre.slice(0, 1).toUpperCase(), 'placeholder');
  fallback.setAttribute('aria-hidden', 'true');
  const url = httpsImage(product.URLimagen);
  if (url) {
    const img = element('img');
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.replaceWith(fallback), { once: true });
    img.src = url;
    preview.append(img);
  } else {
    preview.append(fallback);
  }
  const copy = element('div');
  copy.append(element('strong', product.nombre), element('div', product.descripcion, 'description'));
  preview.append(copy);
  cell(row).append(preview);
  cell(row, product.ID);
  cell(row, price.format(product.pvp));
  const stock = product.stock === 0 ? 'Agotado' : number.format(product.stock);
  cell(row).append(element('span', stock, product.stock === 0 ? 'stock zero' : 'stock'));
  const actions = element('div', undefined, 'actions');
  const edit = element('button', 'Editar');
  edit.setAttribute('aria-label', 'Editar ' + product.nombre);
  edit.addEventListener('click', () => openEditor(product.ID));
  const remove = element('button', 'Eliminar');
  remove.setAttribute('aria-label', 'Eliminar ' + product.nombre);
  remove.addEventListener('click', () => {
    selectedId = product.ID;
    get('delete-message').textContent = '¿Eliminar «' + product.nombre + '» del catálogo?';
    showError(deleteForm);
    removal.showModal();
  });
  actions.append(edit, remove);
  cell(row).append(actions);
  return row;
}

async function loadProducts() {
  listRequest?.abort();
  const controller = new AbortController();
  listRequest = controller;
  table.hidden = true;
  get('pagination').hidden = true;
  state.hidden = false;
  state.textContent = 'Cargando productos…';
  const params = new URLSearchParams(query);
  if (!query.nombre) params.delete('nombre');
  try {
    const { data, meta } = await request('?' + params, { signal: controller.signal });
    if (controller.signal.aborted) return;
    if (query.page > 1 && query.page > meta.totalPages) {
      query.page = Math.max(1, meta.totalPages);
      return loadProducts();
    }
    products.replaceChildren(...data.map(renderProduct));
    state.hidden = data.length > 0;
    state.textContent = query.nombre ? 'No hay productos que coincidan con la búsqueda.' : 'El catálogo está vacío. Puedes agregar un producto.';
    table.hidden = !data.length;
    get('pagination').hidden = !data.length;
    get('summary').textContent = 'Página ' + meta.page + ' de ' + meta.totalPages + ' · ' + number.format(meta.total) + ' productos';
    get('previous').disabled = meta.page <= 1;
    get('next').disabled = meta.page >= meta.totalPages;
  } catch (error) {
    if (controller.signal.aborted) return;
    const retry = element('button', 'Reintentar');
    retry.addEventListener('click', loadProducts);
    state.replaceChildren(element('p', error.message), retry);
  }
}

function showError(form, message = '') {
  const error = form.querySelector('.error');
  error.textContent = message;
  error.hidden = !message;
}

async function openEditor(id = null) {
  selectedId = id;
  productForm.reset();
  showError(productForm);
  get('editor-title').textContent = id ? 'Editar producto' : 'Nuevo producto';
  const fields = productForm.querySelectorAll('input, textarea, [type=submit]');
  const setDisabled = (disabled) => fields.forEach((field) => { field.disabled = disabled; });
  setDisabled(Boolean(id));
  editor.showModal();
  if (!id) return;
  const controller = new AbortController();
  editor.addEventListener('close', () => controller.abort(), { once: true });
  try {
    const { data } = await request('/' + encodeURIComponent(id), { signal: controller.signal });
    if (controller.signal.aborted || !editor.open) return;
    for (const field of productForm.querySelectorAll('[name]')) field.value = data[field.name];
    setDisabled(false);
    productForm.elements.nombre.focus();
  } catch (error) {
    if (!controller.signal.aborted) showError(productForm, error.message);
  }
}

function productData() {
  const values = new FormData(productForm);
  const nombre = values.get('nombre').normalize('NFC').trim();
  const descripcion = values.get('descripcion').normalize('NFC').trim();
  const URLimagen = values.get('URLimagen').trim();
  const pvp = values.get('pvp').trim().replace(',', '.');
  const stock = Number(values.get('stock'));
  if (nombre.length < 2 || !descripcion) throw new Error('Escribe un nombre de al menos dos caracteres y una descripción.');
  if (!httpsImage(URLimagen)) throw new Error('Introduce una URL HTTPS válida, sin usuario ni contraseña.');
  if (!/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(pvp)) throw new Error('Introduce un PVP entre 0 y 99999999.99, con hasta dos decimales.');
  return { nombre, descripcion, URLimagen, pvp, stock };
}

async function mutate(event, dialog, action) {
  event.preventDefault();
  if (saving) return;
  const form = event.currentTarget;
  const buttons = form.querySelectorAll('button');
  saving = true;
  buttons.forEach((button) => { button.disabled = true; });
  showError(form);
  try {
    const message = await action();
    dialog.close();
    get('notice').textContent = message;
    get('notice').hidden = false;
    await loadProducts();
  } catch (error) {
    showError(form, error.message);
  } finally {
    saving = false;
    buttons.forEach((button) => { button.disabled = false; });
  }
}

productForm.addEventListener('submit', (event) => mutate(event, editor, async () => {
  const id = selectedId;
  await request(id ? '/' + encodeURIComponent(id) : '', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData()),
  });
  return id ? 'Producto actualizado.' : 'Producto creado.';
}));
deleteForm.addEventListener('submit', (event) => mutate(event, removal, async () => {
  await request('/' + encodeURIComponent(selectedId), { method: 'DELETE' });
  return 'Producto eliminado.';
}));
for (const dialog of [editor, removal]) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', (event) => { if (saving) event.preventDefault(); });
}
filters.addEventListener('submit', (event) => {
  event.preventDefault();
  query = { ...query, page: 1, nombre: filters.elements.nombre.value.trim(), orden: filters.elements.orden.value };
  get('notice').hidden = true;
  loadProducts();
});
filters.elements.orden.addEventListener('change', () => filters.requestSubmit());
get('create').addEventListener('click', () => openEditor());
get('previous').addEventListener('click', () => { query.page--; loadProducts(); });
get('next').addEventListener('click', () => { query.page++; loadProducts(); });
loadProducts();
