"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, POLL_INTERVAL_MS } from "@/lib/api";
import type { MessageView } from "@/lib/types";
import { ErrorMessage } from "./ErrorMessage";
import { PageHint } from "./PageHint";
import { Spinner } from "./Spinner";

// Affiche seulement par BountyDetail.tsx une fois la Bounty CLAIMED/RESOLUE (voir
// ChatService.postMessage() cote API - meme garde reproduite ici pour l'affichage, la vraie
// autorisation reste toujours cote serveur). Polling 20s (POLL_INTERVAL_MS, meme pattern que
// CityPanel.tsx/sponsoring/page.tsx/BountyInterestsPanel.tsx ce soir) - pas de WebSocket, Render
// gratuit tue les connexions persistantes.
export function BountyChat({ bountyId }: { bountyId: string }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<MessageView[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(
    async (opts?: { quiet?: boolean }) => {
      try {
        const list = await apiFetch<MessageView[]>(`/bounties/${bountyId}/messages`, {
          token,
        });
        setMessages(list);
      } catch (err) {
        if (!opts?.quiet) {
          setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
        }
      }
    },
    [bountyId, token],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const interval = setInterval(() => void reload({ quiet: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  // Defile vers le dernier message a chaque nouvelle liste (chargement initial ou nouveau
  // message recu/envoye) - un chat qui reste scrolle en haut serait juge casse par un
  // utilisateur habitue a n'importe quelle appli de messagerie.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      await apiFetch(`/bounties/${bountyId}/messages`, {
        method: "POST",
        token,
        body: JSON.stringify({ body }),
      });
      setDraft("");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <h3 className="font-head text-sm font-bold text-ink">Discussion</h3>
      <PageHint id="bounty-chat-stay-in-app">
        Reste dans l&apos;appli pour discuter des détails — les numéros, emails et liens vers des
        réseaux sociaux ne sont pas acceptés ici, pour la sécurité de tout le monde.
      </PageHint>

      {messages === null ? (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-lg border border-line bg-bg p-2"
        >
          {messages.length === 0 && (
            <p className="py-2 text-center text-xs text-ink-faint">
              Aucun message pour l&apos;instant — dis bonjour !
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className="rounded-lg bg-bg-elevated px-3 py-2 text-sm text-ink"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                {m.author.displayName}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words">{m.body}</p>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={send} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder="Écrire un message…"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center px-0"
          aria-label="Envoyer"
        >
          {sending ? (
            <Spinner />
          ) : (
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <path
                d="M3 10h13m0 0-5-5m5 5-5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
