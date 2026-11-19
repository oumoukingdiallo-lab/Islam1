import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);

  const node = (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-slide-up flex items-start gap-3 bg-ink-900 text-white px-4 py-3 rounded-2xl shadow-pop"
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return { toast, Toaster: node };
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ${className}`}>
      {children}
    </span>
  );
}
