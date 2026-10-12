import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Yalnız docker-compose.test.yml + docker-compose.browser-test.yml ortamında çalıştırılır.
const base = process.env.NEXORA_SMOKE_URL ?? 'http://127.0.0.1:18085';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
let ready = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try { if ((await fetch(base + '/health/ready', { signal: AbortSignal.timeout(2000) })).ok) { ready = true; break; } } catch { /* Başlangıç sırasında tekrar denenir. */ }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
assert(ready, 'İzole API hazır değil.');
const origin = 'http://127.0.0.1:17774';
let token;
const call = async (path, { method = 'GET', body, headers = {}, status = 200 } = {}) => {
  const response = await fetch(base + '/api/v1.0/' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => null);
  assert.equal(response.status, status, `${path}: ${result?.message || JSON.stringify(result)}`);
  return { response, data: result?.data };
};
const credentials = { email: 'smoke-admin@nexora.local', password: 'SmokeTestOnly123*' };
const login = await call('auth/login', { method: 'POST', body: credentials, headers: { Origin: origin, 'X-Nexora-Client': 'admin' } });
assert.equal(login.data.refreshToken, ''); token = login.data.accessToken;
const cookieHeader = login.response.headers.get('set-cookie');
assert.match(cookieHeader, /httponly/i); assert.match(cookieHeader, /samesite=strict/i);
let cookie = cookieHeader.split(';')[0];
await call('auth/refresh-token', { method: 'POST', body: { refreshToken: '' }, headers: { Cookie: cookie, Origin: 'http://evil.example.test', 'X-Nexora-Client': 'admin' }, status: 401 });
await call('auth/refresh-token', { method: 'POST', body: { refreshToken: '' }, headers: { Cookie: cookie, Origin: 'http://127.0.0.1:17773', 'X-Nexora-Client': 'admin' }, status: 401 });
const refreshed = await call('auth/refresh-token', { method: 'POST', body: { refreshToken: '' }, headers: { Cookie: cookie, Origin: origin, 'X-Nexora-Client': 'admin' } });
assert.equal(refreshed.data.refreshToken, '');
assert.notEqual(refreshed.response.headers.get('set-cookie').split(';')[0], cookie);
cookie = refreshed.response.headers.get('set-cookie').split(';')[0]; token = refreshed.data.accessToken;
await call('products?page=2147483647&pageSize=20', { status: 400 });
await call('auth/register', { method: 'POST', body: { firstName: 'Test', lastName: 'User', email: 'unicode@example.test', password: 'Aa1' + 'ü'.repeat(35) + 'X' }, status: 400 });
const suffix = randomUUID().slice(0, 8);
const category = (await call('categories', { method: 'POST', body: { name: 'Review ' + suffix }, status: 201 })).data;
const brand = (await call('brands', { method: 'POST', body: { name: 'Review ' + suffix }, status: 201 })).data;
const product = (await call('products', { method: 'POST', body: { name: 'Review ' + suffix, sku: 'R-' + suffix, description: 'Review test', price: 30, stockQuantity: 10, categoryId: category, brandId: brand, imageUrls: [] }, status: 201 })).data;
const attribute = (await call('product-attributes', { method: 'POST', body: { name: 'Renk ' + suffix } })).data;
const value = (await call(`product-attributes/${attribute}/values`, { method: 'POST', body: { value: 'Mavi' } })).data;
const variant = (await call(`products/${product}/variants`, { method: 'POST', body: { sku: 'V-' + suffix, price: 35, stockQuantity: 4, attributeValueIds: [value] }, status: 201 })).data;
let variants = (await call(`products/${product}/variants`)).data;
const version = variants.find(v => v.id === variant).version;
await call(`product-variants/${variant}`, { method: 'PUT', body: { sku: 'V-' + suffix, price: 40, stockQuantity: 7, isActive: true, version } });
await call(`product-variants/${variant}`, { method: 'PUT', body: { sku: 'V-' + suffix, price: 40, stockQuantity: 7, isActive: true, version }, status: 409 });
await call(`product-attributes/values/${value}`, { method: 'DELETE', status: 409 });
await call(`products/${product}/status`, { method: 'PATCH', body: { isActive: false } });
const adminToken = token; token = undefined;
await call(`products/${product}`, { status: 404 });
assert.deepEqual((await call(`products/${product}/variants`)).data, []);
token = adminToken;
assert.equal((await call(`products/${product}`)).data.isActive, false);
const revoked = await call('auth/revoke-token', { method: 'POST', body: { refreshToken: '' }, headers: { Cookie: cookie, Origin: origin, 'X-Nexora-Client': 'admin' } });
assert.match(revoked.response.headers.get('set-cookie'), /expires=/i);
token = undefined;
await call('auth/refresh-token', { method: 'POST', body: { refreshToken: '' }, headers: { Cookie: cookie, Origin: origin, 'X-Nexora-Client': 'admin' }, status: 401 });
console.log('Review HTTP smoke başarılı: cookie rotasyonu/CSRF/origin izolasyonu, Unicode sınırı, pagination, pasif katalog, özellik/varyant CRUD ve xmin çakışması.');
