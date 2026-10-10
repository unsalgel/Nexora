import { getPageWindow } from '../../lib/pagination';
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}
export const Pagination = ({ page, totalPages, onPageChange, isLoading = false }: PaginationProps) => {
  if (totalPages <= 1)
    return null;
  return (<nav aria-label="Sayfalar" className="flex items-center justify-center gap-2 pt-5 flex-wrap">
   {totalPages > 5 && <button type="button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(1)} className="p-2 border rounded-xl text-xs disabled:opacity-40">İlk</button>}
   <button type="button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(page - 1)} className="p-2 border rounded-xl text-xs disabled:opacity-40">Önceki</button>
   {getPageWindow(page, totalPages).map(number => (<button key={number} type="button" disabled={isLoading} aria-current={number === page ? 'page' : undefined} aria-label={`${number}. sayfa`} onClick={() => onPageChange(number)} className={`w-9 h-9 rounded-xl text-xs border ${number === page ? 'bg-orange-500 text-white' : 'bg-white'}`}>{number}</button>))}
   <span className="text-xs text-slate-500">{page} / {totalPages}</span>
   <button type="button" disabled={page >= totalPages || isLoading} onClick={() => onPageChange(page + 1)} className="p-2 border rounded-xl text-xs disabled:opacity-40">Sonraki</button>
   {totalPages > 5 && <button type="button" disabled={page >= totalPages || isLoading} onClick={() => onPageChange(totalPages)} className="p-2 border rounded-xl text-xs disabled:opacity-40">Son</button>}
  </nav>);
};
