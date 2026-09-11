import 'dotenv/config';
import { DataSource } from 'typeorm';

// Correctif ponctuel (2026-09-11) : seed-community.ts avait donne aux Bounties semees une duree
// de vie de 12-24h (pensee pour un test immediat), beaucoup trop courte pour tenir jusqu'a la
// presentation jury du dimanche 13 septembre 2026 - la moitie avait deja expire (donc disparu de
// tous les onglets de l'interface, aucun ne les affiche) et le reste expirait dans les heures
// suivantes. Ne touche QUE les comptes seed-*@cestomclash.local (meme filtre que
// cleanup-test-accounts.ts), jamais un vrai compte utilisateur - verifie au prealable que la
// seule Bounty non-open portant sur un compte seed n'existe pas (elle appartient a un vrai
// compte "Test"/"Willy", confirme via l'API avant d'ecrire ce script).
const SEED_EMAIL_PATTERN = 'seed-%@cestomclash.local';
const EXTENSION_INTERVAL = '10 days';

async function main() {
  const dataSource = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL });
  await dataSource.initialize();
  console.log('Connecté à la base.');

  try {
    const seedUsers: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM users WHERE email LIKE $1`,
      [SEED_EMAIL_PATTERN],
    );
    if (seedUsers.length === 0) {
      console.log('Aucun compte seed trouvé - rien à faire.');
      return;
    }
    const seedUserIds = seedUsers.map((u) => u.id);

    const before: Array<{ status: string; count: string }> = await dataSource.query(
      `SELECT status, COUNT(*) FROM bounties WHERE "authorId" = ANY($1) GROUP BY status`,
      [seedUserIds],
    );
    console.log('Avant :', before);

    const updated: Array<{ id: string; title: string }> = await dataSource.query(
      `UPDATE bounties
       SET status = 'open', "expiresAt" = now() + ($2)::interval
       WHERE "authorId" = ANY($1) AND status IN ('open', 'expired')
       RETURNING id, title`,
      [seedUserIds, EXTENSION_INTERVAL],
    );
    const rows = Array.isArray(updated[0]) ? updated[0] : updated;
    console.log(`${rows.length} Bounty(ies) remise(s) à 'open', expiresAt = now() + ${EXTENSION_INTERVAL} :`);
    rows.forEach((b: { title: string }) => console.log(`  - ${b.title}`));

    const after: Array<{ status: string; count: string }> = await dataSource.query(
      `SELECT status, COUNT(*) FROM bounties WHERE "authorId" = ANY($1) GROUP BY status`,
      [seedUserIds],
    );
    console.log('Après :', after);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
