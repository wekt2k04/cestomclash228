// Icones du bouton montrer/cacher le mot de passe (login/page.tsx, signup/page.tsx) -
// partagees car identiques aux deux endroits, pas une simple coincidence de 2 lignes.
export function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M2.5 2.5l15 15M8.35 8.4a2.25 2.25 0 0 0 3.24 3.16M6.2 6.24C3.8 7.6 1.5 10 1.5 10s3 6 8.5 6c1.6 0 2.96-.5 4.08-1.18M14.1 14.14C16.6 12.7 18.5 10 18.5 10s-1.24-2.48-3.68-4.24C13.5 4.7 11.85 4 10 4c-.6 0-1.17.07-1.72.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
