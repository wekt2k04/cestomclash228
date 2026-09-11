import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  // Liste blanche separee par des virgules - permet d'ouvrir simultanement
  // localhost (PC) et l'IP LAN (PC + telephone sur le meme reseau) sans
  // desactiver CORS. Voir docs/STACK.md.
  const webOrigins = config
    .getOrThrow<string>('WEB_ORIGIN')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: webOrigins });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(config.getOrThrow<number>('PORT'));
}

// Robustesse prod (2026-09-11) : `void bootstrap()` seul avalait silencieusement tout echec de
// demarrage (env var manquante, base injoignable...) - Node se contentait de planter sans trace
// exploitable. Les handlers globaux couvrent le reste : une erreur qui echappe au cycle de
// requete Nest (deja gere par son propre filtre d'exception, donc jamais un crash pour une
// requete individuelle) plante quand meme le process par defaut depuis Node 15+ - l'objectif
// ici n'est pas d'empecher ce crash (un redemarrage propre par Render reste correct), juste de
// s'assurer qu'il est toujours journalise clairement avant.
process.on('uncaughtException', (err) => {
  console.error('uncaughtException - arret du process :', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection - arret du process :', reason);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error('Échec du démarrage :', err);
  process.exit(1);
});
