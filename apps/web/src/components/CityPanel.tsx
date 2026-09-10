"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, POLL_INTERVAL_MS } from "@/lib/api";
import type { BountyView, PinView } from "@/lib/types";
import { BOUNTY_STATUS_BADGE, PIN_TYPE_BADGE } from "@/lib/badge-styles";
import { DetailSheet } from "./DetailSheet";
import { ErrorMessage } from "./ErrorMessage";
import { PinDetail } from "./PinDetail";
import { BountyDetail } from "./BountyDetail";

// Filtre cote client sur les listes completes (/pins, /bounties) plutot
// qu'un vrai parametre cityId sur l'API - volume de test actuel largement
// suffisant pour ça, pas necessaire de changer le contrat API pour ce seul
// usage d'affichage (voir agent architecture-review si ça devient un vrai
// probleme de performance).
export function CityPanel({
  cityName,
  onClose,
}: {
  cityName: string;
  onClose: () => void;
}) {
  const [pins, setPins] = useState<PinView[]>([]);
  const [bounties, setBounties] = useState<BountyView[]>([]);
  const [loading, setLoading] = useState(true);
  // Etat d'erreur explicite : l'ancienne version avalait silencieusement tout
  // echec reseau (.catch(() => {})), violation directe de l'heuristique NN/g
  // "visibilite de l'etat du systeme" - l'utilisateur voyait un panneau
  // vide sans savoir si la ville n'a vraiment rien, ou si le chargement a
  // echoue.
  const [loadError, setLoadError] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinView | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<BountyView | null>(
    null,
  );

  // `quiet` (utilise par le polling passif ci-dessous) : rafraichit pins/bounties SANS
  // repasser par le skeleton ni remplacer un contenu deja affiche par un message d'erreur -
  // un echec reseau transitoire en arriere-plan se retente simplement au prochain intervalle
  // plutot que de degrader l'ecran de quelqu'un qui est deja en train de le lire.
  const load = useCallback(
    (opts?: { quiet?: boolean }) => {
      if (!opts?.quiet) {
        setLoading(true);
        setLoadError(false);
      }
      return Promise.all([
        apiFetch<PinView[]>("/pins"),
        apiFetch<BountyView[]>("/bounties?status=open"),
      ])
        .then(([allPins, allBounties]) => {
          setPins(allPins.filter((p) => p.cityName === cityName));
          setBounties(allBounties.filter((b) => b.cityName === cityName));
        })
        .catch(() => {
          if (!opts?.quiet) setLoadError(true);
        })
        .finally(() => {
          if (!opts?.quiet) setLoading(false);
        });
    },
    [cityName],
  );

  // Charge une fois a l'ouverture (skeleton), puis reinterroge en silence toutes les
  // POLL_INTERVAL_MS tant que le panneau reste ouvert - retour utilisateur 2026-09-09
  // ("il y a la reactivite ? si quelqu'un pose une complainte, on peut voir ça
  // automatiquement ?") : jusqu'ici, une Bounty postee par quelqu'un d'autre pendant que ce
  // panneau restait ouvert n'apparaissait qu'a la prochaine fermeture/reouverture. `cancelled`
  // au niveau de l'effet (pas par appel) : suffit a couvrir a la fois le demontage ET un
  // changement de ville en cours de vol, puisque `load` change d'identite (donc l'effet se
  // nettoie et se relance) des que `cityName` change.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const interval = setInterval(() => {
      if (!cancelled) void load({ quiet: true });
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  // Un seul DetailSheet, monte une seule fois pour toute la duree de vie de CityPanel (1er bug
  // reel corrige le 2026-09-09 - voir la note dans PinDetail.tsx/BountyDetail.tsx) : basculer
  // entre liste/Pin/Bounty ne fait plus demonter+remonter 2 DetailSheet dans le meme commit
  // React. `onClose` reste TOUJOURS la fermeture du panneau entier (jamais un "recul d'un
  // niveau" vers la liste) - 2e bug reel corrige juste apres, plus subtil : faire varier
  // `onClose` selon le niveau affiche aurait exige de pousser une 2e entree d'historique a
  // l'ouverture d'un detail (Pin/Bounty), or DetailSheet n'en pousse - et n'en consomme via
  // history.back() - qu'UNE SEULE, une fois pour toute sa duree de vie (voir DetailSheet.tsx).
  // 2 fermetures utilisateur (X sur le detail, puis X sur la liste) auraient donc consomme 2
  // entrees pour 1 seule poussee - le 2e history.back() debordait alors sur le VRAI historique
  // du navigateur anterieur a l'ouverture du panneau (constate en direct : ça atterrissait sur
  // une autre page du site, ou meme chrome://newtab/, deja presente avant que l'appli n'y
  // touche). Le retour "detail -> liste" est donc un simple bouton "Retour" plus bas, qui ne
  // touche JAMAIS a l'historique - seul le X du DetailSheet lui-meme (visible seulement sur la
  // liste) ferme reellement le panneau, en 1 pushState / 1 back() bien appairés.
  return (
    <DetailSheet onClose={onClose}>
      {selectedPin ? (
        <div className="flex flex-col gap-3">
          <BackToListButton onClick={() => setSelectedPin(null)} />
          <PinDetail
            pin={selectedPin}
            onDeleted={(id) => {
              setSelectedPin(null);
              setPins((prev) => prev.filter((p) => p.id !== id));
            }}
          />
        </div>
      ) : selectedBounty ? (
        <div className="flex flex-col gap-3">
          <BackToListButton onClick={() => setSelectedBounty(null)} />
          <BountyDetail
            bounty={selectedBounty}
            onChanged={(updated) => {
              setSelectedBounty(updated);
              setBounties((prev) =>
                prev.map((b) => (b.id === updated.id ? updated : b)),
              );
            }}
          />
        </div>
      ) : (
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
        <h2 className="font-head text-base font-bold text-ink">{cityName}</h2>

        {loading && <CityPanelSkeleton />}

        {!loading && loadError && (
          <div className="flex flex-col items-start gap-2 py-2">
            <ErrorMessage>Impossible de charger le contenu de cette ville.</ErrorMessage>
            <button
              type="button"
              onClick={() => load()}
              className="flex h-11 items-center rounded-lg border border-line bg-bg-elevated px-3 text-xs font-medium text-ink-muted hover:text-ink"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !loadError && pins.length === 0 && bounties.length === 0 && (
          <p className="text-sm text-ink-muted">
            Rien pour l&apos;instant dans cette ville — sois le premier à déposer une astuce ou
            une demande d&apos;aide avec le bouton « Créer ».
          </p>
        )}

        {/* Barre de couleur sur le bord gauche AU LIEU d'une bordure decorative uniforme (voir
            plans/zesty-knitting-biscuit.md § 3.2) - remplace `border border-line` plutot que de
            l'ajouter (les 2 se disputeraient la meme propriete CSS border-color sur les autres
            cotes). Toutes les Bounties listees ici sont deja filtrees "open" par le fetch
            (`/bounties?status=open`) - accent uniformement dore, signal de categorie ("appel a
            l'aide actif") plutot que de differenciation ligne a ligne, le titre de section fait
            deja le travail textuel (couleur jamais seule, voir Pins ci-dessous ou le type EST
            different ligne a ligne). */}
        {!loading && !loadError && bounties.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Bounties ouvertes
            </span>
            {bounties.map((b) => {
              const badge = BOUNTY_STATUS_BADGE[b.status];
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBounty(b)}
                  className={`flex items-center justify-between gap-2 rounded-lg border-l-4 ${badge.accentClassName} bg-bg-elevated px-3 py-2 text-left text-sm text-ink`}
                >
                  <span className="truncate">{b.title}</span>
                  {b.priceMad !== null && (
                    <span className="shrink-0 font-head text-xs font-bold text-terracotta">
                      {b.priceMad} MAD
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!loading && !loadError && pins.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Pins
            </span>
            {pins.map((p) => {
              const badge = PIN_TYPE_BADGE[p.type];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPin(p)}
                  className={`flex items-center gap-2 rounded-lg border-l-4 ${badge.accentClassName} bg-bg-elevated px-3 py-2 text-left text-sm text-ink`}
                >
                  {/* Type en texte, pas seulement en couleur (accessibilite - une bordure
                      coloree seule ne renseigne pas un daltonien ni un lecteur d'ecran). */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-head text-[9px] font-semibold uppercase tracking-wide ${badge.badgeClassName}`}
                  >
                    {badge.label}
                  </span>
                  <span className="truncate">{p.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}
    </DetailSheet>
  );
}

// Retour "detail -> liste" explicite, jamais via l'historique du navigateur (voir la note
// au-dessus, sur `onClose`) - cible tactile de 44px malgre son role secondaire (WCAG 2.5.5,
// convention deja suivie partout ailleurs dans ce fichier).
function BackToListButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-fit items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-ink-muted hover:text-ink"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
        <path
          d="M12.5 4.5 7 10l5.5 5.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Retour
    </button>
  );
}

// Forme previsible du contenu a venir (2 lignes-titre) plutot qu'un texte
// "Chargement..." qui ne dit rien de la forme du resultat - recommandation
// NN/g sur les skeleton screens (percus comme plus rapides qu'un spinner nu
// a duree egale, et evitent le saut de mise en page au chargement reel).
function CityPanelSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-3 w-24 animate-pulse rounded bg-bg-elevated" />
      <div className="h-9 animate-pulse rounded-lg bg-bg-elevated" />
      <div className="h-9 animate-pulse rounded-lg bg-bg-elevated" />
    </div>
  );
}
