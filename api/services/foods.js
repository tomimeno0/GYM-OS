import { AppError, assert } from '../lib/errors.js';
export function normalizeFood(product) {
  const n = product.nutriments || {};
  const values = [
    n['energy-kcal_100g'] ?? (n.energy_100g == null ? null : n.energy_100g / 4.184),
    n.proteins_100g,
    n.carbohydrates_100g,
    n.fat_100g,
  ];
  const valid = values.every((v) => v != null && Number.isFinite(Number(v)) && Number(v) >= 0);
  return {
    codigo: product.code || '',
    nombre:
      product.product_name_es ||
      product.product_name ||
      product.generic_name ||
      'Alimento sin nombre',
    marca: product.brands || '',
    disponible: valid,
    cantidad: 100,
    unidad: 'g',
    calorias: valid ? Math.round(Number(values[0])) : null,
    proteinas_g: valid ? Number(values[1]) : null,
    carbohidratos_g: valid ? Number(values[2]) : null,
    grasas_g: valid ? Number(values[3]) : null,
    fuente: `Open Food Facts (ODbL), producto ${product.code || ''}`,
  };
}
const cache = new Map();
const requests = [];
export async function searchFoods(q, barcode) {
  const key = barcode || q;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  // All users share this server's upstream IP quota. Cache hits do not consume it.
  while (requests[0] < Date.now() - 60000) requests.shift();
  assert(
    requests.length < 8,
    429,
    'FOOD_RATE_LIMIT',
    'El proveedor permite pocas consultas por minuto. Esperá o registrá el alimento manualmente.',
  );
  requests.push(Date.now());
  const base = process.env.FOOD_API_BASE || 'https://world.openfoodfacts.org';
  assert(
    ['https://world.openfoodfacts.org', 'https://world.openfoodfacts.net'].includes(base),
    503,
    'FOOD_CONFIG',
    'El proveedor de alimentos no está configurado correctamente.',
  );
  const url = barcode
    ? new URL(`/api/v3.6/product/${barcode}.json`, base)
    : new URL('/cgi/search.pl', base);
  url.searchParams.set(
    'fields',
    'code,product_name,product_name_es,generic_name,brands,nutriments',
  );
  if (!barcode)
    for (const [k, v] of Object.entries({
      search_terms: q,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
    }))
      url.searchParams.set(k, v);
  let data;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          process.env.FOOD_USER_AGENT || 'GYM-OS/1.0 (https://github.com/tomimeno0/GYM-OS)',
        ...(base.endsWith('.net')
          ? { Authorization: 'Basic ' + Buffer.from('off:off').toString('base64') }
          : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    throw new AppError(
      503,
      'FOOD_PROVIDER_UNAVAILABLE',
      'No se pudo consultar Open Food Facts. Podés registrar el alimento manualmente.',
    );
  }
  if (barcode)
    assert(
      (data.status === 1 || data.status === 'success') && data.product,
      404,
      'FOOD_NOT_FOUND',
      'No se encontró ese alimento. Podés registrarlo manualmente.',
    );
  const items = (barcode ? [data.product] : data.products || []).map(normalizeFood);
  const result = {
    items,
    source: 'https://world.openfoodfacts.org',
    license: 'Open Database License (ODbL)',
    notice:
      'Datos colaborativos. Verificá los valores y la unidad contra la etiqueta del producto.',
  };
  if (cache.size > 100) cache.delete(cache.keys().next().value);
  cache.set(key, { expires: Date.now() + 10 * 60000, result });
  return result;
}
