import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SponsorshipService } from './sponsorship.service';
import { SponsorshipRequest } from './entities/sponsorship-request.entity';
import { SponsorshipStatus } from './sponsorship-status.enum';
import { RolesService } from '../roles/roles.service';

// Cible approve()/reject()/findOne() : c'est la que vivent les risques reels
// (qui peut trancher une demande financiere, qu'une demande deja tranchee ne
// se re-tranche pas silencieusement, qu'une demande n'est visible que par
// son auteur ou le verificateur - pas publique). create()/findMine() sont de
// l'insertion/lecture triviales, pas de logique metier a risque dedans.
describe('SponsorshipService', () => {
  let service: SponsorshipService;
  let repo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    find: jest.Mock;
    query: jest.Mock;
  };
  let roles: { isVerifier: jest.Mock; requireVerifierScope: jest.Mock };

  const makeRequest = (
    overrides: Partial<SponsorshipRequest> = {},
  ): SponsorshipRequest =>
    ({
      id: 'req-1',
      requesterId: 'requester-1',
      status: SponsorshipStatus.PENDING,
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
      ...overrides,
    }) as SponsorshipRequest;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((v: SponsorshipRequest) => Promise.resolve(v)),
      create: jest.fn((v: Partial<SponsorshipRequest>) => v),
      find: jest.fn(),
      query: jest.fn(),
    };
    roles = { isVerifier: jest.fn(), requireVerifierScope: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorshipService,
        { provide: getRepositoryToken(SponsorshipRequest), useValue: repo },
        { provide: RolesService, useValue: roles },
      ],
    }).compile();

    service = module.get<SponsorshipService>(SponsorshipService);
  });

  describe('approve', () => {
    it("rejette avec ForbiddenException si l'acteur n'est pas verificateur (propage RolesService, avant tout acces DB)", async () => {
      roles.requireVerifierScope.mockRejectedValueOnce(
        new ForbiddenException(),
      );

      await expect(
        service.approve('random-user', 'req-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.query).not.toHaveBeenCalled();
    });

    it("rejette avec ForbiddenException si le verificateur tente d'approuver SA PROPRE demande (faille critique corrigee - meme requete atomique que le garde anti-auto-reclamation de claim())", async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[], 0]); // UPDATE : 0 ligne (bloque par "requesterId" != $2)
      repo.findOne.mockResolvedValueOnce(
        makeRequest({ requesterId: 'verifier-1' }),
      );

      await expect(
        service.approve('verifier-1', 'req-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejette avec ConflictException si la demande est déjà tranchée', async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[], 0]);
      repo.findOne.mockResolvedValueOnce(
        makeRequest({
          requesterId: 'requester-1',
          status: SponsorshipStatus.APPROVED,
        }),
      );

      await expect(
        service.approve('verifier-1', 'req-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("rejette avec NotFoundException si la demande n'existe pas", async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[], 0]);
      repo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.approve('verifier-1', 'req-x'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('approuve une demande pending pour un verificateur légitime (requête atomique avec la bonne clause WHERE)', async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[{ id: 'req-1' }], 1]);
      repo.findOne.mockResolvedValueOnce(
        makeRequest({
          status: SponsorshipStatus.APPROVED,
          reviewedById: 'verifier-1',
        }),
      );

      const result = await service.approve('verifier-1', 'req-1');

      expect(result.status).toBe(SponsorshipStatus.APPROVED);
      expect(repo.query).toHaveBeenCalledWith(
        expect.stringContaining('"requesterId" != $2'),
        ['approved', 'verifier-1', null, 'req-1'],
      );
    });
  });

  describe('reject', () => {
    it("rejette avec ForbiddenException si l'acteur n'est pas verificateur", async () => {
      roles.requireVerifierScope.mockRejectedValueOnce(
        new ForbiddenException(),
      );

      await expect(
        service.reject('random-user', 'req-1', 'raison'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejette avec ForbiddenException si le verificateur tente de rejeter SA PROPRE demande', async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[], 0]);
      repo.findOne.mockResolvedValueOnce(
        makeRequest({ requesterId: 'verifier-1' }),
      );

      await expect(
        service.reject('verifier-1', 'req-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejette avec ConflictException si déjà tranchée', async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[], 0]);
      repo.findOne.mockResolvedValueOnce(
        makeRequest({
          requesterId: 'requester-1',
          status: SponsorshipStatus.APPROVED,
        }),
      );

      await expect(
        service.reject('verifier-1', 'req-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('enregistre la raison du rejet quand fournie', async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[{ id: 'req-1' }], 1]);
      repo.findOne.mockResolvedValueOnce(
        makeRequest({
          status: SponsorshipStatus.REJECTED,
          rejectionReason: 'Preuve illisible',
        }),
      );

      const result = await service.reject(
        'verifier-1',
        'req-1',
        'Preuve illisible',
      );

      expect(result.status).toBe(SponsorshipStatus.REJECTED);
      expect(result.rejectionReason).toBe('Preuve illisible');
      expect(repo.query).toHaveBeenCalledWith(expect.any(String), [
        'rejected',
        'verifier-1',
        'Preuve illisible',
        'req-1',
      ]);
    });

    it('accepte un rejet sans raison (reste null, pas une chaîne vide silencieuse)', async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.query.mockResolvedValueOnce([[{ id: 'req-1' }], 1]);
      repo.findOne.mockResolvedValueOnce(
        makeRequest({
          status: SponsorshipStatus.REJECTED,
          rejectionReason: null,
        }),
      );

      const result = await service.reject('verifier-1', 'req-1');

      expect(result.rejectionReason).toBeNull();
      expect(repo.query).toHaveBeenCalledWith(expect.any(String), [
        'rejected',
        'verifier-1',
        null,
        'req-1',
      ]);
    });
  });

  describe('findOne', () => {
    it("l'auteur de la demande peut la consulter sans être vérificateur", async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRequest({ requesterId: 'requester-1' }),
      );

      const result = await service.findOne('requester-1', 'req-1');

      expect(result.id).toBe('req-1');
      expect(roles.isVerifier).not.toHaveBeenCalled();
    });

    it('un vérificateur peut consulter la demande de quelqu’un d’autre', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRequest({ requesterId: 'requester-1' }),
      );
      roles.isVerifier.mockResolvedValueOnce(true);

      const result = await service.findOne('verifier-1', 'req-1');

      expect(result.id).toBe('req-1');
    });

    it("rejette avec ForbiddenException un tiers qui n'est ni l'auteur ni vérificateur", async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRequest({ requesterId: 'requester-1' }),
      );
      roles.isVerifier.mockResolvedValueOnce(false);

      await expect(
        service.findOne('random-user', 'req-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("rejette avec NotFoundException si la demande n'existe pas", async () => {
      repo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('anyone', 'req-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findPending', () => {
    it('propage le refus de RolesService pour un non-vérificateur', async () => {
      roles.requireVerifierScope.mockRejectedValueOnce(
        new ForbiddenException(),
      );

      await expect(service.findPending('random-user')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('retourne la file pending pour un vérificateur légitime', async () => {
      roles.requireVerifierScope.mockResolvedValueOnce(undefined);
      repo.find.mockResolvedValueOnce([makeRequest()]);

      const result = await service.findPending('verifier-1');

      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: SponsorshipStatus.PENDING },
        }),
      );
    });
  });
});
