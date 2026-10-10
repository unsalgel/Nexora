import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Yalnız docker-compose.test.yml ile açılan izole smoke veritabanında çalıştırılır.
const baseUrl = process.env.NEXORA_SMOKE_URL ?? 'http://localhost:18085';
assert(['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname), 'Smoke testi yalnız yerel izole API üzerinde çalıştırılabilir.');
let token;
const request = async (path, method = 'GET', body, expected = 200) => {
  const response = await fetch(`${baseUrl}/api/v1.0/${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => null);
  assert.equal(response.status, expected, `${method} ${path}: HTTP ${response.status}; ${result?.message ?? ''}`);
  if (expected >= 200 && expected < 300) assert.equal(result?.isSuccess, true, `${path}: başarısız Result`);
  return result?.data;
};
const credentials = {
  email: process.env.NEXORA_SMOKE_EMAIL ?? 'smoke-admin@nexora.local',
  password: process.env.NEXORA_SMOKE_PASSWORD ?? 'SmokeTestOnly123*',
};
const session = await request('auth/login', 'POST', credentials);
token = session.accessToken;
const suffix = randomUUID().slice(0, 8);
const categoryId = await request('categories', 'POST', { name: `Smoke ${suffix}` }, 201);
const brandId = await request('brands', 'POST', { name: `Smoke ${suffix}` }, 201);
const productId = await request('products', 'POST', {
  name: `Smoke ürün ${suffix}`, sku: `SMOKE-${suffix}`, description: 'İzole HTTP regresyon fixture',
  price: 149.90, stockQuantity: 5, categoryId, brandId,
}, 201);
const staleProduct = await request(`products/${productId}`);
assert(staleProduct.version > 0, 'PostgreSQL xmin browser sürümü API sözleşmesinde yok.');
if ((await request('cart')).items.length > 0) await request('cart', 'DELETE');
await Promise.all(Array.from({ length: 2 }, () => request('cart/items', 'POST', { productId, quantity: 1 }, 201)));
const cart = await request('cart');
assert.equal(cart.items.length, 1);
assert.equal(cart.items[0].quantity, 2);
const quote = await request('cart/quote', 'POST', {});
assert.equal(quote.subtotal, 299.80);
assert.equal(quote.items[0].unitPrice, 149.90);
assert.equal(quote.items[0].totalPrice, 299.80);
assert.equal(quote.totalAmount, Math.round((quote.subtotal + quote.shippingFee - quote.discountAmount) * 100) / 100);
const checkout = {
  shippingAddress: 'İzole test adresi, İstanbul', expectedTotalAmount: quote.totalAmount,
  paymentInfo: { cardHolderName: 'Smoke Test', cardNumber: '4242424242424242', expirationMonth: '12', expirationYear: '2030', cvv: '123' },
};
await request('orders', 'POST', { ...checkout, expectedTotalAmount: quote.totalAmount + 0.01 }, 409);
assert.equal((await request(`products/${productId}`)).stockQuantity, 5, 'Reddedilen teklif stoğu değiştirdi.');
const order = await request('orders', 'POST', checkout, 201);
assert.equal(order.totalAmount, quote.totalAmount);
assert.equal(order.subtotal, quote.subtotal);
assert.equal(order.shippingFee, quote.shippingFee);
assert.equal(order.discountAmount, quote.discountAmount);
assert.equal((await request('cart')).items.length, 0);
assert.equal((await request(`products/${productId}`)).stockQuantity, 3);
await request(`products/${productId}`, 'PUT', staleProduct, 409);
await request(`products/${productId}/status`, 'PATCH', { isActive: false });
assert.equal((await request(`products/${productId}`)).stockQuantity, 3, 'Durum yaması eski stoğu geri yazdı.');
await request(`products/${productId}/status`, 'PATCH', { isActive: true });
await request(`orders/${order.id}/status`, 'PUT', { newStatus: 999 }, 400);
await request(`orders/${order.id}/status`, 'PUT', { newStatus: 3 });
await request(`orders/${order.id}/status`, 'PUT', { newStatus: 4, trackingNumber: 'SMOKE123', carrier: 'Test Kargo' });
await request(`orders/${order.id}/status`, 'PUT', { newStatus: 6 }, 409);
assert.equal((await request(`products/${productId}`)).stockQuantity, 3, 'Reddedilen iptal stoğu değiştirdi.');
const inventory = await request('dashboard/inventory');
assert(inventory.totalInventoryValue >= 449.70);
await request(`reviews/${randomUUID()}`, 'DELETE', undefined, 404);
await request('auth/revoke-token', 'POST', { refreshToken: session.refreshToken });
await request('cart', 'GET', undefined, 401);
const aliasStatuses = [];
for (let index = 0; index < 24; index++) {
  const version = index % 2 === 0 ? '1' : '1.0';
  const response = await fetch(`${baseUrl}/api/v${version}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid', password: '' }), signal: AbortSignal.timeout(10000),
  });
  assert([400, 429].includes(response.status), 'API version alias farklı bir auth endpointine yönlendi.');
  aliasStatuses.push(response.status);
}
assert.deepEqual(aliasStatuses.slice(-2), [429, 429], 'v1 ve v1.0 ortak auth hız sınırı kullanmıyor.');
console.log('Commerce HTTP smoke başarılı: paralel sepet, sunucu teklifi, mock checkout, snapshot, xmin, durum geçişleri, logout ve v1/v1.0 ortak auth limiti.');
