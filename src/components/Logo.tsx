export function KbzLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="11" fill="url(#kbz_g)" />
      <path
        d="M13 27V13h11.5v3.4H17v2.6h6.5v3.3H17V27h-4z"
        fill="white"
      />
      <circle cx="26.5" cy="20.5" r="3.5" fill="#34d399" />
      <defs>
        <linearGradient id="kbz_g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
      </defs>
    </svg>
  );
}
