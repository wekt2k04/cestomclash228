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
    s.addText(tag, {
      x, y: 2.3, w: colW, h: 0.3, fontFace: FONT_BODY, fontSize: 10, color,
    });
    s.addText(h, {
      x, y: 2.6, w: colW, h: 0.65, fontFace: FONT_HEAD, fontSize: 14, bold: true, color: COLOR.ink, valign: 'top',
    });
    s.addText(body, {
      x, y: 3.3, w: colW, h: 1.8, fontFace: FONT_BODY, fontSize: 10.5, color: COLOR.inkMuted, valign: 'top', lineSpacingMultiple: 1.2,
    });
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN, y: 5.5, w: W - MARGIN * 2, h: 1.15, rectRadius: 0.08,
    fill: { color: COLOR.bgCard }, line: { color: COLOR.line, width: 1 },
  });
  s.addText([
    { text: 'Marché ciblé : ', options: { bold: true, color: COLOR.ink } },
    { text: 'communauté étudiante togolaise au Maroc, structurée autour de la CESTOM. [Chiffres à confirmer avant dépôt final — voir docs/BUSINESS_PLAN.md]', options: { color: COLOR.inkMuted } },
  ], {
    x: MARGIN + 0.3, y: 5.5, w: W - MARGIN * 2 - 0.6, h: 1.15, valign: 'middle',
    fontFace: FONT_BODY, fontSize: 12.5, lineSpacingMultiple: 1.3,
  });
  footer(s, '03 · Business model & marché');
}

// ---------- 4. Traction & demande ----------
{
  const s = baseSlide();
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
