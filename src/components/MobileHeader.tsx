import { KbzLogo } from '@/components/Logo';
import { Bell } from 'lucide-react';

export function MobileHeader({ userName }: { userName: string }) {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-ink-100 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <KbzLogo className="w-7 h-7" />
        <span className="font-display font-extrabold text-lg text-ink-900 tracking-tight">Kbizá</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-ink-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
