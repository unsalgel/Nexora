# Frontend inceleme bulgularının düzeltmeleri — 10 Ekim 2026

Kapsam: `src/Nexora.Web`, `src/Nexora.Admin`. Yeni bağımlılık eklenmedi. Ödeme akışı simülasyon olarak korundu. İlk inceleme HTML dosyası değiştirilmedi.

| Bulgu | Uygulanan düzeltme | Temel kaynak |
|---|---|---|
| F19 | Ana sayfanın boş ürün referansı sabitlendi; geçmiş state'ini her render'da tekrar yazan effect kaldırıldı. | Web/HomePage |
| F20 | Promise tabanlı tek yenileme aynı kullanıcı + sid oturum ailesine kapsamlandı; token yoksa hemen reject; hata sonrası kilit serbest bırakma. Geç 401 yalnız aynı ailedeki güncel tokenı kullanır; yeni kullanıcı veya yeni sid için eski POST tekrarlanmaz. Refresh öncesi, Web Lock alındıktan sonra, response kaydederken ve retry request interceptor'ında aile kontrolü yapılır. Logout/başka login sırasında eski response oturumu değiştirmez; geciken logout yanıtı yeni login'i yönlendirmez. Web Locks sekmeler arası rotasyonu seri hale getirir. | İki lib/apiClient, tokenSession, refreshCoordinator, session |
| F21 | `useSyncExternalStore` ile aynı ve diğer sekme oturum değişiklikleri reaktif. Kullanıcı değişince özel provider ve QueryClient yeniden oluşturulur. Hub ilk bağlantı hatasını yeniden dener, reconnect sonrası HTTP cache yeniden okunur. SessionRevoked/AccountFrozen çıkışı uygulanır. | App, NotificationContext, AdminNotificationContext, startHubConnection |
| F22 | Gerçek admin query anahtarları; yeni sipariş, stok ve kategori olaylarında doğru liste/dropdown/dashboard invalidation; sipariş durumu mutasyonunda ilgili stok/analitik cache invalidation. Filtreli kategori listelerine kör lokal patch kaldırıldı. | AdminNotificationContext, OrdersPage, ProductsPage |
| F23 | Düzenleme ve durum değiştirmede mevcut parentCategoryId korunur; admin ortak CategoryDto kullanılır. | Admin/CategoriesPage |
| F24 | Min/max fiyat ve sıralama sunucuya gönderilir; toplam ve sayfa içerikleri filtrelenmiş katalogdan gelir; filtre/sıralama değişince sayfa 1'e döner. | Web/ProductsPage |
| F25 | Envanter değeri ve düşük stok toplamı `/dashboard/inventory` sunucu aggregate'inden alınır. Gösterilen ilk 5 kayıt açıkça belirtilir, varyant kimliği ayrı React key olur. Ana ürün/varyant envanter politikasını değiştirmeden satır niteliği etiketlenir. | Admin/DashboardPage |
| F26 | Sohbet kullanıcı kimliğine göre saklanır. Logout hem eski anahtarları hem scoped geçmişleri siler. Sohbeti temizlerken eski bekleyen yanıtın yeniden eklenmesi önlenir. | Web/session, useChat |
| F27 | Satır fiyatları (cartItemId ile eşlenen quote.items), ara toplam, kupon indirimi, kargo ve toplam aynı `/cart/quote` sonucundan gelir; ana ürün/varyant satırları ayrı eşlenir. Miktar kontrolleri sepet context'ini kullanır. Sepet/coupon/settings değişikliği quote'u yeniler. Sepet mutasyonu veya quote hesabı sırasında ödeme devre dışı; create-order `expectedTotalAmount` gönderir. 409 sonrası sepet/tutar yenilenir. | useCartQuote, lib/cartQuote, CartContext, CartPage, CheckoutPage |
| F28 | Sipariş sonrası ikinci DELETE /cart kaldırıldı; yalnız sunucudaki sepet yeniden okunur. | Web/CheckoutPage |
| F29 | Detay sayfası ürün ID ile yeniden mount edilir. Seçim, miktar, yorum ve görsel state'i taşınmaz; stok/varyant değişiminde miktar sınırlandırılır. | Web/ProductDetailPage |
| F30 | Son gezilen ürünler saklanan ID'leri içeren ayrı katalog sorgusundan çözülür; ilk 8 yeni ürün arasında bulunmadı diye geçmiş silinmez. | Web/HomePage |
| F31 | Ana sayfa, sipariş, favori, sepet, adres, yorum/bildirim ve admin temel liste/panel sorgularında yüklenme/hata/boş ayrımı ve yeniden deneme gösterilir. Mutasyon hataları toast veya form hata durumuna taşınır. | Context ve ilgili sayfalar |
| F32 | Ayrı kalıcı liveSettings state kaldırıldı; HTTP ve SignalR aynı query cache'i kullanır. Reconnect/window focus ayarları sunucudan yeniden okur. | Web/SettingsContext |
| F39 | Sipariş/favori/yorum sayfalaması; bildirimlerde infinite query + daha fazla yükleme. Favori üyeliği tüm ID'lerden, okunmamış bildirim sayısı ayrı aggregate'ten, yorum ortalaması/toplamı ayrı summary endpoint'inden gelir. Başlıklar ilk sayfanın uzunluğunu toplam gibi göstermez. | FavoritesContext, NotificationContext, ProfilePage, ProductDetailPage |
| F40 | İki uygulamada strict TypeScript etkinleştirildi. ApiResponse/PagedResponse korunarak yenileme ve yeni endpoint sözleşmeleri tiplendi; kategori drift'i giderildi. Kullanılmayan değişken/hook dependency/control-regex uyarıları temizlendi. | tsconfig.app.json, lib, types/category |
| F41 | Label/input ID ilişkileri ve ikon düğme adları. Aramalı seçimde combobox/listbox, aktif seçenek, ok/Enter/Escape/Tab desteği. Dialog semantics, iki yönlü Tab odağı, Escape ve focus restore; ortak Dialog mevcut modallere uygulanır. Reduced-motion CSS ve title animasyonu tercihi. | Dialog, SearchableSelect, form sayfaları, index.css |
| F42 | Uydurma eski fiyat/indirim ve sabit yıldız/yorum sayıları kaldırıldı. Rating gerçek API verisi; kategori bağlantıları gerçek ID'lerden gelir. Sahte popüler/personalized etiketleri nötr kataloğa dönüştürüldü. Ödeme simülasyonu belirtilir. | HomePage, ProductsPage, ProductDetailPage, FavoritesContext, CartPage |
| S09 | Sayfa düğmeleri en fazla 5 numara; ilk/son ve önceki/sonraki gezinme korunur. | Web/Pagination, lib/pagination |

Ek entegrasyonlar: Profil e-posta değişimi için currentPassword, pendingEmail, OTP doğrulama ve yeniden gönderim; onay sonrası çıkış/yeniden giriş. AI geçmişi en fazla son 3 dolu mesaj ve mesaj başına 500 karakter; kullanıcı girişi en fazla 1000 karakter.

## Doğrulama

- Web `npm test`: 22/22 başarılı.
- Admin `npm test`: 16/16 başarılı.
- Her iki `npm run build`: strict TypeScript + Vite üretim derlemesi başarılı.
- Her iki `npm run lint`: hata yok. Web 5, Admin 2 adet `react/only-export-components` Fast Refresh geliştirme modu uyarısı: mevcut provider ve hook'un aynı dosyada tutulması. Uyarılar bastırılmadı; bu çalışma için salt lint temizliği adına context mimarisi parçalanmadı.

Testler gerçek Axios request/response interceptor zincirini kontrollü HTTP adapter ile yürütür: tokensız 401 sonrası toparlanma, eşzamanlı yenileme, geç gelen POST 401'de A logout→B login ve aynı kullanıcı/yeni sid için mutasyonun tekrarlanmaması, B tokenlarının korunması, aynı aile rotasyonunun kabulü, eski refresh'e yeni oturumun katılmaması ve lock beklerken oturum değişimi. Geciken logout yanıtı, oturum event'i, hub başlangıç retry/cleanup, modal klavye odağı ve combobox seçimi de doğrulanır. Sepet ve checkout bileşenleri güncel ana ürün/varyant fiyatı, ara toplam/kargo/toplam ile render edilerek eski fiyatın gösterilmediği kontrol edilir; nullable eski quote.items sözleşmesi tolere edilir. Büyük sayfa sayısı sınırları ve AI geçmişi sunucu kontratı ayrıca doğrulanır. Node'un yerleşik test runner'ı ve zaten mevcut Axios/TypeScript kullanılır.

## Doğrulama sınırları

Bu frontend turunda gerçek tarayıcı/ekran okuyucu/axe ile uçtan uca login→checkout ve admin akışı yürütülmedi. Canlı HTTP + WebSocket entegrasyonu ve gerçek farklı sekmelerde Web Locks davranışı frontend otomatik testlerinin kapsamı dışında; gerçek Axios + kontrollü adapter, lock ve DOM test doubles kullanıldı. Tokenlar tarayıcı localStorage'ında bearer oturum sözleşmesi kapsamında saklanır; client UID+sid kontrolü sunucunun JWT imza/yetki doğrulamasının yerine geçmez. Nullable sipariş finansal snapshot alanları mevcut ekranlarda dereference edilmez; eski sipariş uyumluluğu korunur. Backend entegrasyon suite'i ana çalışma tarafından ayrıca yürütülmektedir. Bu dosya tam erişilebilirlik sertifikasyonu veya production readiness iddiası değildir.
