import { MigrationInterface, QueryRunner } from 'typeorm';

// Marketplace payant reel (2026-09-10, docs/PLAN_EXTENSION.md § Pivot 2026-08-31 + demande
// utilisateur explicite du soir) : plusieurs candidats peuvent proposer leur aide sur une Bounty
// payante (bounty_interests, 1 ligne par candidat), l'auteur en accepte un sur la base d'un
// profil de confiance CALCULE (pas de nouvelle colonne sur users - voir
// BountyInterestsService.findCandidates()), le candidat transmet une preuve de paiement puis
// l'auteur confirme - a ce moment seulement bounties.status/claimedById basculent (reutilise tel
// quel le mecanisme existant, voir bounties.service.ts::claim()). Une conversation (chat
// polling, pas de WebSocket - Render gratuit tue les connexions persistantes) est creee des
// qu'une Bounty devient CLAIMED, payante ou gratuite. Voir apps/api/src/bounty-interests/ et
// apps/api/src/chat/ pour le detail de chaque colonne.
export class AddBountyInterestsAndChat1788700000000 implements MigrationInterface {
  name = 'AddBountyInterestsAndChat1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."bounty_interests_status_enum" AS ENUM('pending', 'accepted', 'declined', 'confirmed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bounty_interests" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "bountyId" uuid NOT NULL,
         "userId" uuid NOT NULL,
         "status" "public"."bounty_interests_status_enum" NOT NULL DEFAULT 'pending',
         "proofImageUrl" character varying,
         "proofSubmittedAt" TIMESTAMP WITH TIME ZONE,
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_bounty_interests_id" PRIMARY KEY ("id"),
         CONSTRAINT "UQ_bounty_interests_bountyId_userId" UNIQUE ("bountyId", "userId")
       )`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounty_interests" ADD CONSTRAINT "FK_bounty_interests_bountyId" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounty_interests" ADD CONSTRAINT "FK_bounty_interests_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // Requete la plus frequente : toutes les propositions d'UNE Bounty (findCandidates(),
    // accept()) - meme logique que les index deja poses ailleurs sur une colonne de filtrage
    // frequent (voir AddSponsorshipRequests).
    await queryRunner.query(
      `CREATE INDEX "IDX_bounty_interests_bountyId" ON "bounty_interests" ("bountyId")`,
    );
    // Index unique PARTIEL (WHERE status = 'accepted') : garantit au niveau base qu'une Bounty
    // ne peut jamais avoir 2 candidats "accepted" simultanement, meme sous 2 acceptations
    // concurrentes portant sur 2 propositions DIFFERENTES (un simple UPDATE...WHERE conditionnel
    // cote application ne suffirait pas ici - les 2 UPDATE portent sur des LIGNES differentes,
    // aucun verrou de ligne ne les serialiserait naturellement ; voir
    // BountyInterestsService.accept(), qui capture la violation de cette contrainte comme un 409
    // propre plutot que de laisser passer une 2e acceptation).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_bounty_interests_one_accepted_per_bounty" ON "bounty_interests" ("bountyId") WHERE status = 'accepted'`,
    );

    await queryRunner.query(
      `CREATE TABLE "conversations" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "bountyId" uuid NOT NULL,
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id"),
         CONSTRAINT "UQ_conversations_bountyId" UNIQUE ("bountyId")
       )`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_bountyId" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "messages" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "conversationId" uuid NOT NULL,
         "authorId" uuid NOT NULL,
         "body" text NOT NULL,
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversationId" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // Liste des messages d'une conversation, triee par date - requete a chaque poll (20s, voir
    // ChatService.listMessages()).
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversationId" ON "messages" ("conversationId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_messages_conversationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_authorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversationId"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);

    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_bountyId"`,
    );
    await queryRunner.query(`DROP TABLE "conversations"`);

    // Aussi supprime implicitement par le DROP TABLE qui suit (un index sur une table tombe
    // avec elle) - explicite quand meme, par symetrie avec le reste de ce down() et pour que
    // quiconque le relit voie chaque objet cree par up() explicitement defait, pas seulement
    // par effet de bord.
    await queryRunner.query(
      `DROP INDEX "public"."UQ_bounty_interests_one_accepted_per_bounty"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bounty_interests_bountyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounty_interests" DROP CONSTRAINT "FK_bounty_interests_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounty_interests" DROP CONSTRAINT "FK_bounty_interests_bountyId"`,
    );
    await queryRunner.query(`DROP TABLE "bounty_interests"`);
    await queryRunner.query(
      `DROP TYPE "public"."bounty_interests_status_enum"`,
    );
  }
}
