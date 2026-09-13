import 'dotenv/config';
import { DataSource } from 'typeorm';

// Complement ponctuel (2026-09-13, jour de presentation) - demande explicite : peupler les
// villes PROPORTIONNELLEMENT a leur effectif reel (Rabat 220, Casablanca 180, Marrakech 95,
// Fes 85, Tanger 40, Oujda 30 - source cestom.org, memes chiffres que docs/BUSINESS_PLAN.md)
// avec des besoins "plus vrais, plus humains, plus recurrents, plus evidents mais qui nous
// echappent" - la base semee le 2026-09-10 etait plate (2 Pins + 2 Bounties par ville, aucun
// rapport avec l'effectif reel). Purement ADDITIF sur les auteurs seed-*.local existants -
// aucune nouvelle donnee supprimee ou modifiee. Distribution volontairement plus dense sur
// Rabat/Casablanca (les 2 plus grosses villes), quasi inchangee sur Tanger/Oujda (deja
// proportionnellement en avance avec la base plate precedente).
//
// Accent explicite de ce lot : plusieurs offres (kind=OFFER) qui montrent concretement
// l'avantage de vendre rapidement une competence reelle (coiffure, cuisine, couture,
// reparation...) - "gagnant-gagnant" demande par l'utilisateur - a cote de vraies demandes
// humaines recurrentes (interprete medical, colocation, perte de papiers, don de sang) trop
// souvent noyees dans des groupes WhatsApp non structures, exactement le probleme du pitch.
const EXPIRY_INTERVAL = '15 days'; // meme discipline que le 2026-09-11 : jamais 2h/12h/24h pour du contenu de demo

const NEW_PINS = [
  {
    authorSlug: 'komlan-agbeko',
    cityName: 'Rabat',
    type: 'lieu_sur',
    title: 'Un généraliste consciencieux près de la fac',
    description:
      "Parle français, ne pousse jamais vers des examens inutiles, prix raisonnable. Quartier Agdal. Précieux quand on ne connaît personne à qui demander en arrivant.",
  },
  {
    authorSlug: 'sena-adjovi',
    cityName: 'Rabat',
    type: 'piege_administratif',
    title: "Attention aux \"frais de dossier\" non officiels à la préfecture",
    description:
      "Certains intermédiaires près de la préfecture proposent d'accélérer le renouvellement de la carte de séjour contre de l'argent. C'est un piège — jamais nécessaire, et ça retarde parfois même le dossier au lieu de l'accélérer.",
  },
  {
    authorSlug: 'akouvi-tossou',
    cityName: 'Casablanca',
    type: 'astuce',
    title: 'Tarif étudiant méconnu sur le tram',
    description:
      "Présente ta carte étudiante au guichet de l'agence (pas juste au chauffeur) : un abonnement réduit existe mais n'est jamais annoncé activement, il faut le demander soi-même.",
  },
  {
    authorSlug: 'baguilna-tchalim',
    cityName: 'Casablanca',
    type: 'lieu_sur',
    title: 'Épicerie qui vend des ingrédients ouest-africains',
    description:
      "Piment, gari, feuilles pour sauce — un peu plus cher qu'au pays, mais ça évite de se rabattre sur des substituts fades les semaines où le mal du pays se fait sentir.",
  },
  {
    authorSlug: 'essohanam-kondo',
    cityName: 'Marrakech',
    type: 'alerte',
    title: "Recrudescence de vols à l'arraché près de Jemaa el-Fna le soir",
    description:
      "Plusieurs témoignages récents dans la communauté. Éviter de sortir le téléphone en main en marchant seul·e la nuit dans cette zone précise.",
  },
  {
    authorSlug: 'afi-dogbe',
    cityName: 'Fès',
    type: 'astuce',
    title: 'Ouvrir un compte bancaire étudiant sans galère',
    description:
      "La banque exige une attestation de scolarité ET un justificatif de domicile — apporte les DEUX ensemble dès le premier rendez-vous, sinon on te renvoie une seconde fois pour la pièce manquante.",
  },
] as const;

const NEW_BOUNTIES = [
  {
    authorSlug: 'komlan-agbeko',
    cityName: 'Rabat',
    title: 'Tresses et coiffures africaines à domicile',
    description:
      "Box braids, vanilles, cornrows — je me déplace ou tu viens chez moi, le weekend. Le salon le plus proche qui sait vraiment coiffer nos cheveux est à 40 minutes et facture le double.",
    kind: 'offer',
    priceMad: 80,
    isRemote: false,
    category: 'autre',
  },
  {
    authorSlug: 'sena-adjovi',
    cityName: 'Rabat',
    title: 'Interprète pour un rendez-vous médical (ma mère en visite)',
    description:
      "Ma mère vient me rendre visite et a un rendez-vous médical cette semaine — elle ne parle ni français ni arabe. Besoin de quelqu'un de confiance pour traduire pendant la consultation, discrétion importante.",
    kind: 'request',
    priceMad: 50,
    isRemote: false,
    category: 'traduction',
  },
  {
    authorSlug: 'komlan-agbeko',
    cityName: 'Rabat',
    title: 'Recherche coloc togolais·e sérieux·se pour la rentrée',
    description:
      "Mon bail se termine fin septembre. Je cherche quelqu'un pour partager un F2 propre près de la fac, loyer divisé en deux. Ce genre de recherche traîne chaque année sur WhatsApp sans jamais aboutir vite.",
    kind: 'request',
    priceMad: null,
    isRemote: false,
    category: null,
  },
  {
    authorSlug: 'sena-adjovi',
    cityName: 'Rabat',
    title: "Garde d'enfant ponctuelle, un soir cette semaine",
    description:
      "J'ai un examen de rattrapage et personne pour garder mon petit de 4 ans le temps de réviser à la bibliothèque. Quelques heures, chez moi.",
    kind: 'request',
    priceMad: 35,
    isRemote: false,
    category: 'autre',
  },
  {
    authorSlug: 'akouvi-tossou',
    cityName: 'Casablanca',
    title: 'Plats togolais faits maison (fufu, akpan, sauce arachide)',
    description:
      "Le mal du pays passe souvent par l'assiette. Je cuisine à la demande, à récupérer ou en livraison courte distance — pour les semaines où on n'a vraiment pas envie de faire soi-même la popote après les cours.",
    kind: 'offer',
    priceMad: 60,
    isRemote: false,
    category: 'autre',
  },
  {
    authorSlug: 'baguilna-tchalim',
    cityName: 'Casablanca',
    title: 'Accompagnement pour ma première déclaration CNSS',
    description:
      "Premier stage rémunéré, et je ne comprends rien à la paperasse CNSS. Le service administratif de la fac ne m'aide pas là-dessus. Je cherche quelqu'un qui est déjà passé par là pour m'expliquer les vraies étapes.",
    kind: 'request',
    priceMad: 40,
    isRemote: false,
    category: 'aide_administrative',
  },
  {
    authorSlug: 'akouvi-tossou',
    cityName: 'Casablanca',
    title: 'Coupe de cheveux homme à domicile',
    description:
      "Barbier depuis le lycée — dégradé, contours nets, à la maison le weekend. Moins cher qu'un salon, et sans les deux heures d'attente du samedi.",
    kind: 'offer',
    priceMad: 30,
    isRemote: false,
    category: 'autre',
  },
  {
    authorSlug: 'baguilna-tchalim',
    cityName: 'Casablanca',
    title: 'Carte de séjour perdue — la vraie marche à suivre ?',
    description:
      "J'ai perdu ma carte de séjour cette semaine et je panique un peu sur la procédure exacte côté préfecture. Quelqu'un qui l'a déjà refaite peut m'expliquer les étapes réelles, pas juste ce qui est écrit en ligne ?",
    kind: 'request',
    priceMad: null,
    isRemote: false,
    category: 'aide_administrative',
  },
  {
    authorSlug: 'essohanam-kondo',
    cityName: 'Marrakech',
    title: 'Retouches et couture de tenues traditionnelles',
    description:
      "Ourlets, ajustements, reprises — utile avant un mariage, un baptême ou une soutenance où on veut porter un pagne bien taillé plutôt qu'emprunté à la dernière minute.",
    kind: 'offer',
    priceMad: 45,
    isRemote: false,
    category: 'autre',
  },
  {
    authorSlug: 'essohanam-kondo',
    cityName: 'Marrakech',
    title: 'Covoiturage Marrakech → Casablanca ce weekend',
    description:
      "Je rentre voir des amis à Casa vendredi soir et reviens dimanche. Je cherche 2-3 personnes pour partager l'essence — ce genre de trajet s'organise toujours à la dernière minute sur WhatsApp, jamais à l'avance.",
    kind: 'request',
    priceMad: null,
    isRemote: false,
    category: 'covoiturage',
  },
  {
    authorSlug: 'afi-dogbe',
    cityName: 'Fès',
    title: 'Réparation téléphone et petit dépannage informatique',
    description:
      "Écran cassé, batterie qui ne tient plus, lenteurs — je répare en quelques heures. Moins cher qu'un réparateur en ville, et sans laisser son téléphone trois jours chez un inconnu.",
    kind: 'offer',
    priceMad: 70,
    isRemote: false,
    category: 'autre',
  },
  {
    authorSlug: 'afi-dogbe',
    cityName: 'Fès',
    title: 'Recherche de donneurs compatibles — compatriote hospitalisé',
    description:
      "Un membre de la communauté est hospitalisé et a besoin de donneurs de sang compatibles (groupe O+). Coordination déjà en cours avec l'hôpital — on a juste besoin de plus de monde disponible cette semaine.",
    kind: 'request',
    priceMad: null,
    isRemote: false,
    category: null,
  },
] as const;

async function main() {
  const dataSource = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL });
  await dataSource.initialize();
  console.log('Connecté à la base.');

  try {
    const seedUsers: Array<{ id: string; email: string }> = await dataSource.query(
      `SELECT id, email FROM users WHERE email LIKE $1`,
      ['seed-%@cestomclash.local'],
    );
    if (seedUsers.length === 0) {
      throw new Error('Aucun compte seed trouvé - lancer seed-community.ts en premier.');
    }
    const idBySlug = new Map(
      seedUsers.map((u) => [u.email.replace('seed-', '').replace('@cestomclash.local', ''), u.id]),
    );

    const cities: Array<{ id: string; name: string }> = await dataSource.query(
      `SELECT id, name FROM cities`,
    );
    const cityIdByName = new Map(cities.map((c) => [c.name, c.id]));

    for (const pin of NEW_PINS) {
      const authorId = idBySlug.get(pin.authorSlug);
      const cityId = cityIdByName.get(pin.cityName);
      if (!authorId || !cityId) {
        console.warn(`  Auteur/ville introuvable pour le Pin "${pin.title}" - ignoré.`);
        continue;
      }
      await dataSource.query(
        `INSERT INTO pins (id, "authorId", type, title, description, location, "cityId")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4,
                 ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7)`,
        [
          authorId,
          pin.type,
          pin.title,
          pin.description,
          CITY_COORDS[pin.cityName].lng,
          CITY_COORDS[pin.cityName].lat,
          cityId,
        ],
      );
      console.log(`  Pin créé : "${pin.title}" (${pin.cityName})`);
    }

    for (const bounty of NEW_BOUNTIES) {
      const authorId = idBySlug.get(bounty.authorSlug);
      const cityId = cityIdByName.get(bounty.cityName);
      if (!authorId || !cityId) {
        console.warn(`  Auteur/ville introuvable pour la Bounty "${bounty.title}" - ignorée.`);
        continue;
      }
      await dataSource.query(
        `INSERT INTO bounties
           (id, "authorId", title, description, location, "cityId", status, "expiresAt",
            "kind", "priceMad", "isRemote", "category")
         VALUES (uuid_generate_v4(), $1, $2, $3,
                 ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, 'open',
                 now() + ($7)::interval, $8, $9, $10, $11)`,
        [
          authorId,
          bounty.title,
          bounty.description,
          CITY_COORDS[bounty.cityName].lng,
          CITY_COORDS[bounty.cityName].lat,
          cityId,
          EXPIRY_INTERVAL,
          bounty.kind,
          bounty.priceMad,
          bounty.isRemote,
          bounty.category,
        ],
      );
      console.log(`  Bounty créée : "${bounty.title}" (${bounty.cityName}, ${bounty.kind})`);
    }

    const distribution: Array<{ cityname: string; pins: string; bounties: string }> =
      await dataSource.query(`
        SELECT c.name AS cityname,
               COUNT(DISTINCT p.id) AS pins,
               COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'open') AS bounties
        FROM cities c
        LEFT JOIN pins p ON p."cityId" = c.id
        LEFT JOIN bounties b ON b."cityId" = c.id
        GROUP BY c.name
        ORDER BY (COUNT(DISTINCT p.id) + COUNT(DISTINCT b.id)) DESC
      `);
    console.log('\nRépartition finale par ville (Pins / Bounties ouvertes) :');
    distribution.forEach((d) => console.log(`  ${d.cityname} : ${d.pins} Pins, ${d.bounties} Bounties`));
  } finally {
    await dataSource.destroy();
  }
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Rabat: { lat: 34.0209, lng: -6.8416 },
  Casablanca: { lat: 33.5731, lng: -7.5898 },
  Marrakech: { lat: 31.6295, lng: -7.9811 },
  Fès: { lat: 34.0331, lng: -5.0003 },
  Tanger: { lat: 35.7595, lng: -5.834 },
  Oujda: { lat: 34.6867, lng: -1.9114 },
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
