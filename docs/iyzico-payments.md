# İyzico ödeme ayarları

Kurulum ve uygulamaları çalıştırma adımları [ana README](../README.md) içindedir. Bu belge ödeme ayarlarını ve panelde karşılaşılabilecek durumları açıklar.

## Ayarlar

Aşağıdaki değerler projenin ana klasöründeki `.env` dosyasına yazılır:

| Alan | Açıklama |
|---|---|
| `IYZICO_API_KEY` | İyzico hesabının API anahtarı |
| `IYZICO_SECRET_KEY` | Aynı hesabın güvenlik anahtarı |
| `IYZICO_BASE_URL` | Sandbox için `https://sandbox-api.iyzipay.com`, canlı ortam için `https://api.iyzipay.com` |
| `IYZICO_CALLBACK_URL` | API'nin dışarıdan erişilebilen HTTPS adresi; sonu `/api/v1/payments/callback` olmalı |
| `Frontend__BaseUrl` | Kullanıcının ödeme sonrası döneceği alışveriş sitesinin adresi |

API adresi ve anahtarlar aynı ortama ait olmalıdır. Sandbox anahtarlarını sandbox adresiyle kullanın. Yerel geliştirmede localhost HTTP callback kabul edilir; iyzico üzerinden ödeme denemek için API'ye dışarıdan HTTPS ile ulaşılabilmesi gerekir.

## Ödeme nasıl ilerler?

Kullanıcı teslimat adresini seçip ödemeye geçtiğinde tutar sunucuda hesaplanır, stok ve kupon hakkı ayrılır. Kullanıcı iyzico'nun ödeme sayfasına yönlendirilir. Kart bilgileri orada girilir; ödeme tek çekim olarak başlatılır.

İyzico sonucu API'ye iletir. API, ödemeyi iyzico üzerinden doğrular ve kullanıcıyı alışveriş sitesindeki `/payment-result` sayfasına yönlendirir. Bu sayfa giriş yapan kullanıcının ödeme sonucunu gösterir.

Tarayıcı kapansa veya sonuç hemen gelmese de bekleyen ödemeler arka planda kontrol edilir. Sonuç kesinleşene kadar ayrılan stok ve kupon hakkı tutulur.

## Ödeme durumları

| Durum | Anlamı |
|---|---|
| `Pending` | Ödeme bekleniyor. |
| `Unknown` | İyzico'dan kesin sonuç alınamadı; kontrol devam ediyor. |
| `UnderReview` | Tahsilat var, iyzico'nun güvenlik incelemesi bekleniyor. Sipariş sevk edilemez. |
| `RequiresAttention` | Ödeme bilgilerinde uyumsuzluk var veya sonuç 24 saattir kesinleşmedi. İyzico panelinden kontrol edilmeli. |
| `Success` | Ödeme doğrulandı. |
| `Failed` | Ödeme başarısız olarak doğrulandı; ayrılan stok ve kupon hakkı serbest bırakılır. |

`RequiresAttention` durumundaki siparişin tahsilat ve iade bilgilerini iyzico panelindeki kayıtla karşılaştırın. Yalnızca süre geçtiği için ödeme başarısız sayılmaz.

## İptal ve iade

Ödeme sonucu belli olmadan sipariş iptal edilemez. Ödemesi alınan siparişte iptal için iadenin doğrulanması gerekir. Nexora panelinden otomatik iyzico iadesi yapılamaz.
