# İyzico ödeme akışı ve dağıtım

Checkout Form, iyzico'nun barındırdığı HTTPS ödeme sayfasında açılır. Nexora sayfasına sağlayıcı scripti enjekte edilmez; mevcut CSP korunur. Bu sürüm tek çekim ödeme başlatır.

## Yapılandırma

- `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`: ilgili sandbox/canlı hesabın gizli anahtarları.
- `IYZICO_BASE_URL`: `https://sandbox-api.iyzipay.com` veya `https://api.iyzipay.com`.
- `IYZICO_CALLBACK_URL`: dışarıdan erişilebilir `https://<api-host>/api/v1/payments/callback`. Eski `/api/payments/iyzico-callback` adresi kullanılmaz. `.env` içindeki eski değeri de güncelleyin.
- `Frontend__BaseUrl`: mağazanın güvenilir HTTPS adresi. Dönüş yolu `/payment-result` olarak sunucuda belirlenir; istemci dönüş URL'si seçemez.

Development ortamında localhost HTTP callback kullanılabilir; iyzico sandbox uçtan uca testi için dışarıdan erişilebilir HTTPS adresi gerekir. Üretimde eksik anahtar, uygunsuz API adresi ve geçersiz callback ayarı başlangıç doğrulamasında reddedilir. Smoke compose dosyasındaki anahtarlar yalnız test yer tutucularıdır.

## Veritabanı

API sürümüyle birlikte `20261023180557_HardenIyzicoPaymentLifecycle` migration'ı uygulanmalıdır. Canlı veritabanına bu çalışma sırasında migration uygulanmadı.

Migration ödeme token'ını eski `IdempotencyKey` alanından ayrı `PaymentToken` alanına taşır, ödeme kimliğini ve sonraki sorgu zamanını saklar. Mevcut ödenmiş siparişlerin düşülmüş stoğu işaretlenir. Eski Pending iyzico siparişleri için stok rezervasyonu uydurulmaz; tahsilat bulunursa manuel incelemeye alınır. Token ve ödeme kimliği için benzersiz indeksler bulunur.

Dağıtım sırasında eski API/worker sürümleri durdurulmalıdır: eski callback kodu rezervasyonu bilmeden tekrar stok düşebilir. Aktif rezervasyonlar varken eski sürüme dönüş veya migration geri alma yapılmamalıdır.

## İşleyiş

1. `/api/v1/payments/initialize` kimlik doğrulaması ve istek anahtarı gerektirir. Kullanıcı, sepet, ürün/varyant uygunluğu ve fiyatlar sunucuda doğrulanır. Kullanıcı sepeti, ilgili ürünler ve kupon deterministik kilitlerle korunur.
2. Stok ve kupon hakkı aynı transaction'da ayrılır. Ödeme URL'si ancak veritabanı commit'i başarılı olduktan sonra istemciye verilir. Aynı istek anahtarı yeni rezervasyon oluşturmaz.
3. iyzico `application/x-www-form-urlencoded` biçiminde `token` gönderir. Callback token'ı yalnız kendi siparişiyle eşler ve sağlayıcıdan sonucu sorgular. Tutar, para birimi, ödeme kimliği, sipariş kimliği ve fraud onayı doğrulanmadan sipariş Paid olmaz.
4. Başarıda stok ikinci kez düşülmez. Kupon rezervasyonu kullanıma çevrilir; yalnız başlangıçtaki sepet satırlarından satın alınan miktar çıkarılır. Bildirim ve e-posta outbox kaydı aynı transaction'dadır.
5. Callback `303` ile mağazaya döner. URL'deki sipariş numarası ödeme kanıtı değildir; sonuç ekranı giriş yapmış kullanıcıya ait `/payments/status/{orderNumber}` kaydını sorgular.
6. Hangfire `payment-reconciliation` işi her dakika vadesi gelen en fazla 100 kaydı sorgular. Belirsiz sonuçlar beş dakika sonra yeniden kontrol edilir. Callback kaybolsa veya tarayıcı kapansa da takip kalıcıdır.

## Belirsiz sonuçlar ve iptal

- `Pending`: ödeme bekleniyor, stok ve kupon hakkı ayrılmış durumda.
- `Unknown`: ağ/sağlayıcı yanıtı sonucu kesinleştirmedi. Banka reddi olarak işaretlenmez.
- `UnderReview`: tahsilat var, fraud onayı bekleniyor; sevkiyat yapılamaz.
- `RequiresAttention`: tutar/kimlik/fraud/rezervasyon uyumsuzluğu veya 24 saati aşan belirsizlik. İş yeniden sorgulamaya devam eder; logda sipariş numarasıyla uyarı ve kullanıcıya bir kez bildirim oluşturulur.
- `Success`: kesin onay. Tekrarlanan callback sevkiyat durumunu, stoğu veya kuponu değiştirmez.
- `Failed`: sağlayıcının ilgili sipariş için kesin başarısız sonucu. Ayrılan stok ve kupon hakkı bir kez serbest bırakılır.

Yaşı dolduğu için bir online ödeme kendiliğinden başarısız sayılmaz. Sonuç belirsizken rezervasyon tutulur; sağlayıcı incelemesi tamamlanana kadar serbest bırakılmaz. `RequiresAttention` kayıtları operasyon ekibince iyzico panelindeki tahsilat/iade kaydıyla karşılaştırılmalıdır. Doğrulanmış tahsilat, iade edilmiş gibi işaretlenmemelidir.

Online siparişin kullanıcı/admin iptali, ödeme sonucu kesinleşmeden veya tahsilat iade edilmeden engellenir. Bu değişiklik otomatik iade API'si eklemez. Önceden mevcut `FakePaymentService` yalnız `Development` ortamında çalışır; diğer ortamlarda isteği reddeder. Üretim Web derlemesinde doğrudan test kartı seçeneği ve formu gösterilmez. Container smoke önce Production ortamında sahte ödemenin reddedildiğini kontrol eder, ardından izole Development ortamında simüle checkout regresyonlarını çalıştırır.

## Doğrulama

291 backend testi, PostgreSQL/Redis entegrasyonları dahil geçti. Yeni testler gerçek HTTP form callback/303/auth sözleşmesini; stok ve kupon yarışlarını; paralel callback tekrarını; migration veri aktarımını; fraud, tutar ve geçici hata davranışlarını; kayıp callback'in iş tarafından tamamlanmasını kapsar. Web tarafında 30 test ve üretim derlemesi geçti. Production Alpine konteynerinde HTTP/native codec smoke ve sahte ödeme reddi, izole Development konteynerinde checkout regresyonları doğrulandı.

Gerçek sandbox tahsilatı yapılmadı. Canlıya geçişten önce sandbox anahtarları ve erişilebilir HTTPS callback ile ödeme, dönüş, banka reddi ve fraud incelemesi uçtan uca denenmelidir.
