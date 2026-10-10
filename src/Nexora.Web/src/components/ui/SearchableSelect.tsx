import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}
export const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, placeholder, options, value, onChange, disabled = false, required = false }) => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filteredOptions = options.filter(opt => opt.toLocaleLowerCase('tr-TR').includes(searchTerm.trim().toLocaleLowerCase('tr-TR')));
  const close = () => { setIsOpen(false); triggerRef.current?.focus(); };
  const choose = (option: string) => { onChange(option); close(); };
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!containerRef.current?.contains(event.target as Node))
      setIsOpen(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);
  const keyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      close();
    }
    if (event.key === 'Tab')
      setIsOpen(false);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(0, Math.min(filteredOptions.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredOptions[activeIndex])
        choose(filteredOptions[activeIndex]);
    }
  };
  return <div className="relative space-y-1.5" ref={containerRef}>
  <label id={`${id}-label`} htmlFor={`${id}-trigger`} className="text-xs font-bold text-slate-700 block">{label} {required && <span className="text-orange-500">*</span>}</label>
  <button id={`${id}-trigger`} ref={triggerRef} type="button" disabled={disabled} aria-labelledby={`${id}-label`} aria-expanded={isOpen} aria-haspopup="listbox" aria-controls={`${id}-list`} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    setIsOpen(true);
    setActiveIndex(0);
  } }} onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); setActiveIndex(0); }} className={`w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between text-left disabled:opacity-50 ${isOpen ? 'border-orange-500 ring-2 ring-orange-500/10' : ''}`}>
   <span className="truncate">{value || placeholder}</span><ChevronDown className="w-4 h-4 text-slate-400"/>
  </button>
  {isOpen && !disabled && <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-2">
   <div className="relative"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2"/>
    <input autoFocus role="combobox" aria-label={`${label} listesinde ara`} aria-expanded={true} aria-controls={`${id}-list`} aria-autocomplete="list" aria-required={required} aria-activedescendant={filteredOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined} value={searchTerm} onKeyDown={keyDown} onChange={event => { setSearchTerm(event.target.value); setActiveIndex(0); }} placeholder="Listede ara..." className="w-full border rounded-xl pl-8 pr-7 py-1.5 text-xs"/>
    {searchTerm && <button type="button" aria-label="Aramayı temizle" onClick={() => { setSearchTerm(''); setActiveIndex(0); }} className="absolute right-2 top-1.5"><X className="w-3.5 h-3.5"/></button>}
   </div>
   <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="max-h-48 overflow-y-auto">
    {!filteredOptions.length && <div className="py-4 text-center text-xs text-slate-400">Sonuç bulunamadı</div>}
    {filteredOptions.map((option, index) => <button key={option} id={`${id}-option-${index}`} role="option" aria-selected={value === option} tabIndex={-1} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)} className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${activeIndex === index ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}>{option}</button>)}
   </div>
  </div>}
 </div>;
};
