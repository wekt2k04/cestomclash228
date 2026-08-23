export interface Bounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function bboxQueryString(bounds: Bounds): string {
  return `minLng=${bounds.minLng}&minLat=${bounds.minLat}&maxLng=${bounds.maxLng}&maxLat=${bounds.maxLat}`;
}

// Heuristique simple zoom -> precision de clustering en metres (pas une
// formule geodesique exacte, suffisant pour le regroupement visuel du MVP -
// voir la meme reserve documentee cote backend dans pins.service.ts).
export function precisionMetersForZoom(zoom: number): number {
  const meters = 200_000 / Math.pow(2, zoom);
  return Math.min(5000, Math.max(20, Math.round(meters)));
}

export function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expirée";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}
