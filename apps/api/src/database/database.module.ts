import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// synchronize:false partout (y compris en dev) depuis l'Increment 0 du
// 2026-08-25 - decision utilisateur explicite (voir docs/PLAN_EXTENSION.md
// "Decisions ouvertes" #2) : elimine une classe de bugs "marche en local,
// casse en prod" au prix d'une boucle de dev legerement plus lente (lancer
// `npm run migration:run` apres avoir tire un changement de schema). Le
// schema reel vit desormais dans src/database/migrations/, jamais deduit
// implicitement des entites au demarrage. Voir data-source.ts pour le CLI.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
