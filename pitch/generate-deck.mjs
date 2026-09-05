// Génère pitch/CestomClash228-Pitch.pptx — format concours CréaAfrica (voir docs/CONCOURS.md).
// Contenu tiré de docs/BUSINESS_PLAN.md, docs/VISION.md et docs/PLAN_EXTENSION.md § Pivot
// 2026-08-31. Ré-exécutable : `node generate-deck.mjs` régénère le fichier en place, TOUJOURS
// suivi de `python verify_deck.py` (voir README.md) — aucun outil de rendu PowerPoint disponible
// ici, c'est la seule vérification réelle possible.
//
// 5 slides : Couverture / Problème / Solution / Business Case / Conclusion — dépasse le "3-4
// slides max" de docs/CONCOURS.md, assumé le 2026-08-31 sur demande explicite de l'utilisateur
// (ordre problème->solution->...->business case->conclusion avec une VRAIE slide de clôture,
// distincte d'une slide de données). À trimmer à 4 (fusionner Problème+Solution) si le cap strict
// prime en pratique — voir la note dans le rapport de session correspondant.
//
// Pas d'illustrations 3D generees par IA (aucun moteur de generation d'images ni fonction de
// vision par ordinateur disponible dans cet environnement, verifie par recherche d'outils le
// 2026-08-31 — voir la conversation). Richesse visuelle obtenue uniquement via des primitives
// pptxgenjs dont le modele de positionnement (x/y/w/h/rotate/flipH, meme systeme que rect/ellipse
// deja verifie dans ce fichier) est confirme dans node_modules/pptxgenjs/types/index.d.ts :
// degrades, transparence, ombre-comme-glow (ShadowProps ne connait que 'outer'|'inner'|'none',
// pas de type 'glow' natif — l'effet neon est simule par un outer-shadow a decalage nul), et les
// presets 'diamond'/'parallelogram' pour un accent geometrique "isometrique" (pas de custGeom :
// son systeme de coordonnees n'est documente nulle part dans les fichiers embarques, prudence
// plutot que deviner sur un rendu qu'on ne peut pas voir).
import PptxGenJS from 'pptxgenjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'brand', 'CESTOM.png');

// Palette assombrie/repunchee vers "anthracite profond + neons" (direction afro-futuriste
// retenue le 2026-08-31, voir docs/PLAN_EXTENSION.md) — mêmes rôles fonctionnels que la palette
// d'origine, teintes resserrees. Rouge/or/vert restent la reference discrete au drapeau togolais
// (accentBar), jamais utilises de façon litterale/drapeau.
const COLOR = {
  bg: '14161C',
  bgElevated: '1D2028',
  bgCard: '242836',
  line: '363C4C',
  ink: 'F5F3EE',
  inkMuted: 'A3ABBD',
  cyan: '3FE0FF',
  red: 'FF4D5E',
  gold: 'FFC94D',
  green: '2FE894',
};
const FONT_HEAD = 'Bahnschrift';
const FONT_BODY = 'Segoe UI';
const BRAND = 'CESTOMCLASH228';
const TAGLINE = 'Explore. Partage. Level-up.';

// Les 6 vraies villes CESTOM (source cestom.org, capture du 2026-08-31) — x/y dupliques de
// apps/web/src/lib/morocco-geo.ts (meme duplication assumee que ce fichier fait deja avec
// apps/api/src/cities/cities.service.ts : petite table statique, pas de pipeline TS partage avec
// ce script Node autonome).
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
pptx.defineLayout({ name: 'CC228', width: 13.333, height: 7.5 });
pptx.layout = 'CC228';
pptx.author = 'CESTOM';
pptx.title = 'CestomClash228';

const W = 13.333;
const H = 7.5;
const MARGIN = 0.7;

function baseSlide() {
  const s = pptx.addSlide();
  s.background = { color: COLOR.bg };
  return s;
}

// Glow neon simule : ombre externe a decalage nul, flou large, couleur d'accent. ShadowProps
// (node_modules/pptxgenjs/types/index.d.ts) n'a pas de type 'glow' natif — c'est la substitution
// standard pour cet effet en OOXML.
function glow(color, opts = {}) {
  return {
    type: 'outer',
    color,
    blur: opts.blur ?? 10,
    offset: 0,
    angle: 0,
    opacity: opts.opacity ?? 0.45,
  };
}

// Icone simple : cercle plein + glyphe texte (pas d'image externe, pas de police d'icones — zero
// risque de rendu casse sur une machine sans la bonne police).
function iconDot(s, x, y, d, color, glyph) {
  s.addShape(pptx.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color }, line: { type: 'none' }, shadow: glow(color, { blur: 6, opacity: 0.5 }),
  });
  s.addText(glyph, {
    x, y, w: d, h: d, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD, fontSize: d * 44, bold: true, color: COLOR.bg,
  });
}

// Accent de fond discret : grand cercle a faible opacite, en partie hors-cadre sur le bord droit,
// entre la zone de titre et le footer (ne chevauche ni l'un ni l'autre).
function edgeAccent(s, color) {
  s.addShape(pptx.ShapeType.ellipse, {
    x: W - 1.3, y: 2.6, w: 3.6, h: 3.6,
    fill: { color, transparency: 92 },
    line: { type: 'none' },
  });
}

// Carte "verre depoli" : fond degrade sombre + liseré lumineux en haut (simule un reflet de bord
// de verre) + bordure fine coloree translucide + glow doux. Remplace les roundRect a fond plat de
// la version precedente.
function glassCard(s, { x, y, w, h, accent, radius = 0.07 }) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: radius,
    fill: {
      type: 'gradient',
      stops: [
        { color: COLOR.bgCard, position: 0 },
        { color: COLOR.bgElevated, position: 100 },
      ],
      angle: 105,
    },
    line: { color: accent, width: 1, transparency: 30 },
    shadow: glow(accent, { blur: 8, opacity: 0.28 }),
  });
  const inset = radius * h * 1.4;
  s.addShape(pptx.ShapeType.rect, {
    x: x + inset, y: y + 0.01, w: Math.max(0.1, w - inset * 2), h: 0.02,
    fill: { color: accent, transparency: 35 }, line: { type: 'none' },
  });
}

// Accent geometrique "isometrique" : 3 presets standard (diamond dessus + 2 parallelogrammes,
// meme modele x/y/w/h que rect/ellipse) plutot qu'une geometrie personnalisee non verifiable.
// Approximation volontairement modeste (petit ornement decoratif, jamais porteur de contenu) —
// jamais vue a l'ecran avant l'utilisateur, voir README.md.
function isoCube(s, { x, y, size, color }) {
  const faceH = size * 0.5;
  const sideW = size * 0.52;
  const sideH = size * 0.62;
  s.addShape(pptx.ShapeType.diamond, {
    x, y, w: size, h: faceH,
    fill: { color, transparency: 15 }, line: { type: 'none' },
  });
  s.addShape(pptx.ShapeType.parallelogram, {
    x, y: y + faceH * 0.52, w: sideW, h: sideH,
    fill: { color, transparency: 60 }, line: { type: 'none' }, flipH: true,
  });
  s.addShape(pptx.ShapeType.parallelogram, {
    x: x + size - sideW, y: y + faceH * 0.52, w: sideW, h: sideH,
    fill: { color, transparency: 40 }, line: { type: 'none' },
  });
}

// Footer identique sur chaque slide : nom + tagline (gauche), pagination (droite).
function footer(s, pageLabel) {
  s.addText([
    { text: BRAND + '  ', options: { color: COLOR.inkMuted, bold: true } },
    { text: '· ' + TAGLINE, options: { color: COLOR.inkMuted, bold: false } },
  ], {
    x: MARGIN, y: H - 0.5, w: 7, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 10, charSpacing: 1,
  });
  s.addText(pageLabel, {
    x: W - MARGIN - 4, y: H - 0.5, w: 4, h: 0.3, align: 'right',
    fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkMuted,
  });
}

function accentBar(s, y) {
  s.addShape(pptx.ShapeType.rect, {
    x: MARGIN, y, w: 1.1, h: 0.06,
    fill: {
      type: 'gradient',
      stops: [
        { color: COLOR.red, position: 0 },
        { color: COLOR.gold, position: 50 },
        { color: COLOR.green, position: 100 },
      ],
      angle: 0,
    },
  });
}

// Header identique sur chaque slide (hors couverture) : bandeau titre + petit rappel de marque.
function titleBlock(s, title, subtitle) {
  accentBar(s, 0.55);
  s.addText(title, {
    x: MARGIN, y: 0.68, w: W - MARGIN * 2 - 2.6, h: 0.85,
    fontFace: FONT_HEAD, fontSize: 27, bold: true, color: COLOR.ink,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: MARGIN, y: 1.42, w: W - MARGIN * 2, h: 0.45,
      fontFace: FONT_BODY, fontSize: 13, color: COLOR.inkMuted,
    });
  }
  s.addText(BRAND, {
    x: W - MARGIN - 2.6, y: 0.7, w: 2.6, h: 0.4, align: 'right',
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: COLOR.inkMuted, charSpacing: 1,
  });
}

// Rangee de 3 cartes plein-largeur (utilisee par Probleme et Solution, meme grille pour que le
// jury associe visuellement les deux slides carte-a-carte). Une seule couleur d'accent par
// slide (rouge = probleme, vert = solution) — coherent avec l'icone (! ou +) et edgeAccent.
function threeCardRow(s, y, cardH, items, iconGlyph, accent) {
  const colW = (W - MARGIN * 2 - 0.6) / 3;
  items.forEach(([heading, body], i) => {
    const x = MARGIN + i * (colW + 0.3);
    glassCard(s, { x, y, w: colW, h: cardH, accent });
    iconDot(s, x + colW - 0.44, y + 0.16, 0.32, accent, iconGlyph);
    s.addText(heading, {
      x: x + 0.25, y: y + 0.16, w: colW - 0.6, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 13.5, bold: true, color: accent, valign: 'top',
    });
    s.addText(body, {
      x: x + 0.25, y: y + 0.68, w: colW - 0.5, h: cardH - 0.85,
      fontFace: FONT_BODY, fontSize: 11, color: COLOR.inkMuted, valign: 'top', lineSpacingMultiple: 1.25,
    });
  });
}

const PROBLEM_ITEMS = [
  ['Information fragmentée', "WhatsApp non indexable, non consultable après coup, aucune valeur générée pour personne."],
  ["Aide rendue non valorisée", "Celui qui aide un pair n'obtient aujourd'hui aucune reconnaissance durable, aucune trace."],
  ["Isolement à l'arrivée", "Un nouvel arrivant manque des codes locaux essentiels au moment où il en a le plus besoin."],
];
const SOLUTION_ITEMS = [
  ['Carte par ville + Pins', "Informations pratiques persistantes, consultables par tous, ancrées à un lieu précis."],
  ['Bounties + Notation', "Demande d'aide résolue → note publique (1-5) → réputation qui se construit dans la durée."],
  ['Ancrage CESTOM', "Porté par une communauté déjà organisée sur le terrain — pas une app anonyme de plus."],
];

// ---------- 1. Couverture ----------
{
  const s = baseSlide();
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: H - 1.2, w: W, h: 0.08,
    fill: {
      type: 'gradient',
      stops: [
        { color: COLOR.red, position: 0 },
        { color: COLOR.gold, position: 50 },
        { color: COLOR.green, position: 100 },
      ],
    },
  });
  // Petit accent geometrique isometrique, coin superieur droit — decoratif, loin du texte centre.
  isoCube(s, { x: 11.55, y: 0.4, size: 0.82, color: COLOR.cyan });
  isoCube(s, { x: 10.55, y: 0.78, size: 0.58, color: COLOR.gold });
  isoCube(s, { x: 11.85, y: 1.12, size: 0.46, color: COLOR.green });

  s.addText([
    { text: 'CESTOMCLASH', options: { color: COLOR.ink } },
    { text: '228', options: { color: COLOR.gold } },
  ], {
    x: 0, y: 2.3, w: W, h: 1.2, align: 'center',
    fontFace: FONT_HEAD, fontSize: 52, bold: true, charSpacing: 1,
  });
  s.addText(TAGLINE, {
    x: 0, y: 3.5, w: W, h: 0.6, align: 'center',
    fontFace: FONT_BODY, fontSize: 20, color: COLOR.cyan,
  });
  s.addText(
    "La plateforme qui transforme l'entraide entre étudiants togolais au Maroc en réputation — et en revenu",
    {
      x: W / 2 - 4.5, y: 4.15, w: 9, h: 0.6, align: 'center',
      fontFace: FONT_BODY, fontSize: 13, color: COLOR.inkMuted,
    },
  );
  s.addImage({ path: LOGO_PATH, x: W / 2 - 0.35, y: 5.3, w: 0.7, h: 0.7 });
  s.addText('Concours CréaAfrica 2026 · Propulsé par CESTOM', {
    x: 0, y: 6.1, w: W, h: 0.4, align: 'center',
    fontFace: FONT_BODY, fontSize: 12, color: COLOR.inkMuted,
  });
}

// ---------- 2. Probleme ----------
{
  const s = baseSlide();
  edgeAccent(s, COLOR.red);
  titleBlock(s, 'Le problème', "Trois frictions réelles, vécues chaque semaine par un étudiant togolais au Maroc");
  threeCardRow(s, 2.25, 2.15, PROBLEM_ITEMS, '!', COLOR.red);

  // Citation reelle, deja utilisee dans le pitch deck d'origine (docs/LEAN_CANVAS.md /
  // git history) — pas une nouvelle affirmation inventee.
  s.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN, y: 4.75, w: W - MARGIN * 2, h: 1.15, rectRadius: 0.08,
    fill: { color: COLOR.bgCard }, line: { color: COLOR.red, width: 1, transparency: 30 },
    shadow: glow(COLOR.red, { blur: 8, opacity: 0.25 }),
  });
  s.addText(
    '"Je suis coincé à la gare de Casa-Voyageurs à 23h, qui peut m\'héberger ?"',
    {
      x: MARGIN + 0.35, y: 4.75, w: W - MARGIN * 2 - 0.7, h: 1.15, valign: 'middle',
      fontFace: FONT_BODY, italic: true, fontSize: 15, color: COLOR.ink,
    },
  );
  footer(s, '02 · Problème');
}

// ---------- 3. Solution ----------
{
  const s = baseSlide();
  edgeAccent(s, COLOR.green);
  titleBlock(s, 'Notre réponse directe', "Chaque problème identifié a une réponse produit concrète, déjà en code — pas un vœu pieux");
  threeCardRow(s, 2.25, 2.15, SOLUTION_ITEMS, '+', COLOR.green);

  // Flux "self-explained" : les 3 verbes de la tagline, comme parcours en 3 gestes.
  const steps = ['Explore', 'Partage', 'Level-up'];
  const stepY = 4.95, stepR = 0.28;
  const stepColors = [COLOR.cyan, COLOR.gold, COLOR.green];
  const stepX0 = W / 2 - 3.4;
  const gap = 3.4;
  steps.forEach((label, i) => {
    const cx = stepX0 + i * gap;
    if (i > 0) {
      s.addShape(pptx.ShapeType.line, {
        x: stepX0 + (i - 1) * gap + stepR * 2, y: stepY + stepR, w: gap - stepR * 2, h: 0,
        line: { color: COLOR.line, width: 1.5, dashType: 'sysDot' },
      });
    }
    iconDot(s, cx, stepY, stepR * 2, stepColors[i], String(i + 1));
    s.addText(label, {
      x: cx - 0.8, y: stepY + stepR * 2 + 0.08, w: stepR * 2 + 1.6, h: 0.3, align: 'center',
      fontFace: FONT_HEAD, fontSize: 12, bold: true, color: COLOR.ink,
    });
  });
  s.addText('De la première visite à la réputation construite — zéro friction.', {
    x: 0, y: 5.75, w: W, h: 0.3, align: 'center',
    fontFace: FONT_BODY, fontSize: 10.5, color: COLOR.inkMuted,
  });
  footer(s, '03 · Solution');
}

// ---------- 4. Business Case ----------
{
  const s = baseSlide();
  edgeAccent(s, COLOR.cyan);
  titleBlock(s, "Business case : l'impact d'abord, prouvé dès le jour 1", "Pas de bénévolat — un flux monétaire construit dès la version présentée au concours");
  const phases = [
    ['Phase 1 — Maintenant', 'Sponsoring vérifié', "Un acteur qui veut un privilège (Pin mis en avant) fait un virement réel vers un compte CESTOM dédié, soumet une preuve dans l'app, un vérificateur valide. 0 % prélevé par une passerelle de paiement tierce — tout reste dans le circuit CESTOM.", COLOR.gold],
    ['Phase 2 — Après traction', 'Commission sur services rendus', "Une fois la confiance et l'usage établis via la Phase 1, commission sur les mises en relation payantes entre étudiants.", COLOR.cyan],
    ['Phase 3 — Vision', 'Licence à d\'autres diasporas', "Architecture (carte, réputation, sponsoring vérifié, modération spatiale) transposable à toute communauté étudiante structurée autour d'une association reconnue.", COLOR.green],
  ];
  const colW = (W - MARGIN * 2 - 0.6) / 3;
  phases.forEach(([tag, h, body, color], i) => {
    const x = MARGIN + i * (colW + 0.3);
    glassCard(s, { x, y: 2.15, w: colW, h: 1.95, accent: color });
    iconDot(s, x + colW - 0.36, 2.28, 0.3, color, String(i + 1));
    s.addText(tag, { x: x + 0.22, y: 2.3, w: colW - 0.6, h: 0.3, fontFace: FONT_BODY, fontSize: 10, color });
    s.addText(h, {
      x: x + 0.22, y: 2.6, w: colW - 0.4, h: 0.6, fontFace: FONT_HEAD, fontSize: 13.5, bold: true, color: COLOR.ink, valign: 'top',
    });
    s.addText(body, {
      x: x + 0.22, y: 3.25, w: colW - 0.44, h: 1.75, fontFace: FONT_BODY, fontSize: 10, color: COLOR.inkMuted, valign: 'top', lineSpacingMultiple: 1.2,
    });
  });

  // Mini-carte reelle des 6 villes CESTOM avec effet reseau (lignes de chaque ville vers le
  // centroide, glow doux) - illustre concretement l'avantage concurrentiel "effet de reseau
  // spatial" du business plan.
  const mapBoxX = MARGIN, mapBoxY = 4.45, mapBoxW = 3.9, mapBoxH = 1.85;
  s.addShape(pptx.ShapeType.roundRect, {
    x: mapBoxX, y: mapBoxY, w: mapBoxW, h: mapBoxH, rectRadius: 0.08,
    fill: { color: COLOR.bgCard }, line: { color: COLOR.line, width: 1 },
  });
  const xs = CITY_POINTS.map((c) => c.x), ys = CITY_POINTS.map((c) => c.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padIn = 0.55;
  const plotX0 = mapBoxX + padIn, plotX1 = mapBoxX + mapBoxW - padIn - 0.35;
  const plotY0 = mapBoxY + 0.32, plotY1 = mapBoxY + mapBoxH - 0.5;
  const maxMembers = Math.max(...CITY_POINTS.map((c) => c.members));
  const minMembers = Math.min(...CITY_POINTS.map((c) => c.members));
  const plotted = CITY_POINTS.map((c) => {
    const px = plotX0 + ((c.x - minX) / (maxX - minX)) * (plotX1 - plotX0);
    const py = plotY0 + ((c.y - minY) / (maxY - minY)) * (plotY1 - plotY0);
    const t = (Math.sqrt(c.members) - Math.sqrt(minMembers)) / (Math.sqrt(maxMembers) - Math.sqrt(minMembers));
    const r = 0.05 + t * 0.07;
    return { ...c, px, py, r };
  });
  const centroidPx = plotted.reduce((sum, c) => sum + c.px, 0) / plotted.length;
  const centroidPy = plotted.reduce((sum, c) => sum + c.py, 0) / plotted.length;
  plotted.forEach((c) => {
    s.addShape(pptx.ShapeType.line, {
      x: Math.min(c.px, centroidPx), y: Math.min(c.py, centroidPy),
      w: Math.abs(c.px - centroidPx) || 0.01, h: Math.abs(c.py - centroidPy) || 0.01,
      line: { color: COLOR.cyan, width: 0.75, transparency: 55 },
    });
  });
  plotted.forEach((c) => {
    s.addShape(pptx.ShapeType.ellipse, {
      x: c.px - c.r, y: c.py - c.r, w: c.r * 2, h: c.r * 2,
      fill: { color: COLOR.gold }, line: { color: COLOR.bg, width: 0.75 },
      shadow: glow(COLOR.gold, { blur: 5, opacity: 0.4 }),
    });
  });
  // Pas de label de nom individuel par ville sur la mini-carte : verifie par script Python
  // (conda base, lxml) le 2026-08-31 que des paires geographiquement proches (Rabat/Casablanca)
  // produisaient un chevauchement de boites de texte >25% une fois les labels centres sous
  // chaque point - les noms vont dans la legende textuelle unique ci-dessous.
  const legend = CITY_POINTS
    .slice()
    .sort((a, b) => b.members - a.members)
    .map((c) => `${c.name} ${c.members}`)
    .join('  ·  ');
  s.addText(legend, {
    x: mapBoxX + 0.25, y: mapBoxY + mapBoxH - 0.32, w: mapBoxW - 0.5, h: 0.28, align: 'center',
    fontFace: FONT_BODY, fontSize: 7.5, color: COLOR.inkMuted,
  });
  s.addText([
    { text: String(CITY_TOTAL), options: { bold: true, fontSize: 28, color: COLOR.gold, breakLine: true } },
    { text: 'membres CESTOM, 6 villes', options: { fontSize: 11, color: COLOR.ink, breakLine: true } },
    { text: 'Source : cestom.org', options: { fontSize: 8, color: COLOR.inkMuted } },
  ], {
    x: mapBoxX + mapBoxW + 0.3, y: mapBoxY, w: W - MARGIN - (mapBoxX + mapBoxW + 0.3), h: mapBoxH,
    valign: 'middle', fontFace: FONT_HEAD, lineSpacingMultiple: 1.15,
  });
  footer(s, '04 · Business case');
}

// ---------- 5. Conclusion ----------
{
  const s = baseSlide();
  edgeAccent(s, COLOR.gold);
  titleBlock(s, "Ce qu'on a déjà construit, et ce qu'on vous demande");
  const real = [
    'Carte, demandes d\'aide, authentification, gouvernance à 2 niveaux — code fonctionnel, testé (59/59 tests automatisés)',
    'Direction visuelle afro-futuriste appliquée au produit réel (palette, écran d\'accueil)',
    'Sponsoring vérifié + notation : construits, testés bout-en-bout, audités avant mise en ligne',
    'Hébergement 100 % gratuit (aucune carte bancaire engagée) — marge protégée dès le 1er sponsor',
  ];
  glassCard(s, { x: MARGIN, y: 2.15, w: W - MARGIN * 2, h: 1.95, accent: COLOR.cyan });
  s.addText(real.map((t) => ({ text: t, options: { bullet: { code: '25B8' }, color: COLOR.ink, breakLine: true } })), {
    x: MARGIN + 0.35, y: 2.35, w: W - MARGIN * 2 - 0.7, h: 1.6,
    fontFace: FONT_BODY, fontSize: 13, valign: 'top', lineSpacingMultiple: 1.45,
  });

  glassCard(s, { x: MARGIN, y: 4.35, w: W - MARGIN * 2, h: 1.25, accent: COLOR.gold });
  s.addText([
    { text: 'Ce qu\'on demande : ', options: { bold: true, color: COLOR.gold } },
{ text: "De la visibilité — l'exposition du concours suffit à amorcer la traction. Le reste suivra naturellement.", options: { italic: true, color: COLOR.inkMuted } },
  ], {
    x: MARGIN + 0.35, y: 4.35, w: W - MARGIN * 2 - 0.7, h: 1.25, valign: 'middle',
    fontFace: FONT_BODY, fontSize: 13, lineSpacingMultiple: 1.3,
  });

  s.addText(TAGLINE, {
    x: 0, y: 5.85, w: W, h: 0.4, align: 'center',
    fontFace: FONT_HEAD, fontSize: 15, bold: true, color: COLOR.cyan, charSpacing: 1,
  });
  s.addText('Wilfried TSETSE · CESTOM · tsetsewilfried@gmail.com', {
    x: MARGIN, y: 6.45, w: W - MARGIN * 2, h: 0.35, align: 'center',
    fontFace: FONT_BODY, fontSize: 11, color: COLOR.inkMuted,
  });
  footer(s, '05 · Conclusion');
}

const outPath = path.join(__dirname, 'CestomClash228-Pitch.pptx');
await pptx.writeFile({ fileName: outPath });
console.log('Écrit :', outPath);
