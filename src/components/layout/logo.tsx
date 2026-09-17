import { cn } from "@/lib/utils";

/** Inline SVG mark — no network request, scales cleanly, theme-aware. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="BusinessToolKit"
    >
      <rect width="32" height="32" rx="8" className="fill-navy-900 dark:fill-navy-800" />
      <path
        d="M9 21.5V10.5h5.4c2.1 0 3.4 1 3.4 2.7 0 1.2-.7 2-1.8 2.3 1.4.3 2.3 1.2 2.3 2.6 0 1.9-1.4 3.4-3.9 3.4H9Zm2.7-6.6h2.2c.9 0 1.4-.4 1.4-1.1s-.5-1.1-1.4-1.1h-2.2v2.2Zm0 4.4h2.5c1 0 1.6-.4 1.6-1.2s-.6-1.2-1.6-1.2h-2.5v2.4Z"
        className="fill-white"
      />
      <circle cx="22.5" cy="13" r="2.5" className="fill-teal-400" />
      <rect x="20" y="17.5" width="5" height="4" rx="1.2" className="fill-teal-400" />
    </svg>
  );
}
