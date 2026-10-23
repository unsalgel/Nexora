# Nexora.Web — Müşteri Vitrini

Nexora'nın müşteri vitrinini React ile geliştirdim. Ürün kataloğunu, sepeti, iyzico ödeme akışını ve kullanıcı hesabı ekranlarını bu uygulamada topladım. Backend kurulumunu [ana README](../../README.md) içinde anlattım.

## Kullandığım sürümler

Bu uygulamada kullandığım sürümleri `package-lock.json` kayıtlarına göre aşağıda listeledim.

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

## Mevcut özellikler

Vitrinde şu özelliklere yer verdim:

- Ürün listeleme ve detayları; kategori, marka ve fiyat filtreleri; ürün/varyant seçimi.
- Sepet miktar yönetimi, sunucudan alınan fiyat teklifi, kargo ve kupon hesapları.
- Kayıt, giriş, e-posta doğrulama, profil, adresler, favoriler ve sipariş geçmişi.
- Ürün değerlendirmeleri, bildirimler ve SignalR üzerinden arayüz güncellemeleri.
- Katalog bağlamını kullanan sohbet asistanı; oturuma göre ayrılmış yerel konuşma geçmişi ve bildirim sesi.
- Görsel yükleme hatalarında yedek gösterim, hata sınırı, yükleniyor/boş durumları ve 404 sayfası.

## Ödeme

`/checkout` ekranı teslimat adresini ve güncel sepet tutarını kullanarak iyzico oturumu başlatır. İstek anahtarı tekrar denemelerde aynı ödeme oturumunun kullanılmasını sağlar. Kullanıcı yalnız doğrulanan iyzico HTTPS adresine yönlendirilir.

Kart numarası, son kullanma tarihi ve CVV'yi vitrinde toplamıyorum; kullanıcı bu bilgileri iyzico'nun sayfasında giriyor. Eski doğrudan kart formunu, Luhn/BIN kontrollerini, kart animasyonunu ve sahte ödeme yolunu kaldırdım.

Sağlayıcı dönüşü `/payment-result` sayfasında gösterilir. Sayfa kullanıcı oturumu üzerinden `/payments/status/{orderNumber}` sorgusunu yapar. Sonuç kesinleşene veya sorgu hatası oluşana kadar beş saniye arayla yenilenir; elle yenileme de bulunur. Başarılı ekran yalnız sunucunun `Success` durumu için açılır. URL'deki sipariş numarası tek başına başarı olarak kabul edilmez.

Ödeme durumlarını, callback'i ve backend ayarlarını [ödeme belgesinde](../../docs/iyzico-payments.md) anlattım.

## Çalıştırma

Vitrini bu klasörde aşağıdaki komutlarla çalıştırıyorum:

```bash
npm ci
npm run dev
```

Vite geliştirme sunucusunun varsayılan adresi `http://localhost:5173`'tür. Backend varsayılanı `http://localhost:5285`, API kökü `/api/v1`'dir. Adresler uygulamanın yerel `.env.local` dosyasıyla değiştirilebilir:

```dotenv
VITE_BACKEND_URL=http://localhost:5285
VITE_API_URL=http://localhost:5285/api/v1
```

`VITE_` değişkenleri tarayıcı paketine girer; API anahtarları ve parolalar bu dosyaya yazılmaz. İyzico anahtarları yalnız backend'in yapılandırmasındadır. Üretim paketinde backend adresi belirtilmemişse sayfanın kendi origin'i kullanılır. Vite üretim derlemesi yapılandırılan API ve backend origin'leriyle CSP meta etiketi oluşturur.

## Oturum ve veri

Access token'ı uygulama belleğinde tutuyor, tarayıcı oturumunu HttpOnly cookie üzerinden yeniliyorum. Sorgu önbelleğini kullanıcı ve oturum bağlamına göre ayırdım. Sepet ve ödeme işlemlerinde sunucudan gelen sonucu esas alıyorum.

## Kontroller

Test, lint, derleme ve bağımlılık denetimi için şu komutları kullanıyorum:

```bash
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

`npm test` Node test çalıştırıcısını, `lint` Oxlint'i, `build` TypeScript kontrolü ile Vite derlemesini çalıştırır. Derleme çıktısı `dist/` klasörüne yazılır; `npm run preview` bu çıktıyı yerel olarak sunar. Testler ödeme URL'si doğrulaması, sonuç ekranı, sepet fiyatları ve oturum yarışları gibi davranışları kapsar.

## Klasörler

- `src/components`: ortak arayüz, adres/ödeme bölümleri, düzen ve hata bileşenleri.
- `src/features`: checkout servisleri ve sohbet modülü.
- `src/context`: sepet, favoriler, ayarlar, bildirimler ve toast sağlayıcıları.
- `src/lib`: HTTP istemcisi, oturum ve ortak yardımcılar.
- `src/pages`: rota ekranları; `src/types`: API ve arayüz tipleri.
- `tests`: Node tabanlı regresyon testleri.
