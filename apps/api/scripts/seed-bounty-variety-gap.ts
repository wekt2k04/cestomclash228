import 'dotenv/config';
import { DataSource } from 'typeorm';

// Correctif ponctuel (2026-09-11), suite a une demande explicite de verifier que TOUS les types
// de Pins/Bounties sont representes pour la demonstration des 2 prochaines semaines. Repartition
// live constatee avant ce script : les 4 PinType sont deja tous presents, mais sur les 12
// Bounties semees, kind='offer' (un etudiant qui PROPOSE un service, par opposition a
// kind='request') etait totalement absent, ainsi que ServiceCategory.TUTORAT/AUTRE et
// isRemote=true. Ce script (a) ajoute 2 Bounties cote OFFER couvrant ces 4 trous en une seule
// fois, (b) reprolonge l'expiration de TOUTES les Bounties des comptes seed a 15 jours (au lieu
// des 10 jours du correctif precedent) pour couvrir "les 2 semaines a venir, y compris celle-ci"
// sans marge trop juste. Ne touche que les comptes seed-*@cestomclash.local, jamais un vrai
// compte utilisateur - meme filtre que extend-seed-bounty-expiry.ts.
const EXTENSION_INTERVAL = '15 days';

const NEW_OFFERS = [
  {
    authorSlug: 'yawo-kpodar',
    cityName: 'Tanger',
    title: 'Je donne des cours particuliers de maths et physique (lycée/prépa)',
    description:
      "Étudiant en école d'ingénieur, je propose des cours de soutien en maths/physique niveau lycée ou prépa, en présentiel à Tanger. Plusieurs années d'expérience en tutorat informel entre étudiants togolais.",
    priceMad: 50,
    isRemote: false,
    category: 'tutorat',
  },
  {
    authorSlug: 'ama-lawson',
    cityName: 'Oujda',
    title: 'Mise en page et correction de CV / lettre de motivation, à distance',
    description:
      "Je relis, corrige et mets en page ton CV ou ta lettre de motivation (format FR ou anglo-saxon) - travail à distance, retour sous 48h avec des remarques concrètes, pas juste des corrections de fautes.",
    priceMad: 40,
    isRemote: true,
    category: 'autre',
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
      console.log('Aucun compte seed trouvé - rien à faire.');
      return;
    }
    const idBySlug = new Map(
      seedUsers.map((u) => [u.email.replace('seed-', '').replace('@cestomclash.local', ''), u.id]),
    );
    const seedUserIds = seedUsers.map((u) => u.id);

    // 1) Reprolonge l'expiration de tout ce qui existe deja (open ou expired) a 15 jours.
    const extended: unknown[] = await dataSource.query(
      `UPDATE bounties
       SET status = 'open', "expiresAt" = now() + ($2)::interval
       WHERE "authorId" = ANY($1) AND status IN ('open', 'expired')
       RETURNING id`,
      [seedUserIds, EXTENSION_INTERVAL],
    );
    const extendedRows = Array.isArray(extended[0]) ? extended[0] : extended;
    console.log(`${(extendedRows as unknown[]).length} Bounty(ies) existante(s) reprolongee(s) à ${EXTENSION_INTERVAL}.`);

    // 2) Ajoute les 2 Bounties OFFER manquantes pour couvrir kind/category/isRemote.
    const cities: Array<{ id: string; name: string }> = await dataSource.query(
      `SELECT id, name FROM cities`,
    );
    const cityIdByName = new Map(cities.map((c) => [c.name, c.id]));

    for (const offer of NEW_OFFERS) {
      const authorId = idBySlug.get(offer.authorSlug);
      const cityId = cityIdByName.get(offer.cityName);
      if (!authorId || !cityId) {
        console.warn(`  Auteur ou ville introuvable pour "${offer.title}" - ignoré.`);
        continue;
      }
      await dataSource.query(
        `INSERT INTO bounties
           (id, "authorId", title, description, location, "cityId", status, "expiresAt",
            "kind", "priceMad", "isRemote", "category")
         VALUES (uuid_generate_v4(), $1, $2, $3,
                 ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, 'open',
                 now() + ($7)::interval, 'offer', $8, $9, $10)`,
        [
          authorId,
          offer.title,
          offer.description,
          CITY_COORDS[offer.cityName].lng,
          CITY_COORDS[offer.cityName].lat,
          cityId,
          EXTENSION_INTERVAL,
          offer.priceMad,
          offer.isRemote,
          offer.category,
        ],
      );
      console.log(`  Bounty OFFER créée : "${offer.title}" (${offer.cityName})`);
    }

    const after: Array<{ kind: string; category: string | null; count: string }> =
      await dataSource.query(
        `SELECT kind, category, COUNT(*) FROM bounties WHERE "authorId" = ANY($1) AND status = 'open' GROUP BY kind, category`,
        [seedUserIds],
      );
    console.log('Répartition open après correctif :', after);
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
