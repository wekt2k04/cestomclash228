import 'dotenv/config';
import { DataSource } from 'typeorm';

// Nettoyage ponctuel des comptes de test accumules pendant les sessions de verification manuelle
// (2026-09-09/10) : debug-e2e-*@mindclash.local, smoketest-*@cestomclash.local,
// ui-test-*@cestomclash.local - jamais les comptes seed-*@cestomclash.local (peuplement
// communautaire volontaire, voir seed-community.ts) ni un vrai compte utilisateur. Ordre de
// suppression impose par les contraintes FK "ON DELETE NO ACTION" (aucune cascade automatique,
// deliberement - voir les migrations) : messages -> conversations -> bounty_interests ->
// bounties -> pins -> users.
const TEST_EMAIL_PATTERNS = [
  'debug-e2e-%@mindclash.local',
  'smoketest-%@cestomclash.local',
  'ui-test-%@cestomclash.local',
];

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
  });
  await dataSource.initialize();
  console.log('Connecté à la base.');

  try {
    const whereClause = TEST_EMAIL_PATTERNS.map((_, i) => `email LIKE $${i + 1}`).join(
      ' OR ',
    );
    const testUsers: Array<{ id: string; email: string }> = await dataSource.query(
      `SELECT id, email FROM users WHERE ${whereClause}`,
      TEST_EMAIL_PATTERNS,
    );
    if (testUsers.length === 0) {
      console.log('Aucun compte de test trouvé - rien à nettoyer.');
      return;
    }
    console.log(`${testUsers.length} compte(s) de test trouvé(s) :`);
    testUsers.forEach((u) => console.log(`  - ${u.email}`));
    const userIds = testUsers.map((u) => u.id);

    const bountyRows: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM bounties WHERE "authorId" = ANY($1) OR "claimedById" = ANY($1)`,
      [userIds],
    );
    const bountyIds = bountyRows.map((b) => b.id);

    if (bountyIds.length > 0) {
      const deletedMessages = await dataSource.query(
        `DELETE FROM messages WHERE "conversationId" IN (SELECT id FROM conversations WHERE "bountyId" = ANY($1))`,
        [bountyIds],
      );
      const deletedConversations = await dataSource.query(
        `DELETE FROM conversations WHERE "bountyId" = ANY($1)`,
        [bountyIds],
      );
      const deletedInterests = await dataSource.query(
        `DELETE FROM bounty_interests WHERE "bountyId" = ANY($1)`,
        [bountyIds],
      );
      console.log(
        `  messages: ${deletedMessages[1] ?? '?'}, conversations: ${deletedConversations[1] ?? '?'}, bounty_interests: ${deletedInterests[1] ?? '?'}`,
      );
    }
    // Propositions faites PAR un compte de test sur la Bounty de quelqu'un d'autre (pas
    // couvertes par le filtre ci-dessus, qui ne regarde que les Bounties dont le test est
    // auteur/claimant).
    await dataSource.query(
      `DELETE FROM bounty_interests WHERE "userId" = ANY($1)`,
      [userIds],
    );

    const deletedBounties = await dataSource.query(
      `DELETE FROM bounties WHERE "authorId" = ANY($1) OR "claimedById" = ANY($1)`,
      [userIds],
    );
    const deletedPins = await dataSource.query(
      `DELETE FROM pins WHERE "authorId" = ANY($1)`,
      [userIds],
    );
    const deletedUsers = await dataSource.query(
      `DELETE FROM users WHERE id = ANY($1)`,
      [userIds],
    );
    console.log(
      `Supprimé : bounties ${deletedBounties[1] ?? '?'}, pins ${deletedPins[1] ?? '?'}, users ${deletedUsers[1] ?? '?'}.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
