# Nexora

Nexora, geliştirdiğim bir e-ticaret hobi projesi. Müşteriler için alışveriş sitesi, mağaza yönetimi için ayrı bir panel ve ASP.NET Core ile hazırlanmış bir API içeriyor. Ödemelerde iyzico kullanıyorum.

Alışveriş sitesinde ürünleri inceleme, sepet, kupon, favoriler, adresler ve sipariş geçmişi bulunuyor. Yönetim panelinden ürün, stok, sipariş, kupon, kullanıcı ve site ayarları yönetiliyor.

## Kullanılan teknolojiler

| Bileşen | Sürüm |
|---|---|
| .NET / ASP.NET Core | 8 |
| EF Core / Npgsql | 8.x |
| PostgreSQL | 16 |
| Redis | 7 |
| React | 19.2.8 |
| TypeScript | 6.0.3 |
| Vite | 8.3.5 |
| Tailwind CSS | 4.3.3 |
| iyzico .NET SDK | 2.1.80 |

## Bilgisayarınızda çalıştırma

Aşağıdaki adımlar PowerShell içindir. Git, .NET 8 SDK, Node.js 24, npm ve Docker Desktop kurulu olmalı. Başlamadan önce Docker Desktop'ı açın.

### 1. Projeyi indirin

```powershell
git clone https://github.com/unsalgel/Nexora.git
cd Nexora
```

### 2. Yerel ayarları hazırlayın

Projenin ana klasöründe `.env` adında bir dosya oluşturun ve aşağıdaki alanları ekleyin. Zaten bir `.env` dosyanız varsa üzerine yazmak yerine eksik alanları tamamlayın.

```dotenv
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_DB_PASSWORD
DB_NAME=NexoraDb
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD
REDIS_PORT=6379
PGADMIN_EMAIL=admin@nexora.local
PGADMIN_PASSWORD=CHANGE_ME_PGADMIN_PASSWORD
JWT_SECRET_KEY=CHANGE_ME_JWT_SECRET
ADMIN_SEED_EMAIL=admin@nexora.local
ADMIN_SEED_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
Frontend__BaseUrl=http://localhost:5173
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
IYZICO_CALLBACK_URL=http://localhost:5285/api/v1/payments/callback
```

`CHANGE_ME_` ile başlayan değerleri kendiniz belirleyin; örneği bu haliyle kullanmayın. Yönetici parolası için büyük ve küçük harf, rakam ve özel karakter içeren uzun bir parola seçin. `PGADMIN_PASSWORD`, veritabanı yönetim ekranının parolasıdır; mağazanın yönetici parolasından ayrıdır.

JWT anahtarı için aşağıdaki komutla rastgele bir değer üretip çıktıyı `JWT_SECRET_KEY` alanına yazabilirsiniz:

```powershell
$jwtBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($jwtBytes)
$rng.Dispose()
[Convert]::ToBase64String($jwtBytes)
```

Yerel geliştirmede iyzico anahtarları boşken uygulama açılır, ancak ödeme başlatılamaz. Ödemeyi kullanmak için kendi iyzico hesabınızın API ve güvenlik anahtarlarını ilgili alanlara ekleyin.

`.env` dosyası GitHub'a gönderilmez. Anahtarları ve parolaları kod dosyalarına veya README'ye yazmayın.

### 3. Veritabanını ve API'yi başlatın

Projenin ana klasöründe:

```powershell
docker compose up -d --wait
dotnet restore Nexora.sln
./scripts/Start-LocalApi.ps1
```

Bu terminali açık bırakın. Başlatma betiği `.env` dosyasını okur; `dotnet run` tek başına bu dosyayı okumaz. İlk geliştirme açılışında veritabanı tabloları, örnek ürünler ve yönetici hesabı hazırlanır.

PostgreSQL `5432`, Redis `6379`, pgAdmin `5050` portunu kullanır. Redis portu doluysa `.env` içindeki `REDIS_PORT` değerini boş bir portla değiştirin. Mevcut veritabanınız varsa `.env` içindeki veritabanı parolasını değiştirmek, kayıtlı veritabanı parolasını değiştirmez.

### 4. Alışveriş sitesini başlatın

Projenin ana klasöründe yeni bir terminal açın:

```powershell
cd src/Nexora.Web
npm ci
npm run dev
```

### 5. Yönetim panelini başlatın

Projenin ana klasöründe bir terminal daha açın:

```powershell
cd src/Nexora.Admin
npm ci
npm run dev
```

| Uygulama | Adres |
|---|---|
| Alışveriş sitesi | http://localhost:5173 |
| Yönetim paneli | http://localhost:5174 |
| API dokümantasyonu | http://localhost:5285/swagger |
| pgAdmin | http://localhost:5050 |

Yönetim paneline `.env` dosyasında belirlediğiniz `ADMIN_SEED_EMAIL` ve `ADMIN_SEED_PASSWORD` ile giriş yapın. Bu alanlar ilk hesabı oluşturmak içindir; mevcut hesabın parolasını sonradan değiştirmez.

İşiniz bitince uygulamaların çalıştığı terminallerde `Ctrl+C` kullanın. Veritabanı ve Redis'i durdurmak için ana klasörde `docker compose stop` çalıştırın; kayıtlı geliştirme verileri korunur.

## Ödeme ve e-posta ayarları

Ödeme sırasında kullanıcı iyzico'nun sayfasına yönlendirilir ve kart bilgilerini orada girer. İşlem sonrası sonuç alışveriş sitesinde gösterilir. Panelden otomatik iade yapılamaz.

İyzico'nun sonucu API'ye iletebilmesi için `IYZICO_CALLBACK_URL` dışarıdan erişilebilen bir HTTPS adresi olmalıdır; yol `/api/v1/payments/callback` şeklindedir. Yukarıdaki localhost adresi yerel başlangıç ayarıdır. Dışarıdan erişilen ödeme denemesinde `Frontend__BaseUrl` değerini de kullandığınız mağaza adresine göre ayarlayın. Diğer ödeme ayarları ve durum açıklamaları [ödeme belgesinde](docs/iyzico-payments.md) yer alır.

E-posta göndermek için `.env` dosyasına SMTP sağlayıcınızın bilgilerini ekleyin:

```dotenv
EmailSettings__Host=smtp.sunucunuz.com
EmailSettings__Port=587
EmailSettings__EnableSsl=true
EmailSettings__UserName=
EmailSettings__Password=
EmailSettings__SenderEmail=
EmailSettings__SenderName=Nexora
```

SMTP sunucusu ve kullanıcı adı boşsa geliştirme ortamında gerçek e-posta gönderilmez. `Frontend__BaseUrl`, e-postalardaki bağlantılarda da kullanılır.

## Uygulama adreslerini değiştirme

Varsayılan adreslerle çalışıyorsanız ek frontend ayarı gerekmez. API adresini değiştirdiğinizde `src/Nexora.Web` ve `src/Nexora.Admin` klasörlerinde `.env.local` oluşturup yeni adresleri yazın:

```dotenv
VITE_BACKEND_URL=http://localhost:5285
VITE_API_URL=http://localhost:5285/api/v1
```

Yönetim panelinin `.env.local` dosyasında `VITE_WEB_URL=http://localhost:5173` ile alışveriş sitesinin adresi de belirlenebilir. Değişiklikten sonra ilgili uygulamayı yeniden başlatın. `VITE_` ile başlayan değerler tarayıcıda görülebilir; buraya parola veya iyzico anahtarı yazmayın.

## Frontend derlemesi

Alışveriş sitesi veya yönetim panelinin klasöründe:

```powershell
npm run lint
npm run build
npm run preview
```

`build`, uygulamayı derleyip dosyaları `dist/` klasörüne yazar. `preview`, bu çıktıyı bilgisayarınızda görüntülemek içindir.

## Testleri çalıştırma

Backend testlerini proje klasöründe çalıştırabilirsiniz:

```powershell
dotnet test Nexora.sln
```

Alışveriş sitesi veya yönetim panelinin klasöründe:

```bash
npm test
```

PostgreSQL ve Redis ile çalışan testleri de çalıştırmak için Docker Desktop açıkken proje klasöründe ayrı test servislerini başlatın:

```powershell
docker compose -p nexora-tests -f docker-compose.test.yml up -d --wait postgres redis
```

Bu servisler PostgreSQL için `17432`, Redis için `16379` portunu kullanır. Bu portların boş olması gerekir. Geliştirme ortamındaki Redis'i `16379` portunda çalıştırıyorsanız testlerden önce `docker compose stop nexora-redis` ile durdurabilirsiniz. Testler için günlük kullandığınız veritabanını veya Redis'i kullanmayın.

Ardından aynı PowerShell penceresinde test bağlantılarını tanımlayıp testleri çalıştırın:

```powershell
$env:NEXORA_TEST_POSTGRES = 'Host=localhost;Port=17432;Database=nexora_tests;Username=nexora_test;Password=local-test-only'
$env:NEXORA_TEST_REDIS = 'localhost:16379'
dotnet test Nexora.sln
```

Buradaki kullanıcı adı ve parola yalnızca `docker-compose.test.yml` içindeki geçici test veritabanına aittir. Bu iki ortam değişkeni tanımlanmadığında PostgreSQL ve Redis testleri atlanır; diğer testler çalışır.

İşiniz bitince test servislerini kapatıp aynı terminaldeki test ayarlarını temizleyin:

```powershell
docker compose -p nexora-tests -f docker-compose.test.yml down
Remove-Item Env:NEXORA_TEST_POSTGRES, Env:NEXORA_TEST_REDIS -ErrorAction SilentlyContinue
```

Test verileri geçicidir ve servisler kapatıldığında silinir. Geliştirme ortamındaki Redis'i durdurduysanız `docker compose up -d nexora-redis` ile yeniden başlatabilirsiniz.

## Anahtarlar ve parolalar

Yerel ayarlar `.env` dosyasında tutulur. Bu dosya GitHub'a gönderilmez. API anahtarlarını ve parolaları kodun veya README dosyalarının içine yazmayın.

## MIT lisansı

Aşağıda lisansın Türkçe çevirisi yer alıyor. İngilizce asıl metin [LICENSE](LICENSE) dosyasındadır.

Telif hakkı (c) 2026 Ünsal Gel - Nexora E-Commerce Platform

Bu yazılımın ve beraberindeki dokümantasyon dosyalarının ("Yazılım") bir kopyasını edinen herkese; Yazılımı kullanma, kopyalama, değiştirme, birleştirme, yayımlama, dağıtma, alt lisanslama ve/veya kopyalarını satma hakları da dahil olmak üzere, Yazılım üzerinde herhangi bir kısıtlama olmadan işlem yapma ve Yazılımın sağlandığı kişilere de bu hakları tanıma izni, aşağıdaki koşula bağlı olarak ücretsiz verilir:

Yukarıdaki telif hakkı bildirimi ve bu izin bildirimi, Yazılımın tüm kopyalarına veya önemli bölümlerine dahil edilmelidir.

Yazılım, ticari elverişlilik, belirli bir amaca uygunluk ve hak ihlali bulunmaması garantileri de dahil olmak üzere, açık veya örtülü hiçbir garanti verilmeden "olduğu gibi" sunulur. Yazarlar veya telif hakkı sahipleri; sözleşme, haksız fiil veya başka bir hukuki nedene dayansa da, Yazılımdan, Yazılımın kullanımından veya Yazılımla ilgili diğer işlemlerden doğan ya da bunlarla bağlantılı hiçbir talep, zarar veya diğer yükümlülükten sorumlu tutulamaz.
