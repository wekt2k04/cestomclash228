"use client";

export function DetailSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-line bg-bg-card p-4 shadow-2xl">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-ink-faint hover:text-ink"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <path
                d="M5 5l10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
