import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Couverture ajoutee le 2026-09-09 suite au bug reel "deconnexion instantanee"
// (voir LOG.md) : le module auth n'avait jusqu'ici AUCUN test, alors que
// c'est precisement la ou les 2 vrais bugs de la soiree vivaient. Reproduit
// le pipeline reel (ValidationPipe global de main.ts non applique par
// defaut par Test.createTestingModule - a reactiver explicitement ici),
// contre un vrai Postgres (docker-compose), pas des mocks.
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // Email unique par appel - AppModule pointe sur la vraie base dev, les
  // tests ne doivent jamais se percuter entre eux ni avec des donnees
  // laissees par une session manuelle precedente.
  function uniqueEmail(): string {
    return `e2e-auth-${Date.now()}-${Math.random().toString(36).slice(2)}@mindclash.local`;
  }

  it('signup renvoie un token valide, reconnu par /auth/me', async () => {
    const email = uniqueEmail();
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'E2E Auth' })
      .expect(201);

    expect(signupRes.body.accessToken).toEqual(expect.any(String));
    expect(signupRes.body.user.email).toBe(email);

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${signupRes.body.accessToken}`)
      .expect(200);

    expect(meRes.body.user.email).toBe(email);
  });

  it('signup avec un email deja utilise est rejete (409)', async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'Premier' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'autrepassword', displayName: 'Deuxieme' })
      .expect(409);
  });

  it('login avec les bons identifiants renvoie un token valide sur /auth/me', async () => {
    const email = uniqueEmail();
    const password = 'password123';
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, displayName: 'E2E Login' })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
  });

  it('login rejete (401) un mauvais mot de passe et un email inconnu, avec le meme message', async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'E2E Wrong Pass' })
      .expect(201);

    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'totalementfaux' })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail(), password: 'peuimporte123' })
      .expect(401);

    // auth.service.ts::login - meme message generique dans les 2 cas, ne
    // doit jamais permettre de deviner si un email est inscrit.
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('/auth/me est rejete (401) sans token et avec un token invalide', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer ceci-nest-pas-un-jwt-valide')
      .expect(401);
  });
});
