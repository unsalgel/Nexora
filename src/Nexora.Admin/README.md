# Nexora.Admin — İdari Yönetim Portalı

Nexora e-ticaret platformunun envanter, sipariş karşılama, satış analitiği, kupon yapılandırması, görsel yükleme ve katalog denetimini sağlayan merkezi yönetim portalıdır.

---

## Mimari ve Teknoloji Altyapısı

| Bileşen | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| Çekirdek | React 19+ | Fonksiyonel bileşen mimarisi |
| Tip Sistemi | TypeScript | Strict Mode standartlarında tip güvenliği |
| Paketleme | Vite | Hızlı yerel geliştirme ve optimize derleme |
| Stil Mimarisi | Tailwind CSS v4 | Kurumsal veri odaklı arayüz tasarımı |
| İkon Seti | Lucide React | Vektörel SVG ikon kütüphanesi |
| Veri Yönetimi | TanStack React Query v5 | Sunucu önbelleklemesi ve akıcı sayfalama (`keepPreviousData`) |
| İletişim & Güvenlik | Axios | Otomatik JWT Bearer yönetimi, 401 sessiz yenileme ve anlık token iptali |

---

## İdari Modüller ve Fonksiyonel Kapsam

### 1. Güvenlik ve Yetkilendirilmiş Erişim (Admin Auth)
* Sadece `Admin` rolüne sahip kullanıcıların erişebildiği korumalı rota yapısı (`AdminRoute`).
* **Güvenlik İhlali ve Kilitlenme Uyarısı:** Önceki başarısız oturum denemelerini tarih, saat ve IP bazında listeleyen güvenlik bilgilendirme penceresi.
* **Anlık Oturum Kapatma:** Çıkış yapıldığında Access Token ve Refresh Token'ın eş zamanlı olarak kara listeye aktarılması.
* Varsayılan Giriş Bilgileri: `admin@nexora.com` / `Admin123*`

### 2. Satış ve Performans Analitiği (Dashboard)
* **Temel Metrik Kartları:** Toplam Ciro, Ortalama Sepet Tutarı (AOV), Tamamlanan Sipariş Hacmi, Aktif Envanter Değeri (TL), Canlı Ürün Sayısı, Kategori ve Marka Dağılımı.
* **Satış Trend Çizgisi:** Son 7, 14 veya 30 güne ait ciro ve sipariş adetlerini karşılaştıran dinamik grafik.
* **Kategori Bazlı Gelir Dağılımı:** Kategorilerin toplam satış gelirindeki payını yüzde ve adet bazında gösteren ilerleme göstergeleri.
* **Sipariş Durumu Oranları:** Beklemede, Hazırlanıyor, Kargoda, Teslim Edildi ve İptal durumlarının dağılımı.
* **Kritik Stok Alarmları:** Envanter seviyesi 30 adedin altına gerileyen ürünlerin anlık izleme listesi.

### 3. Sipariş Karşılama ve Yönetim (`/orders`)
* Veritabanı düzeyinde optimize edilmiş SQL projeksiyonları ile sayfalama desteği.
* Sipariş Kodu (`NX-ORD-...`), Müşteri Adı, E-posta ve Teslimat Adresine göre anlık çok kriterli arama.
* Son 24 saat içerisinde iletilen siparişlerde belirginleşen yeni sipariş rozeti.
* Sipariş durumunun tek işlemle güncellenmesi (Ödendi -> Hazırlanıyor -> Kargoda -> Teslim Edildi -> İptal).

### 4. Ürün Kataloğu ve Dosya Yükleme Hattı (`/products`)
* **Sürükle-Bırak Dosya Yükleme:** Yerel dosya seçimi veya sürükle-bırak desteği; JPG, PNG, WEBP format ve 5MB boyut denetimi.
* **Çoklu Kaynak Desteği:** Hem sunucuya dosya yükleme hem de harici CDN URL'i tanımlayabilme olanağı.
* **Varyant ve Stok Kontrolü:** Beden, renk ve numara varyantları için SKU, stok adedi ve fiyat tanımları.
* **Yumuşak Durum (Soft State):** Ürünleri kalıcı olarak silmeksizin satıştan çekebilen aktif/pasif anahtarları (`ToggleSwitch`).

### 5. Kupon ve Promosyon Tanımlama (`/coupons`)
* Yüzdelik (%) veya Sabit Tutar (TL) indirim kuponları oluşturma.
* Minimum alışveriş tutarı, kullanım limiti kotası ve son geçerlilik tarihi kuralları.
* Kupon kullanım oranını gösteren canlı kota çubuğu.

### 6. Kategori ve Marka Mimarisi
* Kategori ve marka ağacı oluşturma, düzenleme ve sıralama.
* Kritik silme adımları için doğrulama modalları (`ConfirmModal`).

---

## Geliştirme ve Derleme

```bash
# Bağımlılıkların kurulumu
npm install

# Geliştirme sunucusunun çalıştırılması (Port: 5174)
npm run dev

# Tip denetimi ve üretim paketlemesi
npm run build
```
