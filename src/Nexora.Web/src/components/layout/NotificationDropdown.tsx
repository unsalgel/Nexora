import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Package, 
  Tag, 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  Clock 
} from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isOpen, 
    setIsOpen, 
    markAsRead, 
    markAllAsRead, 
    isLoading 
  } = useNotifications();
  
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
      case 'ordercreated':
        return { 
          icon: <Package className="w-4 h-4 text-blue-600" />, 
          bg: 'bg-blue-50 border-blue-100' 
        };
      case 'campaign':
        return { 
          icon: <Tag className="w-4 h-4 text-orange-600" />, 
          bg: 'bg-orange-50 border-orange-100' 
        };
      case 'security':
        return { 
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, 
          bg: 'bg-emerald-50 border-emerald-100' 
        };
      default:
        return { 
          icon: <Info className="w-4 h-4 text-indigo-600" />, 
          bg: 'bg-indigo-50 border-indigo-100' 
        };
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

    const lowerType = notif.type.toLowerCase();
    if (lowerType === 'order' || lowerType === 'ordercreated' || lowerType === 'paymentfailed') {
      navigate('/orders');
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 font-sans"
    >
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs leading-none">Bildirimler</h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimleriniz güncel'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              title="Tümünü okundu işaretle"
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Tümünü Oku</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Bildirimler yükleniyor...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Bell className="w-6 h-6 opacity-40" />
            </div>
            <h4 className="text-xs font-bold text-slate-700 mb-0.5">Henüz Bildiriminiz Yok</h4>
            <p className="text-[11px] text-slate-400 max-w-[200px]">
              Siparişleriniz ve fırsatlar burada listelenecektir.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, bg } = getNotificationIcon(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 transition-colors cursor-pointer flex gap-3 items-start relative group hover:bg-slate-50 ${
                  !notif.isRead ? 'bg-orange-50/25' : 'bg-white'
                }`}
              >
                {!notif.isRead && (
                  <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-orange-100" />
                )}

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${bg}`}>
                  {icon}
                </div>

                <div className="flex-1 pr-3 min-w-0">
                  <h4 className={`text-xs font-bold leading-tight mb-1 truncate ${
                    !notif.isRead ? 'text-slate-900' : 'text-slate-700'
                  }`}>
                    {notif.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-1.5">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(notif.createdAtUtc)}</span>
                  </div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 self-center" />
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
        <p className="text-[10px] text-slate-400">
          Bildirimler son 30 günlük geçmişinizi kapsar.
        </p>
      </div>
    </div>
  );
};
