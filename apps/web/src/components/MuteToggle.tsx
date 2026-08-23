"use client";

import { useAudio } from "@/lib/audio-context";

export function MuteToggle() {
  const { muted, toggleMuted } = useAudio();

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      aria-pressed={!muted}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg-elevated text-ink-muted transition-colors hover:text-ink"
    >
      {muted ? (
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
          <path
            d="M4 8v4h3l4 3V5L7 8H4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14 7.5 17.5 11M17.5 7.5 14 11"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
          <path
            d="M4 8v4h3l4 3V5L7 8H4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 7c1 .8 1.6 1.8 1.6 3s-.6 2.2-1.6 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
