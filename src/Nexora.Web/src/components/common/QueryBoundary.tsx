import React from 'react';

interface QueryBoundaryProps<T> {
  isLoading: boolean;
  skeleton: React.ReactNode;
  data: T | undefined | null;
  isEmpty?: (data: T) => boolean;
  emptyState?: React.ReactNode;
  isError?: boolean;
  error?: unknown;
  errorState?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function QueryBoundary<T>({
  isLoading,
  skeleton,
  data,
  isEmpty,
  emptyState,
  isError,
  errorState,
  children,
}: QueryBoundaryProps<T>): React.ReactElement | null {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  if (isError) {
    if (errorState) return <>{errorState}</>;
    return (
      <div className="p-8 text-center bg-rose-50/50 rounded-2xl border border-rose-100 text-rose-700 text-xs font-medium">
        Veriler yüklenirken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyiniz.
      </div>
    );
  }

  if (data === undefined || data === null || (isEmpty && isEmpty(data))) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return <>{children(data)}</>;
}
