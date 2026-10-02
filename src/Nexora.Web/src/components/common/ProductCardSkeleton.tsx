import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 flex flex-col justify-between animate-pulse">
      <div className="space-y-3">
        <div className="aspect-square bg-slate-100 rounded-xl w-full" />
        <div className="space-y-2 pt-1">
          <div className="h-3 bg-slate-100 rounded-md w-1/3" />
          <div className="h-4 bg-slate-100 rounded-md w-4/5" />
        </div>
      </div>
      <div className="pt-4 mt-2 border-t border-slate-50 flex items-center justify-between">
        <div className="h-5 bg-slate-100 rounded-md w-24" />
        <div className="w-8 h-8 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};
