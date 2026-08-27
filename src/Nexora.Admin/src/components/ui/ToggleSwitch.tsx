import React from 'react';
import { Loader2 } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (newVal: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  isLoading = false,
  activeLabel = 'Aktif',
  inactiveLabel = 'Pasif',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || isLoading}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`group inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${
        checked
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80'
      }`}
    >
      <div
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
          checked ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        {isLoading ? (
          <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
        ) : (
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
              checked ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        )}
      </div>
      <span className="text-[11px] font-bold">
        {checked ? activeLabel : inactiveLabel}
      </span>
    </button>
  );
};
