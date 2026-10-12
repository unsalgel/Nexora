# İnceleme düzeltmeleri — çalıştırma ve geçiş notları

12 Ekim 2026. F01–F12 için uygulanan değişikliklerin özeti ve doğrulaması: [HTML kapanış raporu](reviews/nexora-fixes-2026-10-12.html).

## Veritabanı ve mevcut kullanıcılar

- Yeni migration: `20261012074535_ReviewHardening`. `Users.PendingEmailExpiresAtUtc`, `AuditEntries` ve retention indekslerini ekler. Yerel mevcut veritabanına bu çalışma sırasında uygulanmadı; yalnız izole test veritabanlarında uygulandı.
- Normal migration akışınızda, doğru connection string ile `dotnet ef database update --project src/Nexora.Persistence --startup-project src/Nexora.Api` çalıştırın. Şema API'den önce güncellenmelidir. Migration geri alındığında yeni audit tablosu silinir; gerekiyorsa önce yedeğini alın.
- Eski localStorage tokenları ilk açılışta temizlenir. Kullanıcıların bir kez yeniden giriş yapması gerekir. Yeni access token yalnız bellekte, refresh token HttpOnly cookie'de tutulur.
- BCrypt için sınır 72 **UTF-8 byte**. Önceden bundan uzun parola kaydetmiş kullanıcı parola sıfırlamalıdır; mevcut geçerli BCrypt hash'leri değişmez. Sessiz kırpma kabul edilmez.
- Süresi bulunmayan eski pending-email kayıtları adresi rezerve etmez. Kullanıcı yeni e-posta değişikliği isteği başlatabilir. Yeni rezervasyon 15 dakika sürer; profilden iptal edilebilir.
- Pagination: page ≥ 1, pageSize 1–100, offset ≤ 100.000. Sınır dışı istekler 400 döner.

## Tarayıcı oturumu ve hosting

Development varsayılanları Web `http://localhost:5173`, Admin `http://localhost:5174`. `localhost` ve `127.0.0.1` farklı origin'dir. Özel port/host kullanılıyorsa API'de hem CORS hem istemciye özel liste güncellenmelidir:

```text
Cors__AllowedOrigins__0=https://shop.example.test
Cors__AllowedOrigins__1=https://admin.example.test
BrowserSessions__web__AllowedOrigins__0=https://shop.example.test
BrowserSessions__admin__AllowedOrigins__0=https://admin.example.test
```

Origin değerlerine yol veya son slash eklemeyin. Web origin'ini Admin listesine eklemeyin. Production'da izin listesi yoksa tarayıcı girişi reddedilir; HTTPS zorunludur. Cookie `HttpOnly`, `Secure`, `SameSite=Strict`, host-only ve `/api` path kullanır. Web/Admin farklı cookie adları kullanır. Aynı site içinde HTTPS hostları veya her frontend'in kendi origin'inden API proxy'si gerekir; farklı üst alan adlarına cross-site kurulum bu ayarla desteklenmez. Native/API istemcileri `X-Nexora-Client` olmadan mevcut JSON token sözleşmesini kullanabilir.

Vite build CSP meta etiketi üretir; geliştirme sunucusunda uygulanmaz. Aynı-origin üretimde `VITE_BACKEND_URL` ve `VITE_API_URL` vermeyin. Ayrı API origin'i için ikisini build sırasında doğru HTTPS URL'leriyle verin. CSP, JavaScript enjeksiyon riskini azaltan ek katmandır; XSS'i tümüyle önlediği iddia edilmez.

`deploy/nginx.frontend.conf`, derlenmiş `dist` klasörünü `/usr/share/nginx/html` üzerinden sunan bir **referans** proxy yapılandırmasıdır. Her frontend ayrı host/container olarak sunulur. `api:8080` upstream'ini kendi ağa göre uyarlayın. Yalnız güvenilir TLS sonlandırıcısının arkasındaki özel ağda dinletin; şablon gelen bağlantının TLS'ten geçtiğini varsayarak `X-Forwarded-Proto: https` yazar. API `ReverseProxy:KnownProxies` listesine gerçek doğrudan proxy IP'sini ekleyin. API portunu dışarı açmayın. Sertifika, DNS ve gerçek TLS dağıtımı bu değişikliğin parçası olarak kurulmadı veya doğrulanmadı. Ayrı API origin'i varsa nginx CSP `connect-src`/görsel kaynaklarını da uyarlayın; HTTP başlığı ve meta CSP birlikte kısıtlar.

## Audit ve retention

Audit, stok/fiyat/aktiflik, rol, kullanıcı aktifliği, katalog özellikleri ve izin verilen ayar değişikliklerini actor/target/trace ve önceki/yeni değerle aynı transaction'da kaydeder. Parola, token, e-posta ve iletişim ayarı değerleri whitelist dışındadır. Arka plan işlemlerinde actor boş olabilir. Bu tablo değiştirilemez harici denetim arşivi değildir; DB yetkileri ayrıca sınırlandırılmalıdır.

Hangfire `LogRetentionJob`: Logs 30 gün, AuditEntries 365 gün; her çalışmada her tablodan en fazla 1.000 satır, dakikalık çalışma. Hangfire çalışmıyorsa temizlik gerçekleşmez; yüksek üretim hacminde temizlik kapasitesi ölçülmelidir. DB logger zaman aşımı 1 saniye ile sınırlandırıldı.

## Tekrarlanabilir doğrulama

```powershell
docker compose -p nexora-review-tests -f docker-compose.test.yml --profile smoke up -d --build --wait
node scripts/smoke-api.mjs
node scripts/smoke-commerce.mjs
docker compose -p nexora-review-tests -f docker-compose.test.yml -f docker-compose.browser-test.yml --profile smoke up -d --force-recreate api
node scripts/smoke-review.mjs
docker compose -p nexora-review-tests -f docker-compose.test.yml --profile smoke down --remove-orphans
```

Browser override yalnız yerel HTTP regresyonları içindir; production deployment'a eklenmez. Test compose gerçek SMTP/ödeme kullanmaz. Backend entegrasyon testleri için compose portlarına uyan `NEXORA_TEST_POSTGRES` ve `NEXORA_TEST_REDIS` değişkenlerini ayarlayın; ardından `dotnet test Nexora.sln -c Release` çalıştırın. Web ve Admin klasörlerinde `npm run test`, `npm run lint`, `npm run build` kullanın.

Önceki incelemenin ek gelişim önerileri (framework yükseltme, yük/restore tatbikatı, çok-instance desteği vb.) ayrı yol haritasıdır. F01–F12 kapanışı üretim sertifikası veya bütün gelecekteki ihtiyaçların tamamlandığı anlamına gelmez. Mock ödeme korunmuştur.
