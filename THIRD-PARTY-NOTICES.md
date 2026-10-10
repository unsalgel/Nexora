# Üçüncü taraf lisansları

NuGet/npm paketleri kendi lisanslarını taşır; depo MIT lisansı bu paketlerin lisansını değiştirmez. Dağıtımda paketlerin lisans/bildirim dosyalarını koruyun.

## SkiaSharp 4.153.1

Görsellerin tam decode edilmesi ve yeniden encode edilmesi için [SkiaSharp](https://www.nuget.org/packages/SkiaSharp/4.153.1) ve Linux konteyner için `SkiaSharp.NativeAssets.Linux.NoDependencies` 4.153.1 kullanılır. SkiaSharp [MIT lisanslıdır](https://github.com/mono/SkiaSharp/blob/main/LICENSE.md), hesap veya Release derleme lisans anahtarı gerektirmez. Native paket Google Skia ve beraberindeki codec bileşenlerinin bildirimlerini içerir. Paketlerden gelen [lisans](licenses/SkiaSharp/LICENSE.txt) ve [üçüncü taraf bildirimleri](licenses/SkiaSharp/THIRD-PARTY-NOTICES.txt) API imajının `/app/licenses/SkiaSharp/` dizinine kopyalanır; diğer dağıtımlarda da korunmalıdır.
