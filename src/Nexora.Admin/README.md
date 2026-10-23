# Nexora.Admin — Yönetim Paneli

Bu panelden Nexora'nın ürünleri, siparişleri, kuponları, kullanıcıları ve site ayarları yönetilir. Çalıştırmadan önce [ana README](../../README.md) içindeki backend kurulumunu tamamlayın.

## Teknolojiler ve sürümler

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

Yönetim ekranları:

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

Ürün görselleri dosya yüklenerek veya görsel adresi girilerek eklenebilir. Dosya yüklerken JPG, PNG veya WebP biçimini kullanın. Dosya boyutu en fazla 5 MiB olabilir.

## Yönetici hesabı

Panele giriş için yönetici yetkisi olan bir hesap gerekir. İlk hesabın e-posta adresi ve parolası, backend'in `.env` dosyasındaki `ADMIN_SEED_EMAIL` ve `ADMIN_SEED_PASSWORD` alanlarında belirlenir.

Kullanıcı ekranından roller ve hesapların aktiflik durumu değiştirilebilir. Sistemdeki son aktif yönetici pasifleştirilemez veya yönetici rolü kaldırılamaz.

## Siparişler

Sipariş ekranında sipariş detayları, ödeme durumu ve kargo bilgileri görüntülenir. Ödeme iyzico tarafından onaylanmadan sipariş hazırlama ve kargolama aşamalarına geçirilemez. Kargoya verilen sipariş önceki durumuna döndürülemez.

Ödemesi alınan bir siparişin iptali için iadenin doğrulanmış olması gerekir. Panelden otomatik iyzico iadesi yapılamaz. Ayrıntılar [ödeme belgesinde](../../docs/iyzico-payments.md) bulunur.

## Çalıştırma

Bu klasörde aşağıdaki komutları çalıştırın:

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

`VITE_WEB_URL` müşteri vitrininin adresidir. `VITE_` değerleri tarayıcı paketine girer; parola, JWT imzalama anahtarı veya iyzico anahtarı içermez.

## Test ve derleme

Testleri çalıştırmak için `npm test`, kod kontrolü için `npm run lint` kullanılır.

Uygulamayı derlemek için:

```bash
npm run build
```

Hazırlanan dosyalar `dist/` klasörüne yazılır. Sonucu bilgisayarınızda görmek için `npm run preview` çalıştırabilirsiniz.
