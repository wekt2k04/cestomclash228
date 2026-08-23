"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// maplibre-gl 6 n'a pas d'export par defaut (verifie dans le build : les
// tentatives d'`import maplibregl from "maplibre-gl"` echouent) - imports
// nommes uniquement.
import { MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { bboxQueryString, precisionMetersForZoom } from "@/lib/geo";
import type { BountyView, PinCluster, PinView } from "@/lib/types";
import { PinDetail } from "./PinDetail";
import { BountyDetail } from "./BountyDetail";
import { CreateSheet } from "./CreateSheet";

// Style vectoriel sombre gratuit (CARTO dark-matter, sans cle API) - coherent
// avec l'esthetique "carte tactique" de l'identite visuelle et la philosophie
// "tuiles gratuites" de docs/STACK.md.
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const DEFAULT_CENTER: [number, number] = [-6.9, 32.8]; // centre approx du Maroc utile
const DEFAULT_ZOOM = 5.5;

export function SocialMap() {
  const { user } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const [clusters, setClusters] = useState<PinCluster[]>([]);
  const [bounties, setBounties] = useState<BountyView[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinView | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<BountyView | null>(null);
  const [creating, setCreating] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [mapErrorDetail, setMapErrorDetail] = useState<string | null>(null);

  // Initialisation de la carte - une seule fois.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!("WebGLRenderingContext" in window)) {
      // Detection ponctuelle au montage (pas un abonnement a un systeme
      // externe qui change dans le temps) - meme raison que les lectures
      // localStorage dans auth-context.tsx/audio-context.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapStatus("error");
      setMapErrorDetail("WebGL indisponible sur ce navigateur/appareil.");
      return;
    }

    const map = new MapLibreMap({
      container: containerRef.current,
      style: DARK_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    // MapLibre echoue souvent en silence (style/tuile non chargee) sans
    // exception JS visible - on rend l'echec explicite plutot que de
    // laisser un ecran vide sans explication.
    map.on("error", (e) => {
      setMapStatus("error");
      setMapErrorDetail(e.error?.message ?? "Erreur de chargement de la carte.");
    });

    const refresh = () => void refreshData(map);
    map.on("load", () => {
      setMapStatus("ready");
      refresh();
    });
    map.on("moveend", refresh);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  async function refreshData(map: MapLibreMap) {
    const b = map.getBounds();
    const bbox = {
      minLng: b.getWest(),
      minLat: b.getSouth(),
      maxLng: b.getEast(),
      maxLat: b.getNorth(),
    };
    const qs = bboxQueryString(bbox);
    const precisionMeters = precisionMetersForZoom(map.getZoom());

    try {
      const [clusterData, bountyData] = await Promise.all([
        apiFetch<PinCluster[]>(`/pins/clusters?${qs}&precisionMeters=${precisionMeters}`),
        apiFetch<BountyView[]>(`/bounties?${qs}&status=open`),
      ]);
      setClusters(clusterData);
      setBounties(bountyData);
    } catch (err) {
      // Echec de chargement des donnees (API injoignable, CORS...) - la
      // carte elle-meme reste utilisable, seuls les marqueurs manquent.
      console.error("Echec du chargement des Pins/Bounties :", err);
    }
  }

  // Rendu imperatif des marqueurs - MapLibre n'a pas de binding React
  // declaratif officiel, on gere son propre cycle de vie via des refs.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const cluster of clusters) {
      const el = document.createElement("div");
      const isGroup = cluster.count > 1;
      el.className = isGroup ? "mc-marker mc-marker--cluster" : "mc-marker mc-marker--pin";
      el.textContent = isGroup ? String(cluster.count) : "";
      el.addEventListener("click", () => onClusterClick(map, cluster));
      const marker = new Marker({ element: el }).setLngLat([
        cluster.lng,
        cluster.lat,
      ]);
      marker.addTo(map);
      markersRef.current.push(marker);
    }

    for (const bounty of bounties) {
      const el = document.createElement("div");
      el.className = "mc-marker mc-marker--bounty";
      el.addEventListener("click", () => setSelectedBounty(bounty));
      const marker = new Marker({ element: el }).setLngLat([
        bounty.lng,
        bounty.lat,
      ]);
      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, [clusters, bounties]);

  async function onClusterClick(map: MapLibreMap, cluster: PinCluster) {
    if (cluster.count > 1) {
      map.easeTo({ center: [cluster.lng, cluster.lat], zoom: map.getZoom() + 2 });
      return;
    }
    const pin = await apiFetch<PinView>(`/pins/${cluster.pinIds[0]}`);
    setSelectedPin(pin);
  }

  function currentCenter() {
    const c = mapRef.current?.getCenter();
    return { lat: c?.lat ?? DEFAULT_CENTER[1], lng: c?.lng ?? DEFAULT_CENTER[0] };
  }

  return (
    <div className="relative flex-1">
      <div ref={containerRef} className="h-full w-full" />

      {mapStatus !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg px-6 text-center">
          <p className="max-w-xs text-sm text-ink-muted">
            {mapStatus === "loading"
              ? "Chargement de la carte…"
              : `La carte n'a pas pu se charger : ${mapErrorDetail}`}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => (user ? setCreating(true) : router.push("/login"))}
        aria-label="Créer un Pin ou une Bounty"
        className="absolute bottom-6 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-cyan-ink shadow-2xl"
      >
        <svg viewBox="0 0 20 20" width="24" height="24" fill="none">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {selectedPin && (
        <PinDetail
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onDeleted={() => {
            setSelectedPin(null);
            if (mapRef.current) void refreshData(mapRef.current);
          }}
        />
      )}

      {selectedBounty && (
        <BountyDetail
          bounty={selectedBounty}
          onClose={() => setSelectedBounty(null)}
          onChanged={(updated) => {
            setSelectedBounty(updated);
            setBounties((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b)),
            );
          }}
        />
      )}

      {creating && (
        <CreateSheet
          center={currentCenter()}
          onClose={() => setCreating(false)}
          onPinCreated={() => {
            if (mapRef.current) void refreshData(mapRef.current);
          }}
          onBountyCreated={(bounty) => setBounties((prev) => [...prev, bounty])}
        />
      )}
    </div>
  );
}
