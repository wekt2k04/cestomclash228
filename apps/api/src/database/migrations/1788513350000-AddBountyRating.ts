import { MigrationInterface, QueryRunner } from 'typeorm';

// Notation (docs/PLAN_EXTENSION.md § Pivot 2026-08-31, Increment 3bis) - voir
// apps/api/src/bounties/entities/bounty.entity.ts pour le detail des colonnes.
export class AddBountyRating1788513350000 implements MigrationInterface {
  name = 'AddBountyRating1788513350000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD "ratingValue" smallint`,
    );
    await queryRunner.query(`ALTER TABLE "bounties" ADD "ratingComment" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bounties" DROP COLUMN "ratingComment"`,
    );
    await queryRunner.query(`ALTER TABLE "bounties" DROP COLUMN "ratingValue"`);
  }
}
