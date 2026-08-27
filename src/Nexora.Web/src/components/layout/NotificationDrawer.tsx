import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, X, CheckCheck, Package, Tag, ShieldCheck, Info, ChevronRight, Clock } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
        return { icon: <Package className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 border-blue-100' };
      case 'campaign':
        return { icon: <Tag className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-50 border-orange-100' };
      case 'security':
        return { icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' };
      default:
        return { icon: <Info className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 border-indigo-100' };
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 1) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dk önce`;
      if (diffHours < 24) return `${diffHours} saat önce`;
      if (diffDays === 1) return 'Dün';
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const handleNotificationClick = async (notif: { id: string; type: string; isRead: boolean }) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.type.toLowerCase() === 'order') {
      navigate('/orders');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={() => setIsOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200/80">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Bildirimler</h2>
                <p className="text-xs text-slate-500">{unreadCount > 0 ? `${unreadCount} okunmamış bildiriminiz var` : 'Tüm bildirimleriniz güncel'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={() => markAllAsRead()} title="Tümünü okundu işaretle" className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tümünü Oku</span>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading && notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">Bildirimler yükleniyor...</div>
            ) : notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <Bell className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Henüz Bildiriminiz Yok</h3>
                <p className="text-xs text-slate-400 max-w-[220px]">Siparişleriniz ve size özel fırsatlar burada listelenecektir.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon, bg } = getNotificationIcon(notif.type);
                return (
                  <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={'p-4 transition-all cursor-pointer flex gap-3.5 items-start relative group hover:bg-slate-50/80 ' + (!notif.isRead ? 'bg-orange-50/20' : 'bg-white')}>
                    {!notif.isRead && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-100" />}
                    <div className={'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5 ' + bg}>{icon}</div>
                    <div className="flex-1 pr-4">
                      <h4 className={'text-xs font-bold leading-tight mb-1 ' + (!notif.isRead ? 'text-slate-900' : 'text-slate-700')}>{notif.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">{notif.message}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(notif.createdAtUtc)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 self-center" />
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <p className="text-[11px] text-slate-400">Bildirimler son 30 günlük geçmişinizi kapsar.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
