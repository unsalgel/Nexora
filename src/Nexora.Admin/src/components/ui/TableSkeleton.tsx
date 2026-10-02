import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 6 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <tr key={rIndex} className="animate-pulse border-b border-slate-100 last:border-b-0">
          {Array.from({ length: cols }).map((_, cIndex) => (
            <td key={cIndex} className="py-4 px-4">
              <div className="h-4 bg-slate-100 rounded-md w-full max-w-[85%]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
