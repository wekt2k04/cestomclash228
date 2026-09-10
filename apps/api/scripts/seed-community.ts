import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Script ponctuel (demande utilisateur 2026-09-10 : "peupler un peu la base de donnees avec des
// Pins de differentes villes, de vraies noms du pays et des demandes raisonnables pour un
// etudiant qui veut glow-up, devenir responsable, auto-independant et profiter de la vie") -
// jamais importe par l'app, execute une fois via `npx ts-node scripts/seed-community.ts` avec
// DATABASE_URL pointe sur la cible voulue. Connexion autonome (meme pattern que
// src/database/data-source.ts), requetes SQL brutes calquees exactement sur
// BountiesService.create()/PinsService.create() - pas de nouvelle logique metier, juste des
// donnees.
//
// Idempotent pour les comptes (ON CONFLICT (email) DO NOTHING - un re-lancement accidentel ne
// duplique jamais un auteur), volontairement PAS idempotent pour les Pins/Bounties (pas de cle
// naturelle) - script pense pour tourner UNE fois, pas un seed a rejouer a chaque deploiement.
const BCRYPT_ROUNDS = 12;

interface SeedAuthor {
  slug: string;
  displayName: string;
  cityName: string;
}

// Noms togolais reels et varies (Ewe au Sud, Kabye au Nord - pas un seul registre) - pas des
// placeholders generiques.
const AUTHORS: SeedAuthor[] = [
  { slug: 'komlan-agbeko', displayName: 'Komlan Agbeko', cityName: 'Rabat' },
  { slug: 'sena-adjovi', displayName: 'Sena Adjovi', cityName: 'Rabat' },
  { slug: 'akouvi-tossou', displayName: 'Akouvi Tossou', cityName: 'Casablanca' },
  { slug: 'baguilna-tchalim', displayName: 'Baguilna Tchalim', cityName: 'Casablanca' },
  { slug: 'essohanam-kondo', displayName: 'Essohanam Kondo', cityName: 'Marrakech' },
  { slug: 'afi-dogbe', displayName: 'Afi Dogbe', cityName: 'Fès' },
  { slug: 'yawo-kpodar', displayName: 'Yawo Kpodar', cityName: 'Tanger' },
  { slug: 'ama-lawson', displayName: 'Ama Lawson', cityName: 'Oujda' },
];

interface SeedPin {
  authorSlug: string;
  cityName: string;
  type: 'astuce' | 'lieu_sur' | 'piege_administratif' | 'alerte';
  title: string;
  description: string;
}

// Theme explicite : glow-up / autonomie / vie etudiante concrete - pas des demandes vagues.
const PINS: SeedPin[] = [
  {
    authorSlug: 'komlan-agbeko',
    cityName: 'Rabat',
    type: 'astuce',
    title: 'Tarif étudiant à la salle de sport municipale',
    description:
      "50% de réduction avec la carte CESTOM à la salle municipale près de Bab Chellah — de quoi reprendre une vraie routine sport sans se ruiner.",
  },
  {
    authorSlug: 'sena-adjovi',
    cityName: 'Rabat',
    type: 'lieu_sur',
    title: 'Pharmacie de garde qui parle bien français',
    description:
      'Celle près de Bab Lekbir est ouverte 24/7, personnel accueillant, pratique pour un souci de santé en pleine nuit sans stress supplémentaire.',
  },
  {
    authorSlug: 'akouvi-tossou',
    cityName: 'Casablanca',
    type: 'piege_administratif',
    title: "Faux 'agents' près de la préfecture",
    description:
      "Des personnes proposent d'accélérer un titre de séjour contre paiement en dehors du guichet officiel. Ne jamais payer en dehors du guichet — c'est une arnaque connue.",
  },
  {
    authorSlug: 'baguilna-tchalim',
    cityName: 'Casablanca',
    type: 'alerte',
    title: 'Vigilance vols de téléphone le soir',
    description:
      "Plusieurs vols signalés récemment sur l'avenue près du grand marché après la tombée de la nuit. Reste vigilant·e, évite de sortir le téléphone en marchant.",
  },
  {
    authorSlug: 'essohanam-kondo',
    cityName: 'Marrakech',
    type: 'astuce',
    title: 'Ateliers gratuits de prise de parole en public',
    description:
      "Une association locale organise des ateliers gratuits le samedi matin — utile pour gagner en confiance avant un entretien ou une soutenance.",
  },
  {
    authorSlug: 'essohanam-kondo',
    cityName: 'Marrakech',
    type: 'lieu_sur',
    title: "Librairie qui rachète les livres d'occasion",
    description:
      'Bons prix pour revendre tes livres de cours de l’an dernier, et stock correct pour en racheter à petit prix à la rentrée.',
  },
  {
    authorSlug: 'afi-dogbe',
    cityName: 'Fès',
    type: 'astuce',
    title: 'Marché du jeudi, meilleurs prix fruits et légumes',
    description:
      'Près de la médina, nettement moins cher que les petites épiceries du quartier étudiant — de quoi mieux gérer un budget serré.',
  },
  {
    authorSlug: 'afi-dogbe',
    cityName: 'Fès',
    type: 'piege_administratif',
    title: "Photocopies 'légalisées' non officielles",
    description:
      "Certains vendeurs devant les administrations proposent des légalisations qui ne valent rien. Utilise uniquement les guichets agréés, même si c'est plus long.",
  },
  {
    authorSlug: 'yawo-kpodar',
    cityName: 'Tanger',
    type: 'lieu_sur',
    title: 'Centre médical universitaire sans rendez-vous',
    description:
      'Ouvert le matin, prend les étudiant·e·s sans rendez-vous — pratique pour un souci de santé qui ne peut pas attendre.',
  },
  {
    authorSlug: 'yawo-kpodar',
    cityName: 'Tanger',
    type: 'alerte',
    title: "Coupures d'eau annoncées ce mois-ci",
    description:
      "Le quartier près de la fac aura plusieurs coupures programmées — prévois des réserves d'eau à l'avance.",
  },
  {
    authorSlug: 'ama-lawson',
    cityName: 'Oujda',
    type: 'astuce',
    title: 'Réductions restaurants avec la carte CESTOM',
    description:
      'Plusieurs restaurants du centre-ville acceptent la carte étudiante CESTOM pour une réduction — bon moyen de sortir manger sans exploser le budget.',
  },
  {
    authorSlug: 'ama-lawson',
    cityName: 'Oujda',
    type: 'lieu_sur',
    title: 'Cybercafé fiable pour les dossiers administratifs',
    description:
      "Imprimante qui marche vraiment et prix correct — utile pour les dossiers d'inscription ou de bourse à imprimer en urgence.",
  },
];

interface SeedBounty {
  authorSlug: string;
  cityName: string;
  title: string;
  description: string;
  durationHours: 2 | 12 | 24;
  priceMad?: number;
  category?:
    | 'tutorat'
    | 'traduction'
    | 'aide_administrative'
    | 'covoiturage'
    | 'demenagement'
    | 'autre';
}

const BOUNTIES: SeedBounty[] = [
  {
    authorSlug: 'komlan-agbeko',
    cityName: 'Rabat',
    title: 'Coach sport pour reprendre une routine avant la rentrée',
    description:
      "Je veux vraiment reprendre le sport sérieusement avant la rentrée — quelqu'un de motivé pour s'entraîner ensemble 2-3 fois cette semaine ?",
    durationHours: 24,
  },
  {
    authorSlug: 'komlan-agbeko',
    cityName: 'Rabat',
    title: 'Comprendre mon relevé de notes et les rattrapages',
    description:
      "Je ne comprends pas bien les modalités de rattrapage sur mon relevé — quelqu'un qui est déjà passé par là pour m'expliquer 15 minutes ?",
    durationHours: 12,
  },
  {
    authorSlug: 'sena-adjovi',
    cityName: 'Rabat',
    title: 'Ouvrir un compte CIH étudiant — paperasse en arabe',
    description:
      "Je dois ouvrir un compte bancaire étudiant mais les formulaires sont en arabe. Je peux payer pour un accompagnement sérieux à l'agence.",
    durationHours: 12,
    priceMad: 30,
    category: 'aide_administrative',
  },
  {
    authorSlug: 'akouvi-tossou',
    cityName: 'Casablanca',
    title: 'Colocataire sérieux·se pour un appart près de la fac',
    description:
      "Je cherche à m'installer plus près de la fac et gagner en autonomie — recherche quelqu'un de sérieux pour partager un appart 2 chambres.",
    durationHours: 24,
  },
  {
    authorSlug: 'baguilna-tchalim',
    cityName: 'Casablanca',
    title: 'Traducteur FR-AR pour un rendez-vous à la préfecture',
    description:
      "Rendez-vous administratif important cette semaine, je ne suis pas à l'aise en arabe. Je peux payer pour quelqu'un qui m'accompagne et traduit.",
    durationHours: 12,
    priceMad: 50,
    category: 'traduction',
  },
  {
    authorSlug: 'essohanam-kondo',
    cityName: 'Marrakech',
    title: 'Relecture CV + lettre de motivation pour un stage',
    description:
      "Je postule à mon premier stage et je veux vraiment avancer sur ce plan de carrière — quelqu'un pour relire et améliorer mon CV/lettre ?",
    durationHours: 24,
  },
  {
    authorSlug: 'essohanam-kondo',
    cityName: 'Marrakech',
    title: "Trajet aéroport dimanche matin, j'offre l'essence + un peu",
    description:
      "Vol tôt dimanche matin, je cherche quelqu'un avec une voiture pour m'emmener à l'aéroport. Je paie l'essence et un petit plus pour le temps.",
    durationHours: 24,
    priceMad: 100,
    category: 'covoiturage',
  },
  {
    authorSlug: 'afi-dogbe',
    cityName: 'Fès',
    title: 'Tuteur pour un rattrapage en compta avant les examens',
    description:
      "J'ai un rattrapage important en comptabilité dans 2 semaines et je galère sur les bases — recherche quelqu'un de patient pour m'aider à combler les lacunes.",
    durationHours: 12,
  },
  {
    authorSlug: 'afi-dogbe',
    cityName: 'Fès',
    title: 'Aide pour déménager quelques cartons ce weekend',
    description:
      "Je change de logement ce weekend et j'ai besoin d'un coup de main pour porter des cartons — rien de très lourd, 1-2h max.",
    durationHours: 24,
    priceMad: 40,
    category: 'demenagement',
  },
  {
    authorSlug: 'yawo-kpodar',
    cityName: 'Tanger',
    title: 'Découvrir un bon spot ce weekend — qui est motivé ?',
    description:
      "Envie de sortir et profiter un peu de la ville, pas juste étudier — qui veut explorer la médina ou un bon spot ce weekend ?",
    durationHours: 24,
  },
  {
    authorSlug: 'ama-lawson',
    cityName: 'Oujda',
    title: 'Apprendre à cuisiner 3 plats simples et pas chers',
    description:
      "Je veux devenir plus autonome au quotidien — quelqu'un pour m'apprendre 3 recettes simples et économiques adaptées à un budget étudiant ?",
    durationHours: 24,
  },
  {
    authorSlug: 'ama-lawson',
    cityName: 'Oujda',
    title: 'Accompagnement pour ma première fois au grand marché',
    description:
      "Je viens d'arriver dans le coin, je découvre encore la ville — quelqu'un pour m'accompagner une fois au marché pour comprendre les prix et les habitudes ?",
    durationHours: 12,
  },
];

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
  });
  await dataSource.initialize();
  console.log('Connecté à la base.');

  try {
    const cityRows: Array<{ id: string; name: string }> = await dataSource.query(
      'SELECT id, name FROM cities',
    );
    const cityIdByName = new Map(cityRows.map((c) => [c.name, c.id]));
    for (const name of new Set([...AUTHORS.map((a) => a.cityName)])) {
      if (!cityIdByName.has(name)) {
        throw new Error(`Ville introuvable en base : "${name}" — as-tu bien lancé les migrations ?`);
      }
    }

    const userIdBySlug = new Map<string, string>();
    for (const author of AUTHORS) {
      const email = `seed-${author.slug}@cestomclash.local`;
      const passwordHash = await bcrypt.hash(
        // Mot de passe aleatoire, jamais communique - ces comptes sont du contenu, pas destines
        // a une vraie connexion (meme raisonnement que le compte "Debug Test" deja present).
        Math.random().toString(36).slice(2) + Date.now().toString(36),
        BCRYPT_ROUNDS,
      );
      const cityId = cityIdByName.get(author.cityName)!;

      const insertResult: unknown = await dataSource.query(
        `INSERT INTO users (id, email, "passwordHash", "displayName", "homeCityId")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [email, passwordHash, author.displayName, cityId],
      );
      // DataSource.query() brut (ce script) NE renvoie PAS le tuple [rows, rowCount] documente
      // pour Repository.query() dans bounties.service.ts::claim() - verifie empiriquement ici
      // (les 8 users du premier lancement local etaient bien crees en base malgre un
      // rows.length lu comme 0) : renvoie directement le tableau de lignes. Gere quand meme les
      // 2 formes plutot que de re-deviner une 2e fois - un simple destructuring aurait a
      // nouveau silencieusement mal lu le resultat.
      const rows: Array<{ id: string }> = Array.isArray(
        (insertResult as unknown[])[0],
      )
        ? (insertResult as [Array<{ id: string }>, number])[0]
        : (insertResult as Array<{ id: string }>);

      let userId: string;
      if (rows.length > 0) {
        userId = rows[0].id;
        console.log(`+ utilisateur créé : ${author.displayName} (${author.cityName})`);
      } else {
        const existing = await dataSource.query<Array<{ id: string }>>(
          'SELECT id FROM users WHERE email = $1',
          [email],
        );
        userId = existing[0].id;
        console.log(`= utilisateur déjà présent : ${author.displayName}`);
      }
      userIdBySlug.set(author.slug, userId);
    }

    for (const pin of PINS) {
      const authorId = userIdBySlug.get(pin.authorSlug)!;
      const cityId = cityIdByName.get(pin.cityName)!;

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

    for (const bounty of BOUNTIES) {
      const authorId = userIdBySlug.get(bounty.authorSlug)!;
      const cityId = cityIdByName.get(bounty.cityName)!;
      await dataSource.query(
        `INSERT INTO bounties
           (id, "authorId", title, description, location, "cityId", status, "expiresAt",
            "kind", "priceMad", "isRemote", "category")
         VALUES (uuid_generate_v4(), $1, $2, $3,
                 ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, 'open',
                 now() + ($7 || ' hours')::interval, 'request', $8, false, $9)`,
        [
          authorId,
          bounty.title,
          bounty.description,
          CITY_COORDS[bounty.cityName].lng,
          CITY_COORDS[bounty.cityName].lat,
          cityId,
          bounty.durationHours,
          bounty.priceMad ?? null,
          bounty.category ?? null,
        ],
      );
      console.log(
        `  Bounty créée : "${bounty.title}" (${bounty.cityName})${bounty.priceMad ? ` — ${bounty.priceMad} MAD` : ''}`,
      );
    }

    console.log(
      `\nTerminé : ${AUTHORS.length} auteurs, ${PINS.length} Pins, ${BOUNTIES.length} Bounties.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

// Memes coordonnees que apps/web/src/lib/morocco-geo.ts / cities.service.ts (SEED_CITIES) -
// dupliquees intentionnellement (meme raison que morocco-geo.ts : petite table statique et
// stable, pas encore necessaire de la partager via un module commun pour ce seul usage).
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
