import { MigrationInterface, QueryRunner } from 'typeorm';

// "Sponsoring verifie" (docs/PLAN_EXTENSION.md § Pivot 2026-08-31) : preuve de
// virement + verificateur, sans passerelle de paiement tierce. Voir
// apps/api/src/sponsorship/entities/sponsorship-request.entity.ts pour le detail
// de chaque colonne.
//
// Ecart de convention assume (trouve par architecture-review) : les contraintes
// ci-dessous sont nommees explicitement (PK_.../FK_...requesterId etc.) plutot
// que par le hash auto-genere par TypeORM utilise dans Baseline.ts/
// AddSpatialIndexes.ts. Consequence connue : `migration:generate` proposera un
// diff de renommage sans effet fonctionnel sur ces 2 FK a la prochaine
// utilisation - relire ce commentaire avant de le prendre pour un vrai
// changement de schema.
export class AddSponsorshipRequests1788513325966 implements MigrationInterface {
  name = 'AddSponsorshipRequests1788513325966';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sponsorship_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sponsorship_requests" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "requesterId" uuid NOT NULL,
         "description" text NOT NULL,
         "amountDeclared" numeric(10,2) NOT NULL,
         "proofImageUrl" character varying NOT NULL,
         "status" "public"."sponsorship_requests_status_enum" NOT NULL DEFAULT 'pending',
         "reviewedById" uuid,
         "reviewedAt" TIMESTAMP WITH TIME ZONE,
         "rejectionReason" text,
         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_sponsorship_requests_id" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsorship_requests" ADD CONSTRAINT "FK_sponsorship_requests_requesterId" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsorship_requests" ADD CONSTRAINT "FK_sponsorship_requests_reviewedById" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // Filtrage frequent de la file d'attente du verificateur (findPending()) -
    // meme logique que les index btree deja poses pour cityId (voir
    // AddSpatialIndexes) : accelere une clause WHERE status = 'pending' sur
    // une table qui grossit.
    await queryRunner.query(
      `CREATE INDEX "IDX_sponsorship_requests_status" ON "sponsorship_requests" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_sponsorship_requests_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsorship_requests" DROP CONSTRAINT "FK_sponsorship_requests_reviewedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsorship_requests" DROP CONSTRAINT "FK_sponsorship_requests_requesterId"`,
    );
    await queryRunner.query(`DROP TABLE "sponsorship_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."sponsorship_requests_status_enum"`,
    );
  }
}
