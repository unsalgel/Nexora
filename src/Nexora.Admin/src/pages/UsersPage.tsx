import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  Mail,
  Calendar,
  ShieldAlert,
  Shield,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';

interface RoleDto {
  id: string;
  name: string;
}

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
  orderCount: number;
  createdAtUtc: string;
}

interface UsersResponse {
  isSuccess: boolean;
  data: {
    items: UserItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  error?: string;
}

interface RolesResponse {
  isSuccess: boolean;
  data: RoleDto[];
  error?: string;
}

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '10',
      });
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (statusFilter === 'active') params.append('isActive', 'true');
      if (statusFilter === 'inactive') params.append('isActive', 'false');

      const res = await apiClient.get<UsersResponse>(`/users?${params.toString()}`);
      return res.data;
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await apiClient.get<RolesResponse>('/users/roles');
      return res.data;
    }
  });

  const availableRoles = rolesData?.data || [];

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: boolean }) => {
      setTogglingUserId(id);
      const res = await apiClient.put(`/users/${id}/status`, newStatus, {
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTogglingUserId(null);
      setActionMessage({
        type: 'success',
        text: `Kullanıcı hesabı başarıyla ${variables.newStatus ? 'aktif duruma getirildi' : 'donduruldu/pasife alındı'}.`,
      });
      setTimeout(() => setActionMessage(null), 3500);
    },
    onError: () => {
      setTogglingUserId(null);
      setActionMessage({ type: 'error', text: 'Kullanıcı durumu güncellenirken bir hata oluştu.' });
      setTimeout(() => setActionMessage(null), 3500);
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      const res = await apiClient.put(`/users/${userId}/roles`, roles);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setRoleModalUser(null);
      setActionMessage({ type: 'success', text: 'Kullanıcı rolleri başarıyla güncellendi.' });
      setTimeout(() => setActionMessage(null), 3500);
    },
    onError: () => {
      setActionMessage({ type: 'error', text: 'Roller güncellenirken bir hata oluştu.' });
      setTimeout(() => setActionMessage(null), 3500);
    }
  });

  const openRoleModal = (user: UserItem) => {
    setRoleModalUser(user);
    setSelectedRoles(user.roles || []);
  };

  const handleToggleRole = (roleName: string) => {
    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleName));
    } else {
      setSelectedRoles([...selectedRoles, roleName]);
    }
  };

  const handleSaveRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;
    updateRolesMutation.mutate({
      userId: roleModalUser.id,
      roles: selectedRoles
    });
  };

  const users = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-orange-600" />
            Kullanıcı & Rol Yönetimi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kayıtlı tüm müşterileri, yetki rollerini ve hesap durumlarını yönetin.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İsim, soyisim veya e-posta ile ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setCurrentPage(1);
            }}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Hesaplar</option>
            <option value="inactive">Dondurulmuş / Pasif</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Kullanıcı</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Yetki Rolleri</th>
                <th className="px-6 py-4">Sipariş</th>
                <th className="px-6 py-4">Kayıt Tarihi</th>
                <th className="px-6 py-4 text-center">Hesap Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Kullanıcılar yükleniyor...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-500">
                    Kullanıcılar alınırken bir hata oluştu.
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Kriterlere uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {user.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span
                                key={role}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                                  role.toLowerCase() === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Müşteri</span>
                          )}
                        </div>
                        <button
                          onClick={() => openRoleModal(user)}
                          className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Rolleri Düzenle"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.orderCount} Sipariş</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(user.createdAtUtc).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ToggleSwitch
                          checked={user.isActive}
                          isLoading={togglingUserId === user.id}
                          activeLabel="Aktif"
                          inactiveLabel="Donduruldu"
                          onChange={(newVal) => toggleStatusMutation.mutate({ id: user.id, newStatus: newVal })}
                        />
                        {!user.isActive && (
                          <span className="p-1 rounded-full text-rose-600 bg-rose-50" title="Hesap pasife alınmış">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Toplam <span className="font-semibold text-slate-700">{totalCount}</span> kullanıcı
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-700 px-2">
              Sayfa {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {roleModalUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                <span>Yetki Rollerini Yönet</span>
              </h3>
              <button 
                onClick={() => setRoleModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Kullanıcı</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{roleModalUser.firstName} {roleModalUser.lastName}</p>
              <p className="text-xs text-slate-400">{roleModalUser.email}</p>
            </div>

            <form onSubmit={handleSaveRoles} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Kullanıcı Rolleri</label>
                <div className="space-y-2">
                  {availableRoles.length === 0 ? (
                    <p className="text-xs text-slate-400">Tanımlı rol bulunamadı.</p>
                  ) : (
                    availableRoles.map((role) => {
                      const isChecked = selectedRoles.includes(role.name);
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-orange-50/40 border-orange-200 text-orange-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRole(role.name)}
                              className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                            />
                            <span className="text-xs font-bold uppercase tracking-wider">{role.name}</span>
                          </div>
                          {role.name.toLowerCase() === 'admin' && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                              Tam Yetki
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={updateRolesMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updateRolesMutation.isPending ? 'Kaydediliyor...' : 'Rolleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
