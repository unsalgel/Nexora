import React, { useState } from 'react';
import { 
  Package, 
  Heart, 
  MapPin, 
  User, 
  ShoppingBag, 
  Trash2, 
  Edit2, 
  Plus, 
  ChevronRight
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'addresses' | 'account'>('orders');

  const orders = [
    {
      id: 'NXR-2026-8942',
      date: '12 Ağustos 2026',
      status: 'Kargoda',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      total: 3798.90,
      cargoTrackNo: 'TR-982341234',
      items: [
        {
          title: 'Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici ANC',
          quantity: 1,
          price: 1499.90,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'
        },
        {
          title: 'Akıllı Saat GPS + Nabız Ölçer Su Geçirmez Spor Kordonlu',
          quantity: 1,
          price: 2299.00,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'
        }
      ]
    },
    {
      id: 'NXR-2026-5120',
      date: '28 Temmuz 2026',
      status: 'Teslim Edildi',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      total: 599.00,
      cargoTrackNo: 'TR-412398512',
      items: [
        {
          title: 'Erkek Premium Slim Fit Pamuklu Kumaş Gömlek',
          quantity: 1,
          price: 599.00,
          image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&q=80'
        }
      ]
    }
  ];

  const [favorites, setFavorites] = useState([
    {
      id: '4',
      title: 'Ortopedik Koşu ve Yürüyüş Spor Ayakkabısı',
      price: 1249.50,
      oldPrice: 1699.00,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80'
    },
    {
      id: '6',
      title: 'Organik Yüz Bakım Serumu Cilt Yenileyici 50ml',
      price: 389.90,
      oldPrice: 499.00,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80'
    }
  ]);

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-8 pb-16">
      
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-orange-500/25">
            ÜG
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ünsal Gel</h1>
            <p className="text-xs text-slate-500 font-medium">unsal@example.com • Müşteri ID: #8942</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Toplam Sipariş</span>
            <span className="text-sm font-bold text-orange-600">2 Sipariş</span>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Hesap Durumu</span>
            <span className="text-sm font-bold text-emerald-600">Doğrulanmış</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-3 shadow-sm space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-orange-50 text-orange-600 font-bold border border-orange-100'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-orange-500" />
              <span>Siparişlerim</span>
            </div>
            <span className="text-[10px] bg-white border px-2 py-0.5 rounded-full font-bold text-slate-500">2</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'favorites'
                ? 'bg-orange-50 text-orange-600 font-bold border border-orange-100'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Favorilerim</span>
            </div>
            <span className="text-[10px] bg-white border px-2 py-0.5 rounded-full font-bold text-slate-500">{favorites.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'addresses'
                ? 'bg-orange-50 text-orange-600 font-bold border border-orange-100'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Adres Bilgilerim</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'account'
                ? 'bg-orange-50 text-orange-600 font-bold border border-orange-100'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-600" />
              <span>Hesap Ayarları</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </aside>

        <main className="lg:col-span-8">
          
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in-50">
              <h2 className="text-base font-bold text-slate-900">Sipariş Geçmişim</h2>
              
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Sipariş Numarası</span>
                      <span className="font-bold text-slate-900">{order.id}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Tarih</span>
                      <span className="font-semibold text-slate-700">{order.date}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Toplam Tutar</span>
                      <span className="font-bold text-orange-600">{order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>

                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border p-1.5 shrink-0 flex items-center justify-center">
                          <img src={item.image} alt={item.title} className="max-h-full object-contain" />
                        </div>
                        <div className="flex-1 text-xs">
                          <h4 className="font-semibold text-slate-800 line-clamp-1">{item.title}</h4>
                          <span className="text-slate-400 font-medium">{item.quantity} Adet • {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Kargo Takip No: <span className="font-bold text-slate-700">{order.cargoTrackNo}</span></span>
                    <button className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors">
                      Kargom Nerede?
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4 animate-in fade-in-50">
              <h2 className="text-base font-bold text-slate-900">Favori Ürünlerim ({favorites.length})</h2>

              {favorites.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
                  <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Henüz favorilere ürün eklemediniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favorites.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 flex flex-col justify-between relative">
                      <button
                        onClick={() => removeFavorite(item.id)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Favoriden Çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="h-40 bg-slate-50 rounded-xl p-3 flex items-center justify-center">
                        <img src={item.image} alt={item.title} className="max-h-full object-contain" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-slate-800 line-clamp-2">{item.title}</h3>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-sm font-bold text-slate-900">
                            {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </span>
                          <span className="text-[11px] text-slate-400 line-through">
                            {item.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </span>
                        </div>
                      </div>

                      <button className="w-full py-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Sepete Ekle</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Kayıtlı Adreslerim</h2>
                <button className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all">
                  <Plus className="w-4 h-4" />
                  <span>Yeni Adres Ekle</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-900 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg border border-orange-100">
                    Ev Adresim (Varsayılan)
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-bold text-slate-500 hover:text-orange-600 flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Düzenle
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 font-medium">
                  <p className="font-bold text-slate-900">Ünsal Gel • 0555 123 45 67</p>
                  <p>Cemal Gürsel Cad. No:45 Kat:3 Daire:8</p>
                  <p>Karşıyaka / İzmir</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 animate-in fade-in-50">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Kişisel Bilgiler</h2>

              <form className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ad Soyad</label>
                    <input
                      type="text"
                      defaultValue="Ünsal Gel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">E-Posta Adresi</label>
                    <input
                      type="email"
                      defaultValue="unsal@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Telefon Numarası</label>
                    <input
                      type="text"
                      defaultValue="0555 123 45 67"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Bilgileri Güncelle
                </button>
              </form>
            </div>
          )}

        </main>

      </div>
    </div>
  );
};
