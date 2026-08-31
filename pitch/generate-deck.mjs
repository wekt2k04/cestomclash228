// Génère pitch/CestomClash228-Pitch.pptx — format concours CréaAfrica (voir docs/CONCOURS.md) :
// 4 slides max pour un pitch de 5 minutes, header/footer identiques sur chaque slide avec les
// métadonnées du projet (nom + tagline). Contenu tiré de docs/BUSINESS_PLAN.md, docs/VISION.md et
// docs/PLAN_EXTENSION.md § Pivot 2026-08-31. Ré-exécutable : `node generate-deck.mjs` régénère le
// fichier en place. Remplace l'ancienne version 11 slides (MindClash 228) — voir git log si besoin
// de retrouver ce contenu long-format.
import PptxGenJS from 'pptxgenjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'brand', 'CESTOM.png');

// Palette reprise du deck precedent (identite visuelle originale, tokens oklch approximes en
// hex). A revoir une fois l'Increment 2 (refonte visuelle, direction afro-futuriste retenue le
// 2026-08-31) fixe les vraies valeurs hex terracotta/aubergine — non bloquant pour le contenu.
const COLOR = {
  bg: '1A1D24',
  bgElevated: '242832',
  bgCard: '2A2F3B',
  line: '3A3F4C',
  ink: 'F4F1EC',
  inkMuted: '9CA3AF',
  cyan: '7DD3E0',
  red: 'E5484D',
  gold: 'F2C14E',
  green: '4CAF7D',
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

// Icone simple : cercle plein + glyphe texte (pas d'image externe, pas de police d'icones — zero
// risque de rendu casse sur une machine sans la bonne police).
function iconDot(s, x, y, d, color, glyph) {
  s.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color } });
  s.addText(glyph, {
    x, y, w: d, h: d, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD, fontSize: d * 44, bold: true, color: COLOR.bg,
  });
}

// Accent de fond discret : grand cercle a faible opacite, en partie hors-cadre sur le bord droit,
// entre la zone de titre et le footer (ne chevauche ni l'un ni l'autre). Formes simples uniquement
// (pas de chemin vectoriel complexe) - aucun outil de rendu PowerPoint disponible pour verifier
// visuellement, voir pitch/README.md.
function edgeAccent(s, color) {
  s.addShape(pptx.ShapeType.ellipse, {
    x: W - 1.3, y: 2.6, w: 3.6, h: 3.6,
    fill: { color, transparency: 92 },
    line: { type: 'none' },
  });
}

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

// Footer identique sur chaque slide : nom + tagline (gauche), pagination (droite) — format
// demande par l'utilisateur ("memes header et footers qui vont contenir les metadonnees du
// projet dont le nom").
function footer(s, pageLabel) {
  s.addText([
    { text: BRAND + '  ', options: { color: COLOR.inkMuted, bold: true } },
    { text: '· ' + TAGLINE, options: { color: COLOR.inkMuted, bold: false } },
  ], {
    x: MARGIN,
    y: H - 0.5,
    w: 7,
    h: 0.3,
    fontFace: FONT_HEAD,
    fontSize: 10,
    charSpacing: 1,
  });
  s.addText(pageLabel, {
    x: W - MARGIN - 4,
    y: H - 0.5,
    w: 4,
    h: 0.3,
    align: 'right',
    fontFace: FONT_BODY,
    fontSize: 10,
    color: COLOR.inkMuted,
  });
}

function accentBar(s, y) {
  s.addShape(pptx.ShapeType.rect, {
    x: MARGIN,
    y,
    w: 1.1,
    h: 0.06,
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

// Header identique sur chaque slide (hors couverture) : bandeau titre + petit rappel de marque
// en haut a droite, en plus du footer.
function titleBlock(s, title, subtitle) {
  accentBar(s, 0.55);
  s.addText(title, {
    x: MARGIN,
    y: 0.68,
    w: W - MARGIN * 2 - 2.6,
    h: 0.85,
    fontFace: FONT_HEAD,
    fontSize: 28,
    bold: true,
    color: COLOR.ink,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: MARGIN,
      y: 1.42,
      w: W - MARGIN * 2,
      h: 0.45,
      fontFace: FONT_BODY,
      fontSize: 13,
      color: COLOR.inkMuted,
    });
  }
  s.addText(BRAND, {
    x: W - MARGIN - 2.6,
    y: 0.7,
    w: 2.6,
    h: 0.4,
    align: 'right',
    fontFace: FONT_HEAD,
    fontSize: 11,
    bold: true,
    color: COLOR.inkMuted,
    charSpacing: 1,
  });
}

// ---------- 1. Couverture ----------
{
  const s = baseSlide();
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: H - 1.2,
    w: W,
    h: 0.08,
    fill: {
      type: 'gradient',
      stops: [
        { color: COLOR.red, position: 0 },
        { color: COLOR.gold, position: 50 },
        { color: COLOR.green, position: 100 },
      ],
    },
  });
  s.addText([
    { text: 'CESTOMCLASH', options: { color: COLOR.ink } },
    { text: '228', options: { color: COLOR.gold } },
  ], {
    x: 0,
    y: 2.3,
    w: W,
    h: 1.2,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 52,
    bold: true,
    charSpacing: 1,
  });
  s.addText(TAGLINE, {
    x: 0,
    y: 3.5,
    w: W,
    h: 0.6,
    align: 'center',
    fontFace: FONT_BODY,
    fontSize: 20,
    color: COLOR.cyan,
  });
  s.addText(
    "La plateforme qui transforme l'entraide entre étudiants togolais au Maroc en réputation — et en revenu",
    {
      x: W / 2 - 4.5,
      y: 4.15,
      w: 9,
      h: 0.6,
      align: 'center',
      fontFace: FONT_BODY,
      fontSize: 13,
      color: COLOR.inkMuted,
    },
  );
  s.addImage({ path: LOGO_PATH, x: W / 2 - 0.35, y: 5.3, w: 0.7, h: 0.7 });
  s.addText('Concours CréaAfrica 2026 · Propulsé par CESTOM', {
    x: 0,
    y: 6.1,
    w: W,
    h: 0.4,
    align: 'center',
    fontFace: FONT_BODY,
    fontSize: 12,
    color: COLOR.inkMuted,
  });
}

// ---------- 2. Probleme -> Solution ----------
{
  const s = baseSlide();
  edgeAccent(s, COLOR.cyan);
  titleBlock(s, 'Le problème, et notre réponse directe', "Chaque problème identifié a une réponse produit concrète — pas un vœu pieux");
  const rows = [
    [
      'Information fragmentée',
      "WhatsApp non indexable, non consultable après coup, aucune valeur générée pour personne.",
      'Carte par ville + Pins',
      "Informations pratiques persistantes, consultables par tous, ancrées à un lieu précis.",
    ],
    [
      "Aide rendue non valorisée",
      "Celui qui aide un pair n'obtient aujourd'hui aucune reconnaissance durable, aucune trace.",
      'Bounties + Notation',
      "Demande d'aide résolue → note publique (1-5) → réputation qui se construit dans la durée.",
    ],
    [
      "Isolement à l'arrivée",
      "Un nouvel arrivant manque des codes locaux essentiels au moment où il en a le plus besoin.",
      'Ancrage CESTOM',
      "Porté par une communauté déjà organisée sur le terrain — pas une app anonyme de plus.",
    ],
  ];
  let y = 2.15;
  const rowH = 1.55;
  rows.forEach(([probH, probBody, solH, solBody]) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: MARGIN, y, w: (W - MARGIN * 2 - 0.5) / 2, h: rowH, rectRadius: 0.07,
      fill: { color: COLOR.bgElevated }, line: { color: COLOR.red, width: 1 },
    });
    iconDot(s, MARGIN + (W - MARGIN * 2 - 0.5) / 2 - 0.5, y + 0.14, 0.32, COLOR.red, '!');
    s.addText(probH, {
      x: MARGIN + 0.25, y: y + 0.12, w: (W - MARGIN * 2 - 0.5) / 2 - 0.5, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, color: COLOR.red,
    });
    s.addText(probBody, {
      x: MARGIN + 0.25, y: y + 0.52, w: (W - MARGIN * 2 - 0.5) / 2 - 0.5, h: rowH - 0.6,
      fontFace: FONT_BODY, fontSize: 10.5, color: COLOR.inkMuted, valign: 'top',
    });
    const x2 = MARGIN + (W - MARGIN * 2 - 0.5) / 2 + 0.5;
    s.addShape(pptx.ShapeType.roundRect, {
      x: x2, y, w: (W - MARGIN * 2 - 0.5) / 2, h: rowH, rectRadius: 0.07,
      fill: { color: COLOR.bgElevated }, line: { color: COLOR.green, width: 1 },
    });
    iconDot(s, x2 + (W - MARGIN * 2 - 0.5) / 2 - 0.5, y + 0.14, 0.32, COLOR.green, '+');
    s.addText(solH, {
      x: x2 + 0.25, y: y + 0.12, w: (W - MARGIN * 2 - 0.5) / 2 - 0.5, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, color: COLOR.green,
    });
    s.addText(solBody, {
      x: x2 + 0.25, y: y + 0.52, w: (W - MARGIN * 2 - 0.5) / 2 - 0.5, h: rowH - 0.6,
      fontFace: FONT_BODY, fontSize: 10.5, color: COLOR.inkMuted, valign: 'top',
    });
    y += rowH + 0.2;
  });
  footer(s, '02 · Problème → Solution');
}

// ---------- 3. Modele economique & marche ----------
{
  const s = baseSlide();
  titleBlock(s, "Modèle économique : l'impact d'abord, prouvé dès le jour 1", "Pas de bénévolat — un flux monétaire construit dès la version présentée au concours");
  const phases = [
    ['Phase 1 — Maintenant', 'Sponsoring vérifié', "Un acteur qui veut un privilège (Pin mis en avant) fait un virement réel vers un compte CESTOM dédié, soumet une preuve dans l'app, un vérificateur valide. 0 % prélevé par une passerelle de paiement tierce — tout reste dans le circuit CESTOM.", COLOR.gold],
    ['Phase 2 — Après traction', 'Commission sur services rendus', "Une fois la confiance et l'usage établis via la Phase 1, commission sur les mises en relation payantes entre étudiants.", COLOR.cyan],
    ['Phase 3 — Vision', 'Licence à d\'autres diasporas', "Architecture (carte, réputation, sponsoring vérifié, modération spatiale) transposable à toute communauté étudiante structurée autour d'une association reconnue.", COLOR.green],
  ];
  const colW = (W - MARGIN * 2 - 0.6) / 3;
  phases.forEach(([tag, h, body, color], i) => {
    const x = MARGIN + i * (colW + 0.3);
    s.addShape(pptx.ShapeType.rect, { x, y: 2.15, w: colW, h: 0.06, fill: { color } });
    iconDot(s, x + colW - 0.36, 2.28, 0.3, color, String(i + 1));
    s.addText(tag, {
      x, y: 2.3, w: colW - 0.4, h: 0.3, fontFace: FONT_BODY, fontSize: 10, color,
    });
    s.addText(h, {
      x, y: 2.6, w: colW, h: 0.65, fontFace: FONT_HEAD, fontSize: 14, bold: true, color: COLOR.ink, valign: 'top',
    });
    s.addText(body, {
      x, y: 3.3, w: colW, h: 1.7, fontFace: FONT_BODY, fontSize: 10.5, color: COLOR.inkMuted, valign: 'top', lineSpacingMultiple: 1.2,
    });
  });

  // Mini-carte reelle des 6 villes CESTOM (remplace l'encart texte plat "chiffres a confirmer" -
  // on a maintenant un vrai SAM chiffre, voir docs/BUSINESS_PLAN.md). Positions x/y projetees dans
  // la zone de carte par interpolation lineaire independante sur chaque axe (deformation mineure
  // acceptable pour un mini-schema, pas une carte de precision - meme logique que le SVG produit).
  const mapBoxX = MARGIN, mapBoxY = 5.35, mapBoxW = 3.9, mapBoxH = 1.55;
  s.addShape(pptx.ShapeType.roundRect, {
    x: mapBoxX, y: mapBoxY, w: mapBoxW, h: mapBoxH, rectRadius: 0.08,
    fill: { color: COLOR.bgCard }, line: { color: COLOR.line, width: 1 },
  });
  const xs = CITY_POINTS.map((c) => c.x), ys = CITY_POINTS.map((c) => c.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padIn = 0.55;
  const plotX0 = mapBoxX + padIn, plotX1 = mapBoxX + mapBoxW - padIn - 0.35;
  const plotY0 = mapBoxY + 0.32, plotY1 = mapBoxY + mapBoxH - 0.32;
  const maxMembers = Math.max(...CITY_POINTS.map((c) => c.members));
  const minMembers = Math.min(...CITY_POINTS.map((c) => c.members));
  CITY_POINTS.forEach((c) => {
    const px = plotX0 + ((c.x - minX) / (maxX - minX)) * (plotX1 - plotX0);
    const py = plotY0 + ((c.y - minY) / (maxY - minY)) * (plotY1 - plotY0);
    // Rayon proportionnel a sqrt(membres) - meme logique que MoroccoMap.tsx (evite d'ecraser
    // visuellement les petites villes face a Rabat/Casablanca).
    const t = (Math.sqrt(c.members) - Math.sqrt(minMembers)) / (Math.sqrt(maxMembers) - Math.sqrt(minMembers));
    const r = 0.055 + t * 0.075;
    s.addShape(pptx.ShapeType.ellipse, {
      x: px - r, y: py - r, w: r * 2, h: r * 2,
      fill: { color: COLOR.gold }, line: { color: COLOR.bg, width: 0.75 },
    });
    s.addText(c.name, {
      x: px - 0.55, y: py + r + 0.02, w: 1.1, h: 0.16, align: 'center',
      fontFace: FONT_BODY, fontSize: 6.5, color: COLOR.inkMuted,
    });
  });
  s.addText([
    { text: String(CITY_TOTAL), options: { bold: true, fontSize: 26, color: COLOR.gold, breakLine: true } },
    { text: 'membres CESTOM, 6 villes', options: { fontSize: 11, color: COLOR.ink, breakLine: true } },
    { text: 'Source : cestom.org', options: { fontSize: 9, color: COLOR.inkMuted } },
  ], {
    x: mapBoxX + mapBoxW + 0.3, y: mapBoxY, w: W - MARGIN - (mapBoxX + mapBoxW + 0.3), h: mapBoxH,
    valign: 'middle', fontFace: FONT_HEAD, lineSpacingMultiple: 1.15,
  });
  footer(s, '03 · Business model & marché');
}

// ---------- 4. Traction & demande ----------
{
  const s = baseSlide();
  edgeAccent(s, COLOR.gold);
  titleBlock(s, "Ce qui est réel aujourd'hui, et ce qu'on demande");
  const real = [
    'Carte, demandes d\'aide, authentification, gouvernance à 2 niveaux — code fonctionnel, testé (32/32 tests automatisés)',
    '3 directions visuelles explorées et maquettées — direction retenue le 2026-08-31',
    'Sponsoring vérifié + notation en cours de développement, ciblés pour ce concours',
    'Hébergement 100 % gratuit (aucune carte bancaire engagée) — marge protégée dès le 1er sponsor',
  ];
  s.addText(real.map((t) => ({ text: t, options: { bullet: { code: '25B8' }, color: COLOR.ink, breakLine: true } })), {
    x: MARGIN, y: 2.2, w: W - MARGIN * 2, h: 2.3,
    fontFace: FONT_BODY, fontSize: 14, valign: 'top', lineSpacingMultiple: 1.5,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN, y: 4.7, w: W - MARGIN * 2, h: 1.5, rectRadius: 0.1,
    fill: { color: COLOR.bgElevated }, line: { color: COLOR.gold, width: 1.5 },
  });
  s.addText([
    { text: 'Ce qu\'on demande : ', options: { bold: true, color: COLOR.gold } },
    { text: '[À compléter avec le porteur de projet — modalités exactes du concours CréaAfrica non connues : financement, mentorat, mise en réseau]', options: { italic: true, color: COLOR.inkMuted } },
  ], {
    x: MARGIN + 0.35, y: 4.7, w: W - MARGIN * 2 - 0.7, h: 1.5, valign: 'middle',
    fontFace: FONT_BODY, fontSize: 13, lineSpacingMultiple: 1.3,
  });
  s.addText('Wilfried TSETSE · CESTOM · tsetsewilfried@gmail.com', {
    x: MARGIN, y: 6.45, w: W - MARGIN * 2, h: 0.35,
    fontFace: FONT_BODY, fontSize: 11, color: COLOR.cyan,
  });
  footer(s, '04 · Traction & demande');
}

const outPath = path.join(__dirname, 'CestomClash228-Pitch.pptx');
await pptx.writeFile({ fileName: outPath });
console.log('Écrit :', outPath);
