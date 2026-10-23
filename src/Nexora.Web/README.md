# Nexora.Web — Müşteri Vitrini

Bu uygulama Nexora'nın alışveriş sitesidir. Ürünleri inceleme, sepete ekleme, ödeme ve hesap işlemleri burada yapılır. Çalıştırmadan önce [ana README](../../README.md) içindeki backend kurulumunu tamamlayın.

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

## Özellikler

- Ürün arama, kategori, marka ve fiyat filtreleri
- Ürün seçenekleri, sepet, kupon ve kargo hesaplama
- Kayıt, giriş ve e-posta doğrulama
- Profil, adresler, favoriler ve sipariş geçmişi
- Ürün değerlendirmeleri ve bildirimler
- Ürünler hakkında bilgi veren sohbet asistanı

## Ödeme

Ödeme ekranında teslimat adresi seçildikten sonra iyzico'nun sayfasına geçilir. Kart bilgileri burada girilir. İşlem tamamlandığında `/payment-result` sayfasında sonuç gösterilir. Sonuç henüz belli değilse sayfa belirli aralıklarla güncellenir; elle yenileme seçeneği de bulunur.

İyzico ayarları için [ödeme belgesine](../../docs/iyzico-payments.md) bakabilirsiniz.

## Çalıştırma

Bu klasörde aşağıdaki komutları çalıştırın:

```bash
npm ci
npm run dev
```

Vite geliştirme sunucusunun varsayılan adresi `http://localhost:5173`'tür. Backend varsayılanı `http://localhost:5285`, API kökü `/api/v1`'dir. Adresler uygulamanın yerel `.env.local` dosyasıyla değiştirilebilir:

```dotenv
VITE_BACKEND_URL=http://localhost:5285
VITE_API_URL=http://localhost:5285/api/v1
```

`VITE_` değişkenleri tarayıcı paketine girer; API anahtarları ve parolalar bu dosyaya yazılmaz. İyzico anahtarları yalnız backend'in yapılandırmasındadır.

## Test ve derleme

Testleri çalıştırmak için `npm test`, kod kontrolü için `npm run lint` kullanılır.

Uygulamayı derlemek için:

```bash
npm run build
```

Hazırlanan dosyalar `dist/` klasörüne yazılır. Sonucu bilgisayarınızda görmek için `npm run preview` çalıştırabilirsiniz.
