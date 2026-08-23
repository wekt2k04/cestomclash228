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
void bootstrap();
