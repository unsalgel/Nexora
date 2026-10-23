# Kod inceleme düzeltmeleri — 23 Ekim 2026

Bu çalışma yerel bir hobi/öğrenme projesinin önceki inceleme bulgularını giderir. Gerçek ödeme sağlayıcısı entegrasyonu kapsam dışıdır. Sipariş oluşturmanın tekrar deneme ve veri tutarlılığı davranışı kapsam içindedir.

Önceki [HTML inceleme](nexora-tam-code-review-2026-10-23.html) düzeltme öncesi durumu ve 7,8/10 değerlendirmesini belgeler; mevcut kodun yeniden puanlaması değildir.

## Bulguların karşılığı

| Bulgu | Yapılan değişiklik |
| --- | --- |
| F01 — sipariş tekrarı | Anahtar ve istek özeti siparişle aynı transaction içinde PostgreSQL'e kaydedilir. Aynı kullanıcı/anahtar benzersizdir. İstemci aynı sipariş denemesinde anahtarı korur. |
| F02 — silinmiş katalog ilişkisi | Ürün oluşturma, güncelleme ve etkinleştirme ortak ilişki kontrolünü kullanır. Marka/kategori silme ile ürün işlemleri ortak transaction kilidine katılır. |
| F03 — kupon formunun eski düzenleme durumu | Yeni kupon açılışı formu ve seçili kaydı sıfırlar; modal başlığı işleme göre değişir. |
| F04 — sabit kuponda gizli üst sınır | Sabit indirim gönderilirken `maximumDiscountAmount: null` kullanılır; tür değişince eski sınır temizlenir. Oluşturma/güncelleme aynı payload üretimini kullanır. |
| F05 — gecikmiş marka logosu | Form nesli değiştiyse eski yükleme sonucu işlenmez. Yükleme sürerken kayıt gönderilmez. |
| F06 — ürün ana görseli kaldırılamıyor | `RemoveMainImage` açık bir silme niyetidir. Güncel ürün sürümüyle kontrol edilir; varsa sıradaki görsel ana görsel olur. |
| F07 — durum düğmesi eski alanları yazıyor | Marka ve kategori için yalnız `IsActive` değiştiren, Admin yetkili PATCH uçları eklendi. |
| F08 — doğrulamaya devam edilemiyor | `/verify-email` adresi kayıt ekranından bağımsız çalışır. E-posta ve kod tekrar girilebilir; kod yeniden istenebilir. Tekrarlanan kayıt ekranı ortak akışa yönlendirildi. |
| F09 — hızlı sepet tıklamaları | Mutasyon tamamlanıp güncel sepet yüklenene kadar düğmeler kapanır. Senkron ref kilidi aynı render içinde ikinci isteği de engeller. |
| F10 — asistanın yanlış politika bilgisi | Kargo hesabı, ayar sorgusu ve asistan `ShippingPolicy` kullanır. Var olmayan iade ekranı ve doğrulanmamış teslimat taahhütleri kaldırıldı. |
| S01 — kayıt ile hesap sorgulama | Mevcut ve yeni e-posta için aynı başarılı genel yanıt üretilir. Mevcut hesabın parolası, adı veya doğrulama kodu değiştirilmez. |
| S02 — modelin dış bağlantıları | Yalnız tanımlı yerel rotalar tıklanabilir. Dış adres, protokol, kodlanmış yönlendirme ve bilinmeyen yollar düz metindir. |
| O01 — çalışan konteynerlerin ağ bağlaması | Salt okunur `check-local-bindings.mjs` denetimi eklendi. Çalışan ortamın değişikliği aşağıdaki nedenle ayrıca ele alınmalıdır. |

## Önemli kodlar ve bilmen gerekenler

### 1. Idempotency: aynı isteğin tekrarından ikinci sipariş oluşmaması

`CreateOrderCommandHandler` önce `usercart:{UserId}` transaction kilidini alır, sonra önceki siparişi arar. İkinci eşzamanlı istek ilk işlem bitene kadar bekler. İlk sipariş kaydedildiyse ikinci istek boşalmış sepeti işlemeye çalışmak yerine aynı sipariş kimliğini döndürür.

`OrderConfiguration` üzerindeki `(UserId, IdempotencyKey)` benzersiz indeksi ikinci savunmadır. Uygulama kontrolü unutulsa bile veritabanı aynı kullanıcı/anahtarla ikinci siparişi kabul etmez. Anahtar verilmemiş eski istemciler için kolon nullable'dır; bu istemciler tekrar korumasından yararlanmaz.

`RequestHash`, normalize edilmiş adres, kupon, kullanıcı ve beklenen tutarın JSON gösteriminden hesaplanır. Aynı anahtarla farklı istek 409 döner. Kart bilgisi bu özete veya sipariş kaydına eklenmez. Hash şifreleme değildir; hassas veri saklamak için genel çözüm olarak kullanma.

`orderAttempt.ts` ağ hatasında aynı anahtarı korur; sipariş niyeti değişirse yeni anahtar üretir. Bu bellek içi deneme sayfa yenilendiğinde sıfırlanır. Kullanıcı belirsiz bir ağ hatasından sonra sayfayı yenilemişse yeni sipariş vermeden önce Siparişlerim'i kontrol etmelidir. Sunucu, istemci aynı anahtarı sağladığı sürece kalıcı kayıttan tekrar yanıtlayabilir. Tekrar yanıtında siparişin güncel durumu döner; bu bir donmuş yanıt önbelleği değildir.

Gerçek bir ödeme sağlayıcısıyla ağ üzerinden yapılan tahsilat ile yerel veritabanı commit'i tek transaction olamaz. Buradaki değişikliği gerçek tahsilat için “tam olarak bir kez ödeme” garantisi olarak yorumlama. Mevcut sahte ödeme akışı korunmuştur.

### 2. Transaction kilidi ile sürüm kontrolü farklı sorunları çözer

`CatalogRelations` kontrolü silinmiş marka/kategoriye ürün bağlanmasını engeller. Kontrol ile kayıt arasında başka bir istek ilişkiyi silemesin diye ilgili yazma işlemleri aynı `catalog-relations` kilidini kullanır. Mevcut `media-reference` veya `category-tree` kilidi gerekiyorsa önce o alınır; kilit sırasını ters çevirmek deadlock oluşturabilir.

Bu global katalog kilidi yazma işlemlerini sıraya koyar. Hobi projesi için anlaşılır ve ölçülü bir seçimdir; yüksek yazma hacminde daha dar kilitler ancak ölçüm ve aynı invariant korunarak tasarlanmalıdır. İleride ekleyeceğin toplu import veya yeni handler da bu protokole katılmalıdır. Doğrudan SQL yazımı uygulama kilitlerini kendiliğinden kullanmaz.

Ürünün mevcut `Version/xmin` kontrolü ise eski ekrandan gelen düzenlemeyi reddeder. Kilit, stale formun kullanıcı niyetini anlayamaz; sürüm kontrolünün yerine geçmez.

### 3. Dar komutlar eski verinin geri yazılmasını azaltır

`UpdateBrandStatusCommand` ve `UpdateCategoryStatusCommand` yalnız durum alanını değiştirir. Örneğin başka sekmede marka adı değişmişse durum düğmesi eski adı tekrar göndermez. Tam düzenleme ekranlarının tümüne optimistic concurrency eklenmiş değildir; bu düzeltmenin kapsamı durum düğmeleridir.

Controller, URL'deki kimliği komuta yerleştirir ve Admin yetkisini denetler. İş kuralı Application katmanında kalır. Handler'lar arayüzlere bağımlıdır; yeni bir repository veya gereksiz genel servis katmanı eklenmemiştir.

### 4. `null`, “değiştirme” ve “sil” aynı şey değildir

`UpdateProductCommand.RemoveMainImage`, kullanıcı görseli kaldırmak istediğinde açıkça gönderilir. `MainImageUrl: null` tek başına mevcut görseli silmez; böylece yalnız metin düzenleyen eski istemciler yanlışlıkla medya silemez. Aynı istekte hem kaldırma hem yeni URL gönderilmesi reddedilir. Görsel kaydı ürün işlemiyle atomik kaldırılır; fiziksel dosyanın yaşam döngüsü mevcut temizlik mekanizmasında kalır.

### 5. React state güncellemesi senkron kilit değildir

`CartContext` içindeki `useRef` kilidi olay işleyicisi çalıştığı anda kurulur. React yeniden render etmeden ikinci tıklama gelse bile ikinci istek gönderilmez. Sunucu yanıtından sonra sepetin yeniden yüklenmesi de kilidin kapsamındadır. Kullanıcı bir sonraki değişikliği güncel miktar üzerinden yapar; ara tıklamalar kuyruğa alınmaz.

Marka formundaki `formGeneration` aynı prensibin farklı kullanımıdır: yükleme başladığı formun numarasını saklar. Form kapatılıp başka marka açılmışsa gelen yanıt artık o forma ait değildir. İsteği iptal etmek tek başına yeterli olmayabilir; sonuç uygulanırken de kimlik kontrol edilmelidir.

### 6. Doğrulama akışı parola saklamaya ihtiyaç duymaz

`VerifyEmailPage` bağımsızdır. Kullanıcı e-posta adresini yeniden girebilir. Parola localStorage/sessionStorage'a yazılmaz; başarılı kayıt yönlendirmesinde formdaki parola temizlenir. Doğrulama sonrasında kullanıcı giriş ekranına gider. Kayıt sayfası artık ortak giriş/kayıt formuna yönlenir; iki ayrı kayıt uygulaması tutulmaz.

Genel kayıt yanıtı yalnız durum/gövde üzerinden açık hesap keşfini kapatır. Süre ölçümlerinin tamamen eşitlendiği iddia edilmez. Kod üretimi, süre sınırı, deneme limiti ve mevcut sunucu korumaları geçerliliğini korur.

### 7. Yapay zekâ yanıtı güvenilir uygulama verisi değildir

`safeChatLink` bir izin listesi uygular. Modelin yazdığı metin, tıklanabilir dış bağlantıya otomatik dönüştürülmez. Ürün kartları için mevcut sunucu doğrulaması korunur. `ShippingPolicy`, gerçek tutar ve eşik değerlerini asistanın bağlamına taşır; modelin yine de yanlış cümle kurması tamamen engellenmiş sayılmaz. Nihai sepet tutarı her zaman sunucu hesabıdır.

### 8. DRY yalnız satır azaltmak değildir

`ShippingPolicy` tek iş kuralını, `OrderMapping` tek DTO dönüşümünü ve kupon payload üretimi tek gönderim sözleşmesini paylaşır. Ortak frontend test harness'i yalnız testlerin modül yükleme, hook ve ağaç dolaşım altyapısını paylaşır. İş mantığı test içine kopyalanmaz; testler gerçek TS/TSX kaynaklarını çalıştırır.

## Veritabanı geçişi

`PersistOrderIdempotency` migration'ı iki nullable kolon ve filtreli benzersiz indeks ekler. Eski siparişleri silmez veya yeniden oluşturmaz. Kullanıcı sipariş listeleri için mevcut `UserId` indeksi korunur. API'nin yeni sürümünü çalıştırmadan önce migration uygulanmalıdır; projenin mevcut otomatik migration ayarı açıksa başlangıçta uygulanır. Yerel veritabanına bu inceleme sırasında migration uygulanmamıştır; geçiş izole test ortamında doğrulanır.

## O01: çalışan ortam için kalan adım

`node scripts/check-local-bindings.mjs` mevcut `nexora-db`, `nexora-redis`, `nexora-pgadmin` konteynerlerinin yalnız port bağlamalarını okur; secret/env içeriklerini yazdırmaz. Test tarihinde 5432, 6379 ve 5050 portları `0.0.0.0` ve `::` üzerinden yayınlanıyordu. Bu, ağ/güvenlik duvarı izin verirse yerel ağdan erişim anlamına gelir; tek başına internetten erişim kanıtı değildir.

Repo `docker-compose.yml` zaten `127.0.0.1` kullanıyor. Dosyayı değiştirmek veya `docker restart` yapmak çalışan konteynerin yayınlanmış portunu değiştirmez. Yerel ortamı düzeltmeden önce PostgreSQL major sürümünü, gerçek veri volume adını, compose proje adını ve yedeğini doğrula. Sonra aynı veri volume'u ve uyumlu image sürümüyle localhost bağlaması kullanarak konteyneri yeniden oluştur; denetimi tekrar çalıştır. Körlemesine `down -v` kullanma. Bu PR mevcut geliştirme konteynerlerini veya verilerini değiştirmez; O01'in çalışan ortam kısmı açık kalır.

## Doğrulama

Backend derlemesi 0 hata/0 uyarıyla geçti. PostgreSQL ve Redis ile tam koşuda 230 testin 229'u geçti; yeni katalog yarış testindeki ikinci fixture'ın marka adı çakışması düzeltildi ve o test ayrı koşuda geçti. Uygulama kodu bu son test verisi düzeltmesinde değişmedi; toplam 230 farklı backend testi doğrulandı.

Web 26/26 ve Admin 24/24 Node testi, iki uygulamanın TypeScript/Vite build'i ve üç gerçek HTTP smoke betiği geçti. Lint'te hata yok; mevcut 5 Web ve 2 Admin Fast Refresh uyarısı sürüyor. EF model/migration kontrolü bekleyen fark bulmadı. Ortam bağlama denetimi O01'i beklenildiği gibi raporladı.

Kalıcı testler backend iş kuralları, gerçek PostgreSQL yarışları ve indeks, frontend form olayları, tekrar denemeler ve gerçek HTTP uçlarını kapsar. Frontend olay testleri tarayıcıda görsel yerleşim veya tam uçtan uca kullanıcı testi değildir.
