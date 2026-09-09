import { MigrationInterface, QueryRunner } from 'typeorm';

// Marketplace (refonte 2026-09-09, docs/BUSINESS_PLAN.md) : prolonge Bounty
// plutot que de creer une nouvelle table parallele - decision utilisateur
// explicite. Voir apps/api/src/bounties/entities/bounty.entity.ts pour le
// detail de chaque colonne. kind reste 'request' par defaut (comportement
// historique inchange), priceMad reste NULL par defaut (Bounty gratuite -
// "pas besoin d'etre payante"). Le deblocage payant conditionnel
// (bounty_unlock_requests) arrive dans une migration separee.
export class AddBountyMarketplaceFields1788600000000 implements MigrationInterface {
  name = 'AddBountyMarketplaceFields1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."bounties_kind_enum" AS ENUM('request', 'offer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bounties_category_enum" AS ENUM('tutorat', 'traduction', 'aide_administrative', 'covoiturage', 'demenagement', 'autre')`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD "kind" "public"."bounties_kind_enum" NOT NULL DEFAULT 'request'`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD "priceMad" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD "isRemote" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD "category" "public"."bounties_category_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bounties" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "bounties" DROP COLUMN "isRemote"`);
    await queryRunner.query(`ALTER TABLE "bounties" DROP COLUMN "priceMad"`);
    await queryRunner.query(`ALTER TABLE "bounties" DROP COLUMN "kind"`);
    await queryRunner.query(`DROP TYPE "public"."bounties_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."bounties_kind_enum"`);
  }
}
