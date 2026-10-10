import { useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
interface DialogProps {
  containerRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  className?: string;
  label: string;
  onClose: () => void;
  onClick?: () => void;
}
export const Dialog = ({ children, className, label, onClose, onClick, containerRef }: DialogProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = ref.current;
    const focusable = () => Array.from(root?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]') || []).filter(item => item.getClientRects().length > 0);
    (focusable()[0] || root)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab')
        return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        root?.focus();
        return;
      }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) {
        event.preventDefault();
        last.focus();
      }
      else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, []);
  return <div ref={node => { ref.current = node; if (containerRef)
    containerRef.current = node; }} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={className} onClick={onClick}>{children}</div>;
};
