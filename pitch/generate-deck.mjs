// Génère pitch/MindClash228-Pitch.pptx à partir du contenu de docs/LEAN_CANVAS.md et
// docs/VISION.md. Ré-exécutable : `node generate-deck.mjs` régénère le fichier en place.
// A remplacer/completer quand une vraie capture d'ecran du noyau MVP existe (slide "Demo").
import PptxGenJS from 'pptxgenjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'brand', 'CESTOM.png');

// Palette approximee en hex depuis les tokens oklch de l'identite visuelle
// publiee (voir docs/LEAN_CANVAS.md / l'artifact d'identite dans NEXT_SESSION.md).
// PowerPoint n'a pas de fonts Google embarquees par defaut -> polices systeme
// Windows (Bahnschrift/Segoe UI) qui evoquent le meme registre technique/tactique
// sans risque de substitution silencieuse chez le jury.
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

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'MC228', width: 13.333, height: 7.5 });
pptx.layout = 'MC228';
pptx.author = 'CESTOM';
pptx.title = 'MindClash 228';

const W = 13.333;
const H = 7.5;
const MARGIN = 0.7;

function baseSlide() {
  const s = pptx.addSlide();
  s.background = { color: COLOR.bg };
  return s;
}

function footer(s, pageLabel) {
  s.addText('MINDCLASH 228', {
    x: MARGIN,
    y: H - 0.5,
    w: 4,
    h: 0.3,
    fontFace: FONT_HEAD,
    fontSize: 10,
    color: COLOR.inkMuted,
    bold: true,
    charSpacing: 2,
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

function titleBlock(s, title, subtitle) {
  accentBar(s, 0.62);
  s.addText(title, {
    x: MARGIN,
    y: 0.75,
    w: W - MARGIN * 2,
    h: 0.9,
    fontFace: FONT_HEAD,
    fontSize: 32,
    bold: true,
    color: COLOR.ink,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: MARGIN,
      y: 1.5,
      w: W - MARGIN * 2,
      h: 0.5,
      fontFace: FONT_BODY,
      fontSize: 15,
      color: COLOR.inkMuted,
    });
  }
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
    { text: 'MINDCLASH ', options: { color: COLOR.ink } },
    { text: '228', options: { color: COLOR.gold } },
  ], {
    x: 0,
    y: 2.5,
    w: W,
    h: 1.3,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 60,
    bold: true,
    charSpacing: 1,
  });
  s.addText('Explore. Partage. Level-up.', {
    x: 0,
    y: 3.75,
    w: W,
    h: 0.6,
    align: 'center',
    fontFace: FONT_BODY,
    fontSize: 20,
    color: COLOR.cyan,
  });
  s.addText(
    "Le premier moteur de survie géolocalisé pour la diaspora étudiante togolaise au Maroc",
    {
      x: W / 2 - 4,
      y: 4.35,
      w: 8,
      h: 0.5,
      align: 'center',
      fontFace: FONT_BODY,
      fontSize: 13,
      color: COLOR.inkMuted,
    },
  );
  s.addImage({ path: LOGO_PATH, x: W / 2 - 0.35, y: 5.4, w: 0.7, h: 0.7 });
  s.addText('Concours CréaAfrica 2026 · Propulsé par CESTOM', {
    x: 0,
    y: 6.15,
    w: W,
    h: 0.4,
    align: 'center',
    fontFace: FONT_BODY,
    fontSize: 12,
    color: COLOR.inkMuted,
  });
}

// ---------- 2. Le probleme ----------
{
  const s = baseSlide();
  titleBlock(s, "L'expatriation étudiante, une épreuve de survie individuelle");
  const items = [
    [
      'Isolement & choc culturel',
      "Codes locaux manquants dès l'arrivée : climat, bureaucratie des préfectures, attentes académiques marocaines. Point de départ documenté d'échecs précoces.",
    ],
    [
      "Information fragmentée",
      "WhatsApp chaotique et non indexable, TikTok qui détourne l'attention, plateformes institutionnelles trop froides pour l'urgence du quotidien.",
    ],
    [
      'Toxicité en meute',
      "Cyberharcèlement, bizutage numérique, signalements abusifs coordonnés par des groupes locaux restreints.",
    ],
  ];
  const colW = (W - MARGIN * 2 - 0.6) / 3;
  items.forEach(([h, body], i) => {
    const x = MARGIN + i * (colW + 0.3);
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.3,
      w: colW,
      h: 2.6,
      rectRadius: 0.08,
      fill: { color: COLOR.bgElevated },
      line: { color: COLOR.line, width: 1 },
    });
    s.addText(h, {
      x: x + 0.25,
      y: 2.5,
      w: colW - 0.5,
      h: 0.7,
      fontFace: FONT_HEAD,
      fontSize: 16,
      bold: true,
      color: COLOR.gold,
    });
    s.addText(body, {
      x: x + 0.25,
      y: 3.2,
      w: colW - 0.5,
      h: 1.6,
      fontFace: FONT_BODY,
      fontSize: 12,
      color: COLOR.inkMuted,
      valign: 'top',
    });
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN,
    y: 5.3,
    w: W - MARGIN * 2,
    h: 1.1,
    rectRadius: 0.08,
    fill: { color: COLOR.bgCard },
    line: { color: COLOR.red, width: 1 },
  });
  s.addText(
    '"Je suis coincé à la gare de Casa-Voyageurs à 23h, qui peut m\'héberger ?"',
    {
      x: MARGIN + 0.3,
      y: 5.3,
      w: W - MARGIN * 2 - 0.6,
      h: 1.1,
      valign: 'middle',
      fontFace: FONT_BODY,
      italic: true,
      fontSize: 15,
      color: COLOR.ink,
    },
  );
  footer(s, '02 · Problème');
}

// ---------- 3. Segments ----------
{
  const s = baseSlide();
  titleBlock(s, 'Un écosystème, pas une masse floue');
  const items = [
    ['Freshmen', 'Nouveaux arrivants, désorientés. Émetteurs de Bounties. Besoin : réassurance et intégration rapide.', COLOR.cyan],
    ['Vétérans', "Fin de cycle, cherchent réputation et legacy avant le marché du travail.", COLOR.gold],
    ['Majorité silencieuse (~70%)', "Timides, syndrome de l'imposteur — la cible du Ghost Mode.", COLOR.green],
    ['Gouvernance CESTOM', 'Bureau Exécutif central (9 rôles) + bureaux locaux (SG/délégués) à géométrie variable.', COLOR.red],
  ];
  const colW = (W - MARGIN * 2 - 0.9) / 4;
  items.forEach(([h, body, color], i) => {
    const x = MARGIN + i * (colW + 0.3);
    s.addShape(pptx.ShapeType.rect, { x, y: 2.3, w: colW, h: 0.08, fill: { color } });
    s.addText(h, {
      x,
      y: 2.5,
      w: colW,
      h: 0.9,
      fontFace: FONT_HEAD,
      fontSize: 15,
      bold: true,
      color: COLOR.ink,
      valign: 'top',
    });
    s.addText(body, {
      x,
      y: 3.35,
      w: colW,
      h: 2.6,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLOR.inkMuted,
      valign: 'top',
    });
  });
  footer(s, '03 · Segments');
}

// ---------- 4. Solution ----------
{
  const s = baseSlide();
  titleBlock(s, "L'Anti-Feed : l'intégration devient une quête, pas un doomscroll");
  const items = [
    ['Social-Map', "Carte sombre et stylisée qui remplace le newsfeed. L'info n'existe que là où elle a été créée."],
    ['Bounties', "Entraide chronométrée (2h/12h/24h) — urgence qui force l'action et nettoie la carte."],
    ['Reality-Vlogs', 'Micro-contenus terrain (15-60s), format qui force la concision.'],
    ['Ghost Mode', "Anonymat réversible : purgatoire d'upvotes avant de lever le voile et encaisser sa réputation."],
    ['Modération anti-clan', 'Quarantaine seulement si plus de 6 signalements viennent de 6 villes distinctes — le raid en meute devient mathématiquement impossible.'],
    ['RBAC spatial', 'Pouvoirs calqués sur la vraie gouvernance CESTOM. Le pouvoir national est volontairement limité — aucune action destructrice unilatérale.'],
  ];
  const colW = (W - MARGIN * 2 - 0.6) / 3;
  const rowH = 1.75;
  items.forEach(([h, body], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = MARGIN + col * (colW + 0.3);
    const y = 2.25 + row * (rowH + 0.25);
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: colW,
      h: rowH,
      rectRadius: 0.08,
      fill: { color: COLOR.bgElevated },
      line: { color: COLOR.line, width: 1 },
    });
    s.addText(h, {
      x: x + 0.2,
      y: y + 0.12,
      w: colW - 0.4,
      h: 0.4,
      fontFace: FONT_HEAD,
      fontSize: 13,
      bold: true,
      color: COLOR.cyan,
    });
    s.addText(body, {
      x: x + 0.2,
      y: y + 0.55,
      w: colW - 0.4,
      h: rowH - 0.65,
      fontFace: FONT_BODY,
      fontSize: 10.5,
      color: COLOR.inkMuted,
      valign: 'top',
    });
  });
  footer(s, '04 · Solution');
}

// ---------- 5. Demo (placeholder honnete) ----------
{
  const s = baseSlide();
  titleBlock(s, 'Ce qui est déjà réel');
  s.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN,
    y: 2.3,
    w: W - MARGIN * 2,
    h: 3.6,
    rectRadius: 0.1,
    fill: { color: COLOR.bgElevated },
    line: { color: COLOR.cyan, width: 1, dashType: 'dash' },
  });
  s.addText('[ Capture d\'écran réelle du noyau MVP — à intégrer ici ]', {
    x: MARGIN + 0.4,
    y: 2.55,
    w: W - MARGIN * 2 - 0.8,
    h: 0.5,
    fontFace: FONT_BODY,
    italic: true,
    fontSize: 13,
    color: COLOR.inkMuted,
  });
  const real = [
    'Social-Map (PostGIS, MapLibre GL JS, clustering)',
    'Bounties : créer / réclamer / résoudre / expirer',
    'Auth email + mot de passe + Google OAuth, JWT',
    'RBAC à 2 niveaux (national / local), pouvoir national limité',
  ];
  s.addText(real.map((t) => ({ text: t, options: { bullet: { code: '25B8' }, color: COLOR.ink, breakLine: true } })), {
    x: MARGIN + 0.4,
    y: 3.2,
    w: W - MARGIN * 2 - 0.8,
    h: 2.5,
    fontFace: FONT_BODY,
    fontSize: 15,
    valign: 'top',
    lineSpacingMultiple: 1.6,
  });
  footer(s, '05 · Démo');
}

// ---------- 6. Avantage deloyal ----------
{
  const s = baseSlide();
  titleBlock(s, 'Pourquoi ça ne se copie pas');
  const items = [
    ['Alignement institutionnel', "Codé autour des statuts et mandats réels de CESTOM — légitimité culturelle, politique et institutionnelle dès le jour 1. Pas de budget marketing à dépenser pour gagner la confiance.", COLOR.gold],
    ['Effet réseau spatial (PostGIS)', 'Chaque Pin (astuce, lieu sûr, piège administratif) rend la carte plus précieuse. Un concurrent naît avec une carte vide — le problème du Cold Start verrouille le marché.', COLOR.cyan],
  ];
  const colW = (W - MARGIN * 2 - 0.4) / 2;
  items.forEach(([h, body, color], i) => {
    const x = MARGIN + i * (colW + 0.4);
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.4,
      w: colW,
      h: 3.4,
      rectRadius: 0.1,
      fill: { color: COLOR.bgElevated },
      line: { color, width: 1.5 },
    });
    s.addText(h, {
      x: x + 0.35,
      y: 2.75,
      w: colW - 0.7,
      h: 0.8,
      fontFace: FONT_HEAD,
      fontSize: 18,
      bold: true,
      color,
    });
    s.addText(body, {
      x: x + 0.35,
      y: 3.55,
      w: colW - 0.7,
      h: 2,
      fontFace: FONT_BODY,
      fontSize: 13,
      color: COLOR.inkMuted,
      valign: 'top',
      lineSpacingMultiple: 1.3,
    });
  });
  footer(s, '06 · Avantage déloyal');
}

// ---------- 7. Business model ----------
{
  const s = baseSlide();
  titleBlock(s, "L'impact d'abord, le revenu ensuite");
  const rows = [
    ['Impact social', 'ROI primaire pour CréaAfrica', 'Détresse psychologique en baisse, réussite académique en hausse, insertion professionnelle via le réseau de mentors (Vétérans).', COLOR.green],
    ['Sponsoring local', 'Monétisation B2C', 'Pins Sponsors dorés géociblés (opérateurs télécoms, banques, agences immobilières) au moment exact où l\'étudiant en a besoin.', COLOR.gold],
    ['Pivot B2B SaaS', 'Évolutivité commerciale', "Une fois éprouvé sur la communauté togolaise, l'architecture (modération spatiale, RBAC, Ghost Mode) devient une marque blanche pour d'autres diasporas.", COLOR.cyan],
  ];
  let y = 2.3;
  rows.forEach(([h, tag, body, color]) => {
    s.addShape(pptx.ShapeType.rect, { x: MARGIN, y: y + 0.05, w: 0.06, h: 1.2, fill: { color } });
    s.addText(h, {
      x: MARGIN + 0.3,
      y,
      w: 3.2,
      h: 0.4,
      fontFace: FONT_HEAD,
      fontSize: 15,
      bold: true,
      color: COLOR.ink,
    });
    s.addText(tag, {
      x: MARGIN + 0.3,
      y: y + 0.4,
      w: 3.2,
      h: 0.4,
      fontFace: FONT_BODY,
      fontSize: 10.5,
      color,
    });
    s.addText(body, {
      x: MARGIN + 3.7,
      y,
      w: W - MARGIN * 2 - 3.7,
      h: 1.2,
      fontFace: FONT_BODY,
      fontSize: 12.5,
      color: COLOR.inkMuted,
      valign: 'top',
    });
    y += 1.5;
  });
  footer(s, '07 · Business model');
}

// ---------- 8. Traction visee ----------
{
  const s = baseSlide();
  titleBlock(s, 'On mesure la dépendance saine, pas les téléchargements');
  const stats = [
    ['> 30%', 'DAU / MAU'],
    ['J1 · J7 · J30', 'Rétention'],
    ['Conso → création', 'Ratio spectateurs / créateurs'],
    ['Ghost → Public', "Taux de conversion (indicateur d'inclusion)"],
    ['Time-to-Resolve', 'Vélocité de la solidarité sur les Bounties'],
  ];
  const colW = (W - MARGIN * 2 - 0.4 * 4) / 5;
  stats.forEach(([big, label], i) => {
    const x = MARGIN + i * (colW + 0.4);
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.8,
      w: colW,
      h: 2.2,
      rectRadius: 0.08,
      fill: { color: COLOR.bgElevated },
      line: { color: COLOR.line, width: 1 },
    });
    s.addText(big, {
      x: x + 0.15,
      y: 3.0,
      w: colW - 0.3,
      h: 1.1,
      align: 'center',
      fontFace: FONT_HEAD,
      fontSize: 18,
      bold: true,
      color: COLOR.gold,
      valign: 'bottom',
    });
    s.addText(label, {
      x: x + 0.15,
      y: 4.15,
      w: colW - 0.3,
      h: 0.75,
      align: 'center',
      fontFace: FONT_BODY,
      fontSize: 10.5,
      color: COLOR.inkMuted,
      valign: 'top',
    });
  });
  footer(s, '08 · Traction visée');
}

// ---------- 9. Stack & couts ----------
{
  const s = baseSlide();
  titleBlock(s, "Scale-to-zero : conçu pour l'économie frugale africaine");
  const items = [
    ['Frontend', 'Next.js sur Vercel — gratuit au démarrage, edge caching mondial'],
    ['Backend', 'NestJS sur Railway/Render — serverless, ~10-20$/mois'],
    ['Données', 'PostgreSQL + PostGIS, Redis (Upstash) — free tier jusqu\'à 1000-2000 DAU'],
    ['Vidéo', 'Cloudflare R2 — pas de frais de bande passante sortante'],
  ];
  const colW = (W - MARGIN * 2 - 0.9) / 4;
  items.forEach(([h, body], i) => {
    const x = MARGIN + i * (colW + 0.3);
    s.addText(h, {
      x,
      y: 2.4,
      w: colW,
      h: 0.5,
      fontFace: FONT_HEAD,
      fontSize: 15,
      bold: true,
      color: COLOR.cyan,
    });
    s.addText(body, {
      x,
      y: 2.95,
      w: colW,
      h: 2,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLOR.inkMuted,
      valign: 'top',
    });
  });
  s.addText('0 $ d\'infrastructure quand personne n\'utilise l\'app à 4h du matin.', {
    x: MARGIN,
    y: 5.6,
    w: W - MARGIN * 2,
    h: 0.6,
    fontFace: FONT_HEAD,
    fontSize: 16,
    bold: true,
    color: COLOR.green,
  });
  footer(s, '09 · Stack & coûts');
}

// ---------- 10. Roadmap ----------
{
  const s = baseSlide();
  titleBlock(s, 'Du noyau MVP à la plateforme complète');
  const steps = [
    ['Maintenant', 'Social-Map + Bounties + Auth + RBAC 2 niveaux', COLOR.cyan],
    ['Ensuite', 'Ghost Mode, Reality-Vlogs, modération anti-brigading complète', COLOR.gold],
    ['Puis', 'Sponsoring, pont WhatsApp de viralité, RBAC 9 rôles', COLOR.green],
    ['Vision', 'Pivot B2B SaaS multi-diaspora (marque blanche)', COLOR.red],
  ];
  const colW = (W - MARGIN * 2 - 0.9) / 4;
  steps.forEach(([h, body, color], i) => {
    const x = MARGIN + i * (colW + 0.3);
    s.addShape(pptx.ShapeType.ellipse, { x, y: 2.4, w: 0.22, h: 0.22, fill: { color } });
    if (i < steps.length - 1) {
      s.addShape(pptx.ShapeType.rect, {
        x: x + 0.22,
        y: 2.49,
        w: colW + 0.3 - 0.22,
        h: 0.03,
        fill: { color: COLOR.line },
      });
    }
    s.addText(h, {
      x,
      y: 2.75,
      w: colW,
      h: 0.4,
      fontFace: FONT_HEAD,
      fontSize: 14,
      bold: true,
      color,
    });
    s.addText(body, {
      x,
      y: 3.2,
      w: colW,
      h: 2,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLOR.inkMuted,
      valign: 'top',
    });
  });
  footer(s, '10 · Roadmap');
}

// ---------- 11. Closing ----------
{
  const s = baseSlide();
  s.addText([
    { text: 'MINDCLASH ', options: { color: COLOR.ink } },
    { text: '228', options: { color: COLOR.gold } },
  ], {
    x: 0,
    y: 2.2,
    w: W,
    h: 1,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 44,
    bold: true,
  });
  s.addText('[ À compléter avec le porteur de projet : ce qui est demandé au jury / à CréaAfrica ]', {
    x: W / 2 - 4.5,
    y: 3.3,
    w: 9,
    h: 0.6,
    align: 'center',
    fontFace: FONT_BODY,
    italic: true,
    fontSize: 13,
    color: COLOR.inkMuted,
  });
  s.addText('Wilfried TSETSE · CESTOM', {
    x: 0,
    y: 4.6,
    w: W,
    h: 0.4,
    align: 'center',
    fontFace: FONT_BODY,
    fontSize: 14,
    color: COLOR.ink,
  });
  s.addText('tsetsewilfried@gmail.com', {
    x: 0,
    y: 5.0,
    w: W,
    h: 0.4,
    align: 'center',
    fontFace: FONT_BODY,
    fontSize: 12,
    color: COLOR.cyan,
  });
  s.addImage({ path: LOGO_PATH, x: W / 2 - 0.35, y: 5.7, w: 0.7, h: 0.7 });
}

const outPath = path.join(__dirname, 'MindClash228-Pitch.pptx');
await pptx.writeFile({ fileName: outPath });
console.log('Écrit :', outPath);
