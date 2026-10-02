import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-white border border-slate-100 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6 font-medium">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
