import { MigrationInterface, QueryRunner } from 'typeorm';

// Trouve par l'agent architecture-review le 2026-08-25 en auditant l'Increment 0 :
// aucun index spatial n'a jamais existe (synchronize:true n'en cree pas sans
// @Index declare), malgre un commentaire dans cities.service.ts qui affirmait
// le contraire (corrige dans le meme commit). findNearest() est appelee a
// CHAQUE creation de Pin/Bounty et faisait un scan sequentiel complet de
// "cities" ; ST_Intersects/ST_ClusterDBSCAN (bbox/clustering) scannent
// pins/bounties en entier. GiST est le type d'index requis pour les
// operateurs PostGIS <->/&&  sur une colonne geography - un btree par defaut
// ne les accelere pas. Les index btree sur "cityId" anticipent le filtrage
// par ville de listQuarantine() (Increment 4, voir docs/PLAN_EXTENSION.md).
export class AddSpatialIndexes1787615794455 implements MigrationInterface {
  name = 'AddSpatialIndexes1787615794455';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_cities_center_point" ON "cities" USING GIST ("centerPoint")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pins_location" ON "pins" USING GIST ("location")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pins_cityId" ON "pins" ("cityId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bounties_location" ON "bounties" USING GIST ("location")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bounties_cityId" ON "bounties" ("cityId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_bounties_cityId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bounties_location"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pins_cityId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pins_location"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cities_center_point"`);
  }
}
