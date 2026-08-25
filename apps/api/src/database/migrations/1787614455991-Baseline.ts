import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1787614455991 implements MigrationInterface {
  name = 'Baseline1787614455991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Necessaire explicitement ici : synchronize:true les creait en douce
    // a chaque demarrage jusqu'a l'Increment 0 (2026-08-25), masquant que
    // rien ne les activait reellement de facon tracee. Verifie sur un
    // conteneur postgis/postgis vraiment vierge (image de base = seul
    // plpgsql active) que sans ces deux lignes, la migration echoue sur
    // uuid_generate_v4() et geography(Point,4326) plus bas.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "cities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "centerPoint" geography(Point,4326), CONSTRAINT "UQ_a0ae8d83b7d32359578c486e7f6" UNIQUE ("name"), CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying, "googleId" character varying, "displayName" character varying NOT NULL, "homeCityId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bounties_status_enum" AS ENUM('open', 'claimed', 'resolved', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bounties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "authorId" uuid NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "location" geography(Point,4326) NOT NULL, "cityId" uuid NOT NULL, "status" "public"."bounties_status_enum" NOT NULL DEFAULT 'open', "claimedById" uuid, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "resolvedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_335c87017bcb2fa9bc15678f385" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pins_type_enum" AS ENUM('astuce', 'lieu_sur', 'piege_administratif', 'alerte')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "authorId" uuid NOT NULL, "type" "public"."pins_type_enum" NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "location" geography(Point,4326) NOT NULL, "cityId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3e589ffd3c8c46861d011aede4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."roles_scope_enum" AS ENUM('national', 'local')`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "scope" "public"."roles_scope_enum" NOT NULL, "cityId" uuid, CONSTRAINT "UQ_c8db5603420d119933bbc5c398c" UNIQUE ("userId"), CONSTRAINT "REL_c8db5603420d119933bbc5c398" UNIQUE ("userId"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_9bb8f3ea5230dce54e3db1f4f9c" FOREIGN KEY ("homeCityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD CONSTRAINT "FK_cefdf353af73b0f792db66d6caf" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD CONSTRAINT "FK_284fabad4582894ab5275bfeb7d" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" ADD CONSTRAINT "FK_f2db974b9a83f6d88c49e6d4003" FOREIGN KEY ("claimedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pins" ADD CONSTRAINT "FK_abc31befa33220e1af9beec5bbb" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pins" ADD CONSTRAINT "FK_925c882b9c71d59588be2b3dd1e" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_c8db5603420d119933bbc5c398c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_7acb73ae5f9f5ddde24644a4205" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_7acb73ae5f9f5ddde24644a4205"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_c8db5603420d119933bbc5c398c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pins" DROP CONSTRAINT "FK_925c882b9c71d59588be2b3dd1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pins" DROP CONSTRAINT "FK_abc31befa33220e1af9beec5bbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" DROP CONSTRAINT "FK_f2db974b9a83f6d88c49e6d4003"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" DROP CONSTRAINT "FK_284fabad4582894ab5275bfeb7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bounties" DROP CONSTRAINT "FK_cefdf353af73b0f792db66d6caf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_9bb8f3ea5230dce54e3db1f4f9c"`,
    );
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "public"."roles_scope_enum"`);
    await queryRunner.query(`DROP TABLE "pins"`);
    await queryRunner.query(`DROP TYPE "public"."pins_type_enum"`);
    await queryRunner.query(`DROP TABLE "bounties"`);
    await queryRunner.query(`DROP TYPE "public"."bounties_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "cities"`);
  }
}
