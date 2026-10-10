import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';

// Yalnızca ayrılmış smoke ortamında çalıştırılır; varsayılanlar docker-compose.test.yml ile aynıdır.
const baseUrl = process.env.NEXORA_SMOKE_URL ?? 'http://localhost:18085';
const endpoint = path => `${baseUrl}${path}`;
let ready = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(endpoint('/health/ready'), { signal: AbortSignal.timeout(3000) });
    if (response.status === 200) { ready = true; break; }
  } catch { /* Başlangıç süresince bağlantı tekrar denenir. */ }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
assert(ready, 'API PostgreSQL/Redis hazır olma kontrolünden geçemedi.');
assert.equal((await fetch(endpoint('/health/live'))).status, 200);
assert.equal((await fetch(endpoint('/api/v1.0/media/upload'), { method: 'POST' })).status, 401);
assert.equal((await fetch(endpoint('/api/v1.0/auth/login'), {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'invalid', password: '' }),
})).status, 400);
const login = await fetch(endpoint('/api/v1.0/auth/login'), {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: process.env.NEXORA_SMOKE_EMAIL ?? 'smoke-admin@nexora.local', password: process.env.NEXORA_SMOKE_PASSWORD ?? 'SmokeTestOnly123*' }),
});
assert.equal(login.status, 200, `Smoke admin girişi başarısız: HTTP ${login.status}`);
const token = (await login.json()).data.accessToken;
assert.equal(typeof token, 'string');
const upload = async bytes => {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'image/png' }), 'smoke.png');
  return fetch(endpoint('/api/v1.0/media/upload'), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
};
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
assert.equal((await upload(signature)).status, 400, 'Sadece PNG imzası olan bozuk görsel kabul edildi.');
const crc32 = bytes => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const contents = Buffer.concat([Buffer.from(type), data]);
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(contents));
  return Buffer.concat([size, contents, crc]);
};
const header = Buffer.alloc(13); header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6;
const png = Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0, 255]))), chunk('IEND', Buffer.alloc(0))]);
const uploaded = await upload(png);
assert.equal(uploaded.status, 200, `Geçerli görsel/native codec kontrolü başarısız: HTTP ${uploaded.status}`);
const url = (await uploaded.json()).data;
assert.match(url, /^\/uploads\/products\/[a-f0-9]{32}\.png$/);
assert.equal((await fetch(endpoint(url))).status, 200, 'Yüklenen görsel okunamadı.');
console.log('API smoke başarılı: health, readiness, auth sınırı, validation ve Alpine native PNG decode/reencode.');
