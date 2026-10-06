## 📋 Pull Request Özeti

### 🎯 Değişikliğin Türü
- [ ] 🚀 Yeni Özellik (Feature)
- [ ] 🐛 Hata Düzeltme (Bug Fix)
- [ ] 🛡️ Güvenlik Sıkılaştırması (Security Hardening)
- [ ] 🏗️ Mimari / Refactoring (Architecture / Refactor)
- [ ] ⚡ Performans Optimizasyonu (Performance)
- [ ] 📚 Dokümantasyon (Documentation)
- [ ] 🧪 Test (Unit / Integration / Architecture)


### 🛡️ Kalite, Mimari ve Kod İnceleme Kontrol Listesi

#### 1. Mimari & Tasarım İlkeleri (Clean Architecture & SOLID & DRY)
- [ ] **Clean Architecture:** Katman sınırları korundu mu? (`ArchitectureTests` geçti mi?)
- [ ] **SOLID:** Sınıf ve metotlar tek sorumluluğa (SRP) ve arayüz bağımlılığına (DIP) uygun mu?
- [ ] **DRY (Don't Repeat Yourself):** Tekrar eden kod blokları extension metot veya ortak helper'lara taşındı mı?
- [ ] **CQRS Standartları:** Komut sınıfları `*Command` ekiyle bitiyor, MediatR handler'lar `sealed` mı?

#### 2. Performans ve Veritabanı
- [ ] **Salt Okuma:** Query handler'larda ve salt okumalarda `AsNoTracking()` kullanıldı mı?
- [ ] **N+1 Sorgu Engeli:** Döngü içerisinde veritabanı sorgusu veya `SaveChanges` çağrısı yapılmadı mı?
- [ ] **Veritabanı Projeksiyonu:** İhtiyaç duyulmayan kolonlar yerine `.Select()` ile DTO projeksiyonu tercih edildi mi?

#### 3. Güvenlik ve Veri Bütünlüğü
- [ ] **IDOR Koruması:** Kullanıcıya ait veriler işlem yaparken JWT Claim / UserId ile sahiplik kontrolü yapıldı mı?
- [ ] **Hassas Veri:** API Key, token, şifre veya ham exception detayları istemciye sızdırılmıyor mu?
- [ ] **Girdi Doğrulama:** Yeni komutlar için FluentValidation kuralları yazıldı mı?

#### 4. Test & Derleme Doğrulaması
- [ ] **Birim Testleri:** Yeni iş mantığı için testler eklendi ve tüm testler başarılı mı? (`dotnet test`)
- [ ] **Frontend Derlemesi:** Web ve Admin panelleri hatasız derleniyor mu? (`npm run build`)
