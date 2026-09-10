import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Couverture du parcours payant complet (2026-09-10, demande utilisateur explicite du soir) :
// plusieurs candidats proposent leur aide, l'auteur en accepte un (jamais 2 a la fois, meme sous
// tentative concurrente), preuve de paiement, confirmation, chat qui s'active seulement a partir
// de la, filtre anti-coordonnees. Cible specifiquement les cas limites identifies dans le plan -
// pas une simple repetition du chemin heureux.
interface AuthBody {
  accessToken: string;
  user: { id: string };
}
interface BountyBody {
  id: string;
  status: string;
  claimedById: string | null;
}
interface InterestBody {
  id: string;
  status: string;
}
interface CandidateBody {
  id: string;
  userId: string;
  status: string;
  trustBadge: string;
  completedCount: number;
}
interface ErrorBody {
  message: string;
}

const RABAT = { lat: 34.0209, lng: -6.8416 };

describe('BountyInterests + Chat (e2e)', () => {
  let app: INestApplication<App>;

  // Timeout explicite (defaut Jest : 5000ms) - observe en pratique : le tout premier compile()
  // d'un fichier de test (nouveaux modules Nest + pool de connexions TypeORM) peut legerement
  // depasser 5s selon la charge de la machine, sans rapport avec un vrai bug (reproduit une
  // fois, jamais au re-lancement immediat suivant).
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
  }, 15_000);

  afterEach(async () => {
    await app.close();
  });

  function uniqueEmail(label: string): string {
    return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@mindclash.local`;
  }

  async function signup(
    label: string,
  ): Promise<{ token: string; userId: string }> {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: uniqueEmail(label),
        password: 'password123',
        displayName: `E2E ${label}`,
      })
      .expect(201);
    const body = res.body as AuthBody;
    return { token: body.accessToken, userId: body.user.id };
  }

  async function createBounty(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/bounties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'TEST E2E bounty-interests',
        description: 'Créé par bounty-interests-and-chat.e2e-spec.ts',
        lat: RABAT.lat,
        lng: RABAT.lng,
        durationHours: 24,
        ...overrides,
      })
      .expect(201);
    return (res.body as BountyBody).id;
  }

  // Chemin le plus court vers une Bounty CLAIMED, pour les tests qui portent sur le chat plutot
  // que sur le parcours payant lui-meme (gratuite -> claim() direct, deja teste par ailleurs).
  async function createClaimedFreeBounty(): Promise<{
    bountyId: string;
    authorToken: string;
    claimantToken: string;
    claimantId: string;
  }> {
    const author = await signup('chat-author');
    const claimant = await signup('chat-claimant');
    const bountyId = await createBounty(author.token);
    await request(app.getHttpServer())
      .patch(`/bounties/${bountyId}/claim`)
      .set('Authorization', `Bearer ${claimant.token}`)
      .expect(200);
    return {
      bountyId,
      authorToken: author.token,
      claimantToken: claimant.token,
      claimantId: claimant.userId,
    };
  }

  describe('parcours payant complet', () => {
    it('proposer -> accepter -> preuve -> confirmer -> Bounty CLAIMED avec le bon claimedById', async () => {
      const author = await signup('flow-author');
      const candidate = await signup('flow-candidate');
      const bountyId = await createBounty(author.token, { priceMad: 50 });

      const interestRes = await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${candidate.token}`)
        .expect(201);
      const interestId = (interestRes.body as InterestBody).id;

      const candidatesRes = await request(app.getHttpServer())
        .get(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${author.token}`)
        .expect(200);
      const candidates = candidatesRes.body as CandidateBody[];
      expect(candidates).toHaveLength(1);
      expect(candidates[0].userId).toBe(candidate.userId);
      // Aucun historique -> "nouveau", pas de nouvelle colonne de profil, calcule a la volee.
      expect(candidates[0].trustBadge).toBe('nouveau');
      expect(candidates[0].completedCount).toBe(0);

      await request(app.getHttpServer())
        .patch(`/bounty-interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${author.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/bounty-interests/${interestId}/proof`)
        .set('Authorization', `Bearer ${candidate.token}`)
        .send({ proofImageUrl: 'https://example.com/proof.png' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/bounty-interests/${interestId}/confirm-payment`)
        .set('Authorization', `Bearer ${author.token}`)
        .expect(200);

      const bountyRes = await request(app.getHttpServer())
        .get(`/bounties/${bountyId}`)
        .expect(200);
      const bounty = bountyRes.body as BountyBody;
      expect(bounty.status).toBe('claimed');
      expect(bounty.claimedById).toBe(candidate.userId);

      // Le chat s'active automatiquement (voir confirmPayment() -> ensureConversationForBounty()).
      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ body: 'On se voit où ?' })
        .expect(201);
    });

    it('rejette (400) une proposition sur sa propre Bounty', async () => {
      const author = await signup('self-interest');
      const bountyId = await createBounty(author.token, { priceMad: 30 });

      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${author.token}`)
        .expect(400);
    });

    it('rejette (400) une proposition sur une Bounty gratuite (priceMad absent)', async () => {
      const author = await signup('free-interest-author');
      const other = await signup('free-interest-other');
      const bountyId = await createBounty(author.token);

      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${other.token}`)
        .expect(400);
    });

    it("empêche d'accepter 2 propositions différentes pour la même Bounty (même sous tentative concurrente)", async () => {
      const author = await signup('double-accept-author');
      const candidateA = await signup('double-accept-a');
      const candidateB = await signup('double-accept-b');
      const bountyId = await createBounty(author.token, { priceMad: 20 });

      const resA = await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${candidateA.token}`)
        .expect(201);
      const resB = await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${candidateB.token}`)
        .expect(201);
      const interestIdA = (resA.body as InterestBody).id;
      const interestIdB = (resB.body as InterestBody).id;

      // Les 2 "accept" partent en parallele (Promise.allSettled) - reproduit une vraie course,
      // pas juste 2 appels sequentiels ou l'ordre garantirait deja le bon resultat.
      const [settledA, settledB] = await Promise.allSettled([
        request(app.getHttpServer())
          .patch(`/bounty-interests/${interestIdA}/accept`)
          .set('Authorization', `Bearer ${author.token}`),
        request(app.getHttpServer())
          .patch(`/bounty-interests/${interestIdB}/accept`)
          .set('Authorization', `Bearer ${author.token}`),
      ]);

      const statuses = [settledA, settledB].map((s) =>
        s.status === 'fulfilled' ? s.value.status : -1,
      );
      // Exactement 1 succes (200), l'autre rejete (409) - jamais les 2 a 200.
      expect(statuses.filter((s) => s === 200)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(1);

      // L'autre proposition, quelle qu'elle soit, doit avoir ete declinee automatiquement (ou
      // etre restee "pending" si c'est elle qui a echoue l'acceptation - dans tous les cas,
      // jamais "accepted" pour les 2 a la fois).
      const finalA = await request(app.getHttpServer())
        .get(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${author.token}`)
        .expect(200);
      const acceptedCount = (finalA.body as CandidateBody[]).filter(
        (c) => c.status === 'accepted',
      ).length;
      expect(acceptedCount).toBe(1);
    });

    it("rejette (409) la confirmation de paiement tant que la preuve n'a pas été soumise", async () => {
      const author = await signup('no-proof-author');
      const candidate = await signup('no-proof-candidate');
      const bountyId = await createBounty(author.token, { priceMad: 40 });

      const interestRes = await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/interests`)
        .set('Authorization', `Bearer ${candidate.token}`)
        .expect(201);
      const interestId = (interestRes.body as InterestBody).id;

      await request(app.getHttpServer())
        .patch(`/bounty-interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${author.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/bounty-interests/${interestId}/confirm-payment`)
        .set('Authorization', `Bearer ${author.token}`)
        .expect(409);
    });
  });

  describe('chat', () => {
    it("rejette (403) un non-participant qui tente de lire ou d'écrire", async () => {
      const { bountyId } = await createClaimedFreeBounty();
      const outsider = await signup('chat-outsider');

      await request(app.getHttpServer())
        .get(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .expect(403);

      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({ body: 'Salut' })
        .expect(403);
    });

    it("rejette (409) un message tant que la Bounty n'est pas prise en charge", async () => {
      const author = await signup('chat-too-early');
      const bountyId = await createBounty(author.token);

      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ body: 'On se voit où ?' })
        .expect(409);
    });

    it('rejette (400) un message contenant un numéro de téléphone ou un email, laisse passer une heure de rendez-vous et un numéro de chambre', async () => {
      const { bountyId, authorToken } = await createClaimedFreeBounty();

      const rejected = await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ body: 'Appelle-moi au 0612345678 stp' })
        .expect(400);
      expect((rejected.body as ErrorBody).message).toMatch(/coordonnées/i);

      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ body: 'Contacte-moi à test@example.com' })
        .expect(400);

      // Faux positifs plausibles - ne doivent PAS être bloqués (contact-filter.ts).
      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ body: 'On se voit à 15h30 devant la fac ?' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/bounties/${bountyId}/messages`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ body: 'Je suis en chambre 204, deuxième étage' })
        .expect(201);
    });
  });
});
