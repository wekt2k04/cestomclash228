// Meme construction que le mark publie dans l'identite visuelle (pin de
// carte + fleche "level-up" cachee en negatif, degrade rouge->or->vert) -
// voir .claude/HANDOFF/NEXT_SESSION.md pour le lien vers la planche de marque.
export function MindClashMark({ size = 24 }: { size?: number }) {
  const height = Math.round(size * 1.28);
  return (
    <svg
      viewBox="0 0 100 128"
      width={size}
      height={height}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="mc-pin-grad" x1="12%" y1="6%" x2="85%" y2="98%">
          <stop offset="0%" stopColor="var(--red)" />
          <stop offset="52%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--green)" />
        </linearGradient>
        <mask id="mc-pin-mask">
          <circle cx="50" cy="40" r="32" fill="#fff" />
          <polygon points="30,58 70,58 50,116" fill="#fff" />
          <path d="M50,22 L69,52 L60,52 L50,34 L40,52 L31,52 Z" fill="#000" />
        </mask>
      </defs>
      <g mask="url(#mc-pin-mask)">
        <circle cx="50" cy="40" r="32" fill="url(#mc-pin-grad)" />
        <polygon points="30,58 70,58 50,116" fill="url(#mc-pin-grad)" />
      </g>
    </svg>
  );
}
