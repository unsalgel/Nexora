# Nexora.Admin — Yönetim Paneli

Nexora'nın katalog, sipariş, kupon, kullanıcı ve site ayarlarını yönetmek için bu React panelini geliştirdim. Backend kurulumunu [ana README](../../README.md) içinde anlattım.

## Kullandığım sürümler

Bu panelde kullandığım sürümleri `package-lock.json` kayıtlarına göre aşağıda listeledim.

| Bileşen | Sürüm |
|---|---|
| React | 19.2.8 |
| TypeScript | 6.0.3 |
| Vite | 8.3.5 |
| Tailwind CSS | 4.3.3 |
| React Router | 7.18.2 |
| TanStack React Query | 5.101.4 |
| Axios | 1.20.0 |
| SignalR istemcisi | 10.0.11 |
| Oxlint | 1.78.0 |

## Mevcut modüller

Yönetim işlemlerini şu ekranlarda topladım:

| Rota | Kapsam |
|---|---|
| `/` | Satış, sipariş ve envanter özetleri; dönemsel grafikler |
| `/products` | Ürün, fiyat, stok, varyant, özellik ve görsel yönetimi |
| `/categories` | Kategori ağacı ve kategori işlemleri |
| `/brands` | Marka işlemleri ve aktif/pasif durum yönetimi |
| `/orders` | Sipariş arama, detay, durum ve kargo bilgileri |
| `/coupons` | Sabit/yüzdelik indirim, limit ve geçerlilik kuralları |
| `/reviews` | Ürün değerlendirmelerinin yönetimi |
| `/users` | Kullanıcı, rol ve aktif/pasif hesap yönetimi |
| `/settings` | Site ayarları |

Panelde bildirimler, toast mesajları, yükleniyor/boş durumları, hata sınırı ve 404 ekranı bulunur. Ürün görselleri dosya yükleme veya URL ile tanımlanabilir. Yükleme API'si JPG, PNG ve WebP görsellerini doğrulayıp yeniden encode eder; dosya boyutu sınırı 5 MiB'dır.

## Yetkilendirme ve oturum

Panel rotalarını `AdminRoute` ile koruyorum; yönetim API'lerinde ayrıca sunucu tarafında `Admin` rolü kontrol ediliyor. Access token'ı bellekte tutuyor, tarayıcı oturumunu HttpOnly cookie ile yeniliyorum. Çıkış ve hesap yetkisi değişikliklerini sunucudaki oturum iptaliyle birlikte ele aldım. Sistemde yönetici kalmamasını önlemek için son aktif yöneticinin rolünün kaldırılmasını veya hesabının pasifleştirilmesini engelledim.

İlk yönetici hesabını backend'deki `ADMIN_SEED_EMAIL` ve `ADMIN_SEED_PASSWORD` alanlarıyla yapılandırıyorum. Gerçek hesap bilgilerini README veya frontend yapılandırmasında paylaşmıyorum. İyzico anahtarlarını da yalnız backend tarafında tutuyorum.

## Sipariş ve ödeme davranışı

İyzico akışında sipariş numaraları için `NX-YYYYMMDD-XXXXXXXX` biçimini kullanıyorum; son bölüm sekiz hexadecimal karakterden oluşuyor. Siparişin lojistik durumunu ödeme durumundan ayrı tutuyorum.

Ödeme ve fraud onayı tamamlanmadan online sipariş hazırlanıyor, kargoda veya teslim edildi durumuna geçirilemez. Normal ilerleme `Pending → Paid → Processing → Shipped → Delivered` şeklindedir. Kargolanmış sipariş önceki duruma döndürülemez; iptal bütün durumlardan kullanılabilen bir geçiş değildir.

Online siparişin iptali ödeme başarısızlığı veya doğrulanmış iade durumu gerektirir. Otomatik iyzico iade API'si mevcut değildir. Belirsiz ödeme sonuçları backend'deki uzlaştırma işiyle takip edilir. Ayrıntılar [ödeme belgesinde](../../docs/iyzico-payments.md) bulunur.

## Çalıştırma

Paneli bu klasörde aşağıdaki komutlarla çalıştırıyorum:

```bash
npm ci
npm run dev
```

Yönetim panelinin yapılandırılmış geliştirme portu `5174`'tür. Backend varsayılanı `http://localhost:5285`, API kökü `/api/v1`'dir. Uygulamaya ait yerel `.env.local` dosyasında adresler değiştirilebilir:

```dotenv
VITE_BACKEND_URL=http://localhost:5285
VITE_API_URL=http://localhost:5285/api/v1
VITE_WEB_URL=http://localhost:5173
```

`VITE_WEB_URL` müşteri vitrininin adresidir. `VITE_` değerleri tarayıcı paketine girer; parola, JWT imzalama anahtarı veya iyzico anahtarı içermez. Üretim paketinde backend adresi belirtilmemişse panelin kendi origin'i kullanılır. Vite üretim derlemesi yapılandırılan API ve backend origin'leriyle CSP meta etiketi oluşturur.

## Kontroller

Test, lint, derleme ve bağımlılık denetimi için şu komutları kullanıyorum:

```bash
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

`npm test` Node tabanlı regresyon testlerini, `lint` Oxlint'i, `build` TypeScript kontrolü ile Vite derlemesini çalıştırır. Derleme çıktısı `dist/` klasörüne yazılır; `npm run preview` yerel önizleme sağlar. GitHub Actions bu paneli müşteri vitriniyle ayrı işler olarak kontrol eder.
