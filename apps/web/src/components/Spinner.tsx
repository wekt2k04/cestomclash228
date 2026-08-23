// Indicateur d'etat "busy" au-dela du seul texte de bouton - NN/g, Button
// States: Communicate Interaction (un changement de texte seul peut passer
// inapercu en lecture rapide).
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      className={`animate-spin ${className}`}
      role="presentation"
    >
      <circle
        cx="10"
        cy="10"
        r="7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
