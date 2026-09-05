// Génère pitch/CestomClash228-VideoAssets.pptx — 5 slides portrait (format mobile, pas
// présentation), un visuel par moment du script vidéo (pitch/VIDEO_SCRIPT.md). Remplace
// l'approche précédente (pitch/video-assets/*.html) sur demande explicite de l'utilisateur du
// 2026-09-05 ("ne me crée plus des HTML, je veux un PPT de 5 images bien structurées pour la
// vidéo - Canva se chargera du reste") — les rendus HTML dans son propre navigateur ne le
// satisfaisaient pas. Fichier INDÉPENDANT de generate-deck.mjs (le PPT business plan/jury,
// 16:9, 5 slides denses) : deux livrables différents, pas de couplage entre les deux scripts.
//
// Pourquoi 5 slides et pas 4 (le script vidéo n'a que 4 blocs temporels) : le script a 5 MOMENTS
// VISUELS distincts (HOOK / PRODUIT / Bounty / Ghost Mode / CTA-Outro — le bloc FEATURES 30-45s
// contient 2 visuels dans le même créneau temporel). "Pin Doré/Sponsoring" (l'ancien
// 02-pin-dore.html) N'EST PAS repris comme 5e slide - décision déjà actée dans
// VIDEO_SCRIPT.md § Notes de production (risque de sur-promettre un mécanisme pas visible sur la
// carte dans le produit réel) ; le CTA/Outro (jamais construit comme visuel avant) prend sa place.
//
// Palette reprise EXACTEMENT du CSS compilé de l'app réelle (apps/web/src/app/globals.css,
// vérifiée le 2026-09-05) - PAS la palette cyan de generate-deck.mjs (pré-refonte afro-futuriste
// du 2026-08-31, jamais mise à jour depuis dans ce fichier-là).
//
// Aucune mention de "CESTOM" comme organisation (retour utilisateur du jour : "on se sert de
// leurs données, on leur propose un service") - "CestomClash228" reste comme nom de produit
// (décision confirmée explicitement). Pas de logo importé.
import PptxGenJS from 'pptxgenjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLOR = {
  bg: '1A0704',
  bgElevated: '24130F',
  bgCard: '2C1C17',
  line: '63453A',
  ink: 'F6F1EB',
  inkMuted: 'B8A79C',
  inkFaint: '7F716A',
  terracotta: 'ED7940',
  terracottaInk: '120805',
  red: 'E9504D',
  gold: 'EAB532',
  green: '3ABA6A',
};
const FONT_HEAD = 'Bahnschrift';
const FONT_BODY = 'Segoe UI';
const BRAND = 'CESTOMCLASH228';
const TAGLINE = 'Explore. Partage. Level-up.';

// 6 vraies villes CESTOM (source cestom.org) - mêmes coordonnées que
// apps/web/src/lib/morocco-geo.ts / pitch/generate-deck.mjs (même duplication déjà assumée
// ailleurs dans ce projet, petite table statique).
const CITY_POINTS = [
  { name: 'Rabat', x: 506.9, y: 139.79, members: 220 },
  { name: 'Casablanca', x: 471.04, y: 161.25, members: 180 },
  { name: 'Marrakech', x: 452.3, y: 254.38, members: 95 },
  { name: 'Fès', x: 595.12, y: 139.21, members: 85 },
  { name: 'Tanger', x: 555.18, y: 56.48, members: 40 },
  { name: 'Oujda', x: 743.13, y: 107.89, members: 30 },
];
const CITY_TOTAL = CITY_POINTS.reduce((sum, c) => sum + c.members, 0);

const pptx = new PptxGenJS();
// Portrait, ratio proche de 390x844 (format mobile des anciens mockups HTML) - PAS le layout
// 16:9 de generate-deck.mjs (un rectangle paysage écraserait un contenu pensé pour un écran de
// téléphone).
pptx.defineLayout({ name: 'VIDEO228', width: 4.333, height: 9.375 });
pptx.layout = 'VIDEO228';
pptx.author = 'Wilfried TSETSE';
pptx.title = 'CestomClash228 — Assets vidéo';

const W = 4.333;
const H = 9.375;
const MARGIN = 0.26;

function baseSlide() {
  const s = pptx.addSlide();
  s.background = { color: COLOR.bg };
  return s;
}

function glow(color, opts = {}) {
  return {
    type: 'outer',
    color,
    blur: opts.blur ?? 8,
    offset: 0,
    angle: 0,
    opacity: opts.opacity ?? 0.4,
  };
}

function visionTag(s, text) {
  s.addText(text, {
    x: MARGIN, y: 0.22, w: W - MARGIN * 2, h: 0.3, align: 'center',
    fontFace: FONT_BODY, fontSize: 8, color: COLOR.inkFaint,
  });
}

const outPath = path.join(__dirname, 'CestomClash228-VideoAssets.pptx');

// ---------------------------------------------------------------------------
// Slide 1 — Hook (0-10s) : le problème, pas encore le produit.
// ---------------------------------------------------------------------------
{
  const s = baseSlide();
  visionTag(s, 'Hook 0–10s — le problème avant CestomClash228');

  // Bulles de chat chaotiques - texte repris tel quel de l'ancien
  // pitch/video-assets/00-hook-probleme.html (déjà écrit, déjà cohérent avec VIDEO_SCRIPT.md).
  const bubbles = [
    { t: 'quelqu’un sait où on paie la taxe de séjour ??', x: 0.32, y: 1.05, w: 2.3, rot: -6 },
    { t: '[vocal 0:52]  ·  +33 non lus', x: 2.55, y: 1.35, w: 1.55, rot: 4 },
    { t: 'URGENT quelqu’un a un logement pour demain 🙏', x: 0.5, y: 1.95, w: 2.4, rot: 3 },
    { t: '[image]  [image]  [image]', x: 2.55, y: 2.55, w: 1.5, rot: -4 },
    { t: 'c’est déjà répondu plus haut je crois', x: 0.3, y: 5.55, w: 2.15, rot: 5 },
    { t: 'quelqu’un peut réexpliquer la CNSS ?', x: 2.35, y: 6.05, w: 1.7, rot: -3 },
    { t: 'perso j’ai abandonné ce groupe 😅', x: 0.55, y: 6.55, w: 2.1, rot: -5 },
  ];
  bubbles.forEach((b) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: b.x, y: b.y, w: b.w, h: 0.55, rectRadius: 0.06, rotate: b.rot,
      fill: { color: COLOR.bgElevated, transparency: 15 },
      line: { type: 'none' },
    });
    s.addText(b.t, {
      x: b.x + 0.08, y: b.y, w: b.w - 0.16, h: 0.55, rotate: b.rot, valign: 'middle',
      fontFace: FONT_BODY, fontSize: 8.5, color: COLOR.inkMuted, lineSpacingMultiple: 1.1,
    });
  });

  // Silhouette centrale débordée (formes simples : ellipse tête, roundRect épaules) - même
  // esthétique plate/iconographique que le reste du set, pas de photo.
  const figCx = W / 2;
  s.addText('?', {
    x: figCx - 0.35, y: 3.55, w: 0.7, h: 0.55, align: 'center',
    fontFace: FONT_HEAD, fontSize: 30, bold: true, color: COLOR.inkFaint,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: figCx - 0.62, y: 4.55, w: 1.24, h: 0.95, rectRadius: 0.3,
    fill: { color: COLOR.bgCard }, line: { color: COLOR.line, width: 1 },
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: figCx - 0.42, y: 3.75, w: 0.84, h: 0.84,
    fill: { color: COLOR.bgCard }, line: { color: COLOR.line, width: 1 },
  });

  s.addText('Débarquer au Maroc, et devoir tout réapprendre seul.', {
    x: MARGIN + 0.2, y: 7.55, w: W - MARGIN * 2 - 0.4, h: 0.7, align: 'center',
    fontFace: FONT_HEAD, fontSize: 15, bold: true, color: COLOR.ink, lineSpacingMultiple: 1.15,
  });
  s.addText('Noyé·e dans des groupes WhatsApp qui n’aident plus personne.', {
    x: MARGIN + 0.3, y: 8.25, w: W - MARGIN * 2 - 0.6, h: 0.5, align: 'center',
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkFaint,
  });
}

// ---------------------------------------------------------------------------
// Slide 2 — Social-Map (10-30s) : le produit, carte réseau des 6 villes réelles.
// ---------------------------------------------------------------------------
{
  const s = baseSlide();
  s.addText([
    { text: BRAND.replace('228', ''), options: { color: COLOR.ink } },
    { text: '228', options: { color: COLOR.gold } },
  ], {
    x: MARGIN, y: 0.35, w: W - MARGIN * 2, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 17, bold: true, charSpacing: 1,
  });
  s.addText(TAGLINE, {
    x: MARGIN, y: 0.72, w: W - MARGIN * 2, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 10, bold: true, color: COLOR.terracotta,
  });

  // Mini-carte réseau - MÊME algorithme que generate-deck.mjs (lignes 369-428, déjà vérifié) :
  // glow doré + lignes vers le centroïde, sqrt(members) pour la taille, PAS de label individuel
  // par ville (contrainte déjà validée par script Python le 2026-08-31 : Rabat/Casablanca sont
  // trop proches, chevauchement de boîtes de texte >25% si labellisées individuellement) -
  // légende textuelle unique à la place.
  const mapBoxX = MARGIN, mapBoxY = 1.35, mapBoxW = W - MARGIN * 2, mapBoxH = 3.6;
  s.addShape(pptx.ShapeType.roundRect, {
    x: mapBoxX, y: mapBoxY, w: mapBoxW, h: mapBoxH, rectRadius: 0.08,
    fill: {
      type: 'gradient',
      stops: [{ color: COLOR.bgCard, position: 0 }, { color: COLOR.bgElevated, position: 100 }],
      angle: 105,
    },
    line: { color: COLOR.line, width: 1 },
  });
  const xs = CITY_POINTS.map((c) => c.x), ys = CITY_POINTS.map((c) => c.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padIn = 0.4;
  const plotX0 = mapBoxX + padIn, plotX1 = mapBoxX + mapBoxW - padIn;
  const plotY0 = mapBoxY + padIn, plotY1 = mapBoxY + mapBoxH - padIn;
  const maxMembers = Math.max(...CITY_POINTS.map((c) => c.members));
  const minMembers = Math.min(...CITY_POINTS.map((c) => c.members));
  const plotted = CITY_POINTS.map((c) => {
    const px = plotX0 + ((c.x - minX) / (maxX - minX)) * (plotX1 - plotX0);
    const py = plotY0 + ((c.y - minY) / (maxY - minY)) * (plotY1 - plotY0);
    const t = (Math.sqrt(c.members) - Math.sqrt(minMembers)) / (Math.sqrt(maxMembers) - Math.sqrt(minMembers));
    const r = 0.05 + t * 0.075;
    return { ...c, px, py, r };
  });
  const centroidPx = plotted.reduce((sum, c) => sum + c.px, 0) / plotted.length;
  const centroidPy = plotted.reduce((sum, c) => sum + c.py, 0) / plotted.length;
  plotted.forEach((c) => {
    s.addShape(pptx.ShapeType.line, {
      x: Math.min(c.px, centroidPx), y: Math.min(c.py, centroidPy),
      w: Math.abs(c.px - centroidPx) || 0.01, h: Math.abs(c.py - centroidPy) || 0.01,
      line: { color: COLOR.terracotta, width: 0.75, transparency: 55 },
    });
  });
  plotted.forEach((c) => {
    s.addShape(pptx.ShapeType.ellipse, {
      x: c.px - c.r, y: c.py - c.r, w: c.r * 2, h: c.r * 2,
      fill: { color: COLOR.gold }, line: { color: COLOR.bg, width: 0.75 },
      shadow: glow(COLOR.gold, { blur: 5, opacity: 0.4 }),
    });
  });
  const legend = CITY_POINTS.slice().sort((a, b) => b.members - a.members)
    .map((c) => `${c.name} ${c.members}`).join('  ·  ');
  s.addText(legend, {
    x: mapBoxX + 0.15, y: mapBoxY + mapBoxH - 0.42, w: mapBoxW - 0.3, h: 0.32, align: 'center',
    fontFace: FONT_BODY, fontSize: 7, color: COLOR.inkMuted,
  });

  s.addText([
    { text: String(CITY_TOTAL), options: { bold: true, fontSize: 30, color: COLOR.gold, breakLine: true } },
    { text: 'membres, 6 villes', options: { fontSize: 12, color: COLOR.ink } },
  ], {
    x: MARGIN, y: mapBoxY + mapBoxH + 0.3, w: W - MARGIN * 2, h: 1, align: 'center',
    fontFace: FONT_HEAD, lineSpacingMultiple: 1.15,
  });
  s.addText('Chaque astuce, chaque piège administratif — épinglé, visible par tous.', {
    x: MARGIN + 0.2, y: mapBoxY + mapBoxH + 1.35, w: W - MARGIN * 2 - 0.4, h: 0.6, align: 'center',
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkMuted, lineSpacingMultiple: 1.25,
  });
}

// ---------------------------------------------------------------------------
// Slide 3 — Bounty (30-45s, premier visuel) : urgence + notation.
// ---------------------------------------------------------------------------
{
  const s = baseSlide();
  visionTag(s, 'CESTOMCLASH228 — Bounty');

  const cardX = MARGIN, cardY = 1.3, cardW = W - MARGIN * 2, cardH = 5.6;
  s.addShape(pptx.ShapeType.roundRect, {
    x: cardX, y: cardY, w: cardW, h: cardH, rectRadius: 0.09,
    fill: {
      type: 'gradient',
      stops: [{ color: COLOR.bgCard, position: 0 }, { color: COLOR.bgElevated, position: 100 }],
      angle: 135,
    },
    line: { color: COLOR.line, width: 1 },
    shadow: glow(COLOR.terracotta, { blur: 10, opacity: 0.18 }),
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: cardX + 0.25, y: cardY + 0.3, w: 1.1, h: 0.36, rectRadius: 0.18,
    fill: { color: COLOR.bg }, line: { type: 'none' },
  });
  s.addText('🔥 Urgent', {
    x: cardX + 0.25, y: cardY + 0.3, w: 1.1, h: 0.36, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD, fontSize: 8.5, bold: true, color: COLOR.terracotta,
  });
  s.addText('02:14:59', {
    x: cardX + cardW - 1.5, y: cardY + 0.3, w: 1.25, h: 0.36, align: 'right', valign: 'middle',
    fontFace: FONT_HEAD, fontSize: 13, bold: true, color: COLOR.red,
  });

  s.addText('Besoin d’aide algo en urgence à la BU', {
    x: cardX + 0.25, y: cardY + 0.85, w: cardW - 0.5, h: 0.65,
    fontFace: FONT_HEAD, fontSize: 14, bold: true, color: COLOR.ink, lineSpacingMultiple: 1.1,
  });
  s.addText('Bloqué sur un exo de structures de données avant le rendu de demain matin. Une heure de ton temps peut débloquer toute ma nuit.', {
    x: cardX + 0.25, y: cardY + 1.55, w: cardW - 0.5, h: 1.05,
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkMuted, lineSpacingMultiple: 1.3,
  });
  s.addText('Rabat · publié par Kodjo T. il y a 12 min', {
    x: cardX + 0.25, y: cardY + 2.65, w: cardW - 0.5, h: 0.3,
    fontFace: FONT_BODY, fontSize: 8.5, color: COLOR.inkFaint,
  });

  s.addShape(pptx.ShapeType.line, {
    x: cardX + 0.25, y: cardY + 3.15, w: cardW - 0.5, h: 0.001,
    line: { color: COLOR.line, width: 1 },
  });

  s.addText('Réputation de qui a déjà aidé sur cette Bounty', {
    x: cardX + 0.25, y: cardY + 3.35, w: cardW - 0.5, h: 0.3,
    fontFace: FONT_BODY, fontSize: 9, color: COLOR.inkMuted,
  });
  const starW = 0.55, starGap = 0.12;
  for (let i = 0; i < 5; i += 1) {
    const on = i < 4;
    const sx = cardX + 0.25 + i * (starW + starGap);
    s.addShape(pptx.ShapeType.roundRect, {
      x: sx, y: cardY + 3.75, w: starW, h: starW, rectRadius: 0.1,
      fill: { color: on ? COLOR.terracotta : COLOR.bg },
      line: { color: on ? COLOR.terracotta : COLOR.line, width: 1 },
    });
    s.addText(String(i + 1), {
      x: sx, y: cardY + 3.75, w: starW, h: starW, align: 'center', valign: 'middle',
      fontFace: FONT_HEAD, fontSize: 11, bold: true,
      color: on ? COLOR.terracottaInk : COLOR.inkMuted,
    });
  }
  s.addText('4/5 — noté par l’auteur après résolution', {
    x: cardX + 0.25, y: cardY + 4.45, w: cardW - 0.5, h: 0.3,
    fontFace: FONT_BODY, fontSize: 8, color: COLOR.inkFaint,
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: cardX + 0.25, y: cardY + cardH - 0.75, w: cardW - 0.5, h: 0.55, rectRadius: 0.1,
    fill: { color: COLOR.terracotta }, line: { type: 'none' },
  });
  s.addText('Résoudre cette Bounty', {
    x: cardX + 0.25, y: cardY + cardH - 0.75, w: cardW - 0.5, h: 0.55, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: COLOR.terracottaInk,
  });
}

// ---------------------------------------------------------------------------
// Slide 4 — Ghost Mode (30-45s, second visuel) : toggle Public/Fantôme.
// ---------------------------------------------------------------------------
{
  const s = baseSlide();
  visionTag(s, 'Vision — Ghost Mode, anonymat réversible');

  s.addText('Ton espace, ton rythme', {
    x: MARGIN + 0.2, y: 2.3, w: W - MARGIN * 2 - 0.4, h: 0.5, align: 'center',
    fontFace: FONT_HEAD, fontSize: 17, bold: true, color: COLOR.ink,
  });
  s.addText('Pas prêt à publier à visage découvert ? Passe en Fantôme — révèle-toi quand tu veux.', {
    x: MARGIN + 0.5, y: 2.85, w: W - MARGIN * 2 - 1, h: 0.75, align: 'center',
    fontFace: FONT_BODY, fontSize: 10.5, color: COLOR.inkMuted, lineSpacingMultiple: 1.3,
  });

  const rowY = 4.3, rowH = 1.35, rowX = MARGIN + 0.35, rowW = W - MARGIN * 2 - 0.7;
  s.addShape(pptx.ShapeType.roundRect, {
    x: rowX, y: rowY, w: rowW, h: rowH, rectRadius: 0.5,
    fill: { color: COLOR.bgElevated }, line: { color: COLOR.line, width: 1 },
  });

  const avatarD = 0.7;
  s.addShape(pptx.ShapeType.ellipse, {
    x: rowX + 0.35, y: rowY + 0.15, w: avatarD, h: avatarD,
    fill: {
      type: 'gradient',
      stops: [{ color: COLOR.terracotta, position: 0 }, { color: COLOR.gold, position: 100 }],
      angle: 135,
    },
    line: { type: 'none' },
  });
  s.addText('👤', { x: rowX + 0.35, y: rowY + 0.15, w: avatarD, h: avatarD, align: 'center', valign: 'middle', fontSize: 22 });
  s.addText('Public', {
    x: rowX + 0.1, y: rowY + 0.95, w: 1.2, h: 0.3, align: 'center',
    fontFace: FONT_BODY, fontSize: 9, bold: true, color: COLOR.inkMuted,
  });

  const trackX = rowX + rowW / 2 - 0.4, trackY = rowY + 0.42;
  s.addShape(pptx.ShapeType.roundRect, {
    x: trackX, y: trackY, w: 0.8, h: 0.42, rectRadius: 0.21,
    fill: { color: COLOR.bgCard }, line: { color: COLOR.line, width: 1 },
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: trackX + 0.42, y: trackY + 0.05, w: 0.32, h: 0.32,
    fill: { color: COLOR.ink }, line: { type: 'none' },
  });

  s.addShape(pptx.ShapeType.ellipse, {
    x: rowX + rowW - 0.35 - avatarD, y: rowY + 0.15, w: avatarD, h: avatarD,
    fill: { color: COLOR.bgCard },
    line: { color: COLOR.line, width: 1 },
  });
  s.addText('👻', { x: rowX + rowW - 0.35 - avatarD, y: rowY + 0.15, w: avatarD, h: avatarD, align: 'center', valign: 'middle', fontSize: 22 });
  s.addText('Fantôme', {
    x: rowX + rowW - 1.3, y: rowY + 0.95, w: 1.2, h: 0.3, align: 'center',
    fontFace: FONT_BODY, fontSize: 9, bold: true, color: COLOR.ink,
  });

  s.addText([
    { text: 'Safe Space : ', options: { bold: true, color: COLOR.green } },
    { text: 'ton identité reste protégée tant que tu ne révèles pas ton post toi-même.', options: { color: COLOR.inkFaint } },
  ], {
    x: MARGIN + 0.4, y: rowY + rowH + 0.4, w: W - MARGIN * 2 - 0.8, h: 0.9, align: 'center',
    fontFace: FONT_BODY, fontSize: 9.5, lineSpacingMultiple: 1.3,
  });
}

// ---------------------------------------------------------------------------
// Slide 5 — CTA / Outro (45-60s) : logo, 650, tagline, appel au vote.
// ---------------------------------------------------------------------------
{
  const s = baseSlide();

  s.addShape(pptx.ShapeType.ellipse, {
    x: W / 2 - 1.6, y: 2.2, w: 3.2, h: 3.2,
    fill: { color: COLOR.terracotta, transparency: 92 }, line: { type: 'none' },
  });

  s.addText([
    { text: 'CESTOMCLASH', options: { color: COLOR.ink } },
    { text: '228', options: { color: COLOR.gold } },
  ], {
    x: MARGIN, y: 2.5, w: W - MARGIN * 2, h: 0.55, align: 'center',
    fontFace: FONT_HEAD, fontSize: 22, bold: true, charSpacing: 1,
  });

  s.addText(String(CITY_TOTAL), {
    x: MARGIN, y: 3.5, w: W - MARGIN * 2, h: 1.3, align: 'center',
    fontFace: FONT_HEAD, fontSize: 62, bold: true, color: COLOR.gold,
  });
  s.addText('étudiants togolais dans le réseau', {
    x: MARGIN + 0.3, y: 4.85, w: W - MARGIN * 2 - 0.6, h: 0.5, align: 'center',
    fontFace: FONT_BODY, fontSize: 11, color: COLOR.inkMuted,
  });

  s.addText(TAGLINE, {
    x: MARGIN, y: 6.1, w: W - MARGIN * 2, h: 0.5, align: 'center',
    fontFace: FONT_HEAD, fontSize: 15, bold: true, color: COLOR.terracotta, charSpacing: 1,
  });

  s.addText('Votez CestomClash228', {
    x: MARGIN, y: 7.3, w: W - MARGIN * 2, h: 0.45, align: 'center',
    fontFace: FONT_HEAD, fontSize: 13, bold: true, color: COLOR.ink,
  });
  s.addText('Concours CréaAfrica 2026', {
    x: MARGIN, y: 7.75, w: W - MARGIN * 2, h: 0.4, align: 'center',
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkFaint,
  });
}

await pptx.writeFile({ fileName: outPath });
console.log('Écrit :', outPath);
