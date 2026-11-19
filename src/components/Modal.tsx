import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative bg-white w-full ${size === 'lg' ? 'md:max-w-2xl' : 'md:max-w-md'} max-h-[92vh] overflow-y-auto no-scrollbar rounded-t-3xl md:rounded-3xl shadow-pop animate-slide-up md:animate-scale-in`}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/95 backdrop-blur border-b border-ink-100">
            <h3 className="font-display font-bold text-lg text-ink-900">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
