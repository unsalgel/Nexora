import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient, type ApiResponse } from '../../lib/apiClient';
import { Dialog } from '../ui/Dialog';

interface Attribute { id: string; name: string; values: { id: string; value: string }[] }
interface Variant { id: string; sku: string; price: number; stockQuantity: number; isActive: boolean; attributeValues: string[]; version: number }
const inputClass = 'border border-slate-300 rounded-lg p-2 w-full text-sm';
const buttonClass = 'border border-slate-200 bg-slate-50 hover:bg-orange-50 text-slate-700 rounded-lg px-3 py-2 text-sm disabled:opacity-40';
const errorMessage = (error: unknown) => error instanceof AxiosError
  ? error.response?.data?.message || 'İşlem tamamlanamadı.' : 'İşlem tamamlanamadı.';

export function VariantManager({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Variant | null>(null);
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [active, setActive] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);
  const variants = useQuery({ queryKey: ['admin-variants', productId], queryFn: async ({ signal }) =>
    (await apiClient.get<ApiResponse<Variant[]>>(`/products/${productId}/variants`, { signal })).data.data });
  const attributes = useQuery({ queryKey: ['admin-attributes'], queryFn: async ({ signal }) =>
    (await apiClient.get<ApiResponse<Attribute[]>>('/product-attributes', { signal })).data.data });
  const reset = () => { setEditing(null); setSku(''); setPrice(''); setStock('0'); setActive(true); setValues({}); };
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['admin-variants', productId] }),
      client.invalidateQueries({ queryKey: ['admin-dashboard-inventory'] }),
      client.invalidateQueries({ queryKey: ['admin-products'] }),
    ]);
  };
  const save = useMutation({ mutationFn: async () => {
    const fields = { sku, price: Number(price), stockQuantity: Number(stock) };
    if (editing) await apiClient.put(`/product-variants/${editing.id}`, { ...fields, isActive: active, version: editing.version });
    else await apiClient.post(`/products/${productId}/variants`, { ...fields, attributeValueIds: Object.values(values).filter(Boolean) });
  }, onSuccess: async () => { reset(); setError(''); await refresh(); }, onError: async (e) => { setError(errorMessage(e)); await variants.refetch(); } });
  const remove = useMutation({ mutationFn: async (id: string) => apiClient.delete(`/product-variants/${id}`),
    onSuccess: async () => { setDeleteTarget(null); reset(); await refresh(); }, onError: e => { setError(errorMessage(e)); setDeleteTarget(null); } });
  const busy = save.isPending || remove.isPending;
  return <Dialog label={`${productName} varyantları`} onClose={() => { if (!busy) onClose(); }} className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-5">
      <div className="flex justify-between gap-4"><h2 className="font-bold text-xl">{productName} · Varyantlar</h2><button className={buttonClass} disabled={busy} onClick={onClose}>Kapat</button></div>
      <p className="text-sm text-slate-600">Her varyantın fiyatı ve stoğu ayrıdır. Varyantlı siparişler ana ürün stoğunu kullanmaz. Özellik kombinasyonu oluşturulduktan sonra değiştirilemez; gerekirse yeni varyant oluşturun.</p>
      {error && <div role="alert" className="text-rose-700">{error} Güncel verileri kontrol edip varyantı yeniden düzenlemeye açın.</div>}
      {(variants.isError || attributes.isError) && <p role="alert">Veriler yüklenemedi. <button onClick={() => { void variants.refetch(); void attributes.refetch(); }}>Tekrar dene</button></p>}
      {variants.isPending ? <p>Varyantlar yükleniyor…</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['SKU / Özellikler', 'Fiyat', 'Stok', 'Durum', 'İşlemler'].map(x => <th className="p-2" key={x}>{x}</th>)}</tr></thead>
        <tbody>{variants.data?.map(v => <tr key={v.id} className="border-t border-slate-200"><td className="p-2">{v.sku}<div className="text-slate-500">{v.attributeValues.join(' / ')}</div></td><td>{v.price.toLocaleString('tr-TR')} TL</td><td>{v.stockQuantity}</td><td>{v.isActive ? 'Aktif' : 'Pasif'}</td><td><button disabled={busy} className={buttonClass} onClick={() => { setEditing(v); setSku(v.sku); setPrice(String(v.price)); setStock(String(v.stockQuantity)); setActive(v.isActive); setError(''); }}>Düzenle</button> <button disabled={busy} className={buttonClass} onClick={() => setDeleteTarget(v)}>Sil</button></td></tr>)}</tbody></table></div>}
      <form className="space-y-3 border border-slate-200 rounded-xl p-4" onSubmit={e => { e.preventDefault(); setError(''); save.mutate(); }}>
        <h3 className="font-semibold">{editing ? 'Varyantı düzenle' : 'Yeni varyant'}</h3>
        <fieldset disabled={busy || variants.isError || attributes.isError} className="grid sm:grid-cols-3 gap-3">
          <label>SKU<input className={inputClass} value={sku} onChange={e => setSku(e.target.value)} required maxLength={50} /></label>
          <label>Fiyat (TL)<input className={inputClass} type="number" min="0.01" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} /></label>
          <label>Stok<input className={inputClass} type="number" min="0" step="1" required value={stock} onChange={e => setStock(e.target.value)} /></label>
          {!editing && attributes.data?.map(a => <label key={a.id}>{a.name}<select className={inputClass} value={values[a.id] || ''} onChange={e => setValues({ ...values, [a.id]: e.target.value })}><option value="">Seçilmedi</option>{a.values.map(v => <option key={v.id} value={v.id}>{v.value}</option>)}</select></label>)}
          {editing && <label><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Aktif</label>}
          <div className="flex gap-2 items-end"><button className={buttonClass} disabled={!editing && !Object.values(values).some(Boolean)} type="submit">{save.isPending ? 'Kaydediliyor…' : 'Kaydet'}</button><button className={buttonClass} type="button" onClick={reset}>Temizle</button></div>
        </fieldset>
      </form>
      <AttributeEditor attributes={attributes.data || []} onChanged={() => client.invalidateQueries({ queryKey: ['admin-attributes'] })} />
      {deleteTarget && <div role="alert" className="border border-rose-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <span>{deleteTarget.sku} satıştan kaldırılsın mı? Geçmiş siparişler korunur.</span>
        <button className={buttonClass} disabled={busy} onClick={() => remove.mutate(deleteTarget.id)}>Silmeyi onayla</button>
        <button className={buttonClass} disabled={busy} onClick={() => setDeleteTarget(null)}>Vazgeç</button>
      </div>}
    </div>
  </Dialog>;
}

function AttributeEditor({ attributes, onChanged }: { attributes: Attribute[]; onChanged: () => Promise<void> }) {
  const [attributeId, setAttributeId] = useState('');
  const [valueId, setValueId] = useState('');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [deletion, setDeletion] = useState<string | null>(null);
  const selected = attributes.find(a => a.id === attributeId);
  const mutation = useMutation({ mutationFn: async ({ method, url, data }: { method: 'post' | 'put' | 'delete'; url: string; data?: object }) => apiClient.request({ method, url, data }),
    onSuccess: async () => { setError(''); setDeletion(null); setAttributeId(''); setValueId(''); setName(''); setValue(''); await onChanged(); }, onError: e => { setError(errorMessage(e)); setDeletion(null); } });
  return <details className="border border-slate-200 rounded-xl p-4"><summary className="font-semibold cursor-pointer">Özellik ve değer yönetimi</summary>
    <p className="text-xs text-slate-600 my-3">Buradaki adlar tüm ürünlerde ortaktır. Varyantlarda kullanılan özellik ve değerler silinemez.</p>
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    <fieldset disabled={mutation.isPending} className="space-y-3">
      <label className="block">Özellik seç<select className={inputClass} value={attributeId} onChange={e => { const a = attributes.find(x => x.id === e.target.value); setAttributeId(e.target.value); setName(a?.name || ''); setValueId(''); setValue(''); }}><option value="">Yeni özellik</option>{attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <form className="flex gap-2 items-end" onSubmit={e => { e.preventDefault(); mutation.mutate({ method: attributeId ? 'put' : 'post', url: '/product-attributes' + (attributeId ? `/${attributeId}` : ''), data: { name } }); }}>
        <label className="flex-1">Özellik adı<input className={inputClass} required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label><button className={buttonClass}>Özelliği kaydet</button>{attributeId && <button type="button" className={buttonClass} onClick={() => setDeletion(`/product-attributes/${attributeId}`)}>Sil</button>}
      </form>
      {selected && <><label className="block">Değer seç<select className={inputClass} value={valueId} onChange={e => { setValueId(e.target.value); setValue(selected.values.find(v => v.id === e.target.value)?.value || ''); }}><option value="">Yeni değer</option>{selected.values.map(v => <option key={v.id} value={v.id}>{v.value}</option>)}</select></label>
        <form className="flex gap-2 items-end" onSubmit={e => { e.preventDefault(); mutation.mutate({ method: valueId ? 'put' : 'post', url: `/product-attributes/${attributeId}/values` + (valueId ? `/${valueId}` : ''), data: { value } }); }}>
          <label className="flex-1">Değer<input className={inputClass} required maxLength={100} value={value} onChange={e => setValue(e.target.value)} /></label><button className={buttonClass}>Değeri kaydet</button>{valueId && <button type="button" className={buttonClass} onClick={() => setDeletion(`/product-attributes/values/${valueId}`)}>Sil</button>}
        </form></>}
    </fieldset>
    {deletion && <div role="alert" className="mt-3 flex gap-2 items-center">Seçilen kayıt silinsin mi?<button className={buttonClass} disabled={mutation.isPending} onClick={() => mutation.mutate({ method: 'delete', url: deletion })}>Sil</button><button className={buttonClass} onClick={() => setDeletion(null)}>Vazgeç</button></div>}
  </details>;
}
