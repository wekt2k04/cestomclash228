import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BountiesService, BountyView } from './bounties.service';
import { Bounty } from './entities/bounty.entity';
import { BountyStatus } from './bounty-status.enum';
import { CitiesService } from '../cities/cities.service';

// Cible claim() et resolve() : c'est la ou vit la logique metier a risque
// (reclamation atomique, empecher l'auto-reclamation, qui a le droit de
// resoudre). create()/findAll() sont du SQL brut deja verifies manuellement
// contre une vraie base (voir .claude/HANDOFF/LOG.md).
//
// Point d'attention decouvert en verification manuelle (pas en unitaire) :
// pour une requete UPDATE...RETURNING, ce driver TypeORM renvoie un tuple
// [rows, rowCount] et NON un tableau de lignes direct comme pour un SELECT -
// les mocks ci-dessous reproduisent cette forme reelle, pas une supposition.
describe('BountiesService', () => {
  let service: BountiesService;
  let bountiesRepo: {
    query: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  const makeBounty = (overrides: Partial<Bounty> = {}): Bounty =>
    ({
      id: 'bounty-1',
      authorId: 'author-1',
      claimedById: null,
      status: BountyStatus.OPEN,
      expiresAt: new Date(Date.now() + 3600_000),
      ...overrides,
    }) as Bounty;

  beforeEach(async () => {
    bountiesRepo = { query: jest.fn(), findOne: jest.fn(), update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BountiesService,
        { provide: getRepositoryToken(Bounty), useValue: bountiesRepo },
        { provide: CitiesService, useValue: {} },
      ],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
    // materializeExpiry() est appele en tete de chaque methode publique -
    // neutre par defaut, chaque test le mock a nouveau si besoin.
    bountiesRepo.query.mockResolvedValue([[], 0]);
  });

  describe('claim', () => {
    it("rejette avec BadRequestException si l'acteur est l'auteur (auto-reclamation)", async () => {
      bountiesRepo.query
        .mockResolvedValueOnce(undefined) // materializeExpiry()
        .mockResolvedValueOnce([[], 0]); // UPDATE : 0 ligne (bloque par authorId != $1)
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({ authorId: 'user-1' }),
      );

      await expect(service.claim('user-1', 'bounty-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejette avec ConflictException si déjà réclamée/résolue', async () => {
      bountiesRepo.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([[], 0]);
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({ authorId: 'other-user', status: BountyStatus.CLAIMED }),
      );

      await expect(service.claim('user-2', 'bounty-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejette avec ConflictException si expirée', async () => {
      bountiesRepo.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([[], 0]);
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({
          authorId: 'other-user',
          status: BountyStatus.OPEN,
          expiresAt: new Date(Date.now() - 1000),
        }),
      );

      await expect(service.claim('user-2', 'bounty-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it("rejette avec NotFoundException si la Bounty n'existe pas", async () => {
      bountiesRepo.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([[], 0]);
      bountiesRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.claim('user-2', 'bounty-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('réussit quand la ligne est effectivement mise à jour (1 ligne retournée)', async () => {
      bountiesRepo.query
        .mockResolvedValueOnce(undefined) // materializeExpiry()
        .mockResolvedValueOnce([[{ id: 'bounty-1' }], 1]); // UPDATE reussie
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce({ id: 'bounty-1' } as unknown as BountyView);

      const result = await service.claim('user-2', 'bounty-1');

      expect(findOneSpy).toHaveBeenCalledWith('bounty-1');
      expect(result).toEqual({ id: 'bounty-1' });
      expect(bountiesRepo.findOne).not.toHaveBeenCalled(); // pas besoin du chemin d'erreur
    });
  });

  describe('resolve', () => {
    it("rejette avec ForbiddenException si l'acteur n'est ni l'auteur ni la personne qui a réclamé", async () => {
      bountiesRepo.query.mockResolvedValueOnce(undefined);
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({
          authorId: 'author-1',
          claimedById: 'claimer-1',
          status: BountyStatus.CLAIMED,
        }),
      );

      await expect(
        service.resolve('random-user', 'bounty-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(bountiesRepo.update).not.toHaveBeenCalled();
    });

    it("l'auteur peut résoudre une Bounty réclamée", async () => {
      bountiesRepo.query.mockResolvedValueOnce(undefined);
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({
          authorId: 'author-1',
          claimedById: 'claimer-1',
          status: BountyStatus.CLAIMED,
        }),
      );
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce({} as unknown as BountyView);

      await service.resolve('author-1', 'bounty-1');

      expect(bountiesRepo.update).toHaveBeenCalledWith(
        { id: 'bounty-1' },
        expect.objectContaining({ status: BountyStatus.RESOLVED }),
      );
    });

    it('la personne qui a réclamé peut aussi résoudre', async () => {
      bountiesRepo.query.mockResolvedValueOnce(undefined);
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({
          authorId: 'author-1',
          claimedById: 'claimer-1',
          status: BountyStatus.CLAIMED,
        }),
      );
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce({} as unknown as BountyView);

      await service.resolve('claimer-1', 'bounty-1');

      expect(bountiesRepo.update).toHaveBeenCalled();
    });

    it('rejette avec ConflictException si la Bounty est encore OPEN (jamais réclamée)', async () => {
      bountiesRepo.query.mockResolvedValueOnce(undefined);
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({ authorId: 'author-1', status: BountyStatus.OPEN }),
      );

      await expect(
        service.resolve('author-1', 'bounty-1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(bountiesRepo.update).not.toHaveBeenCalled();
    });

    it('rejette avec ConflictException si déjà résolue', async () => {
      bountiesRepo.query.mockResolvedValueOnce(undefined);
      bountiesRepo.findOne.mockResolvedValueOnce(
        makeBounty({ authorId: 'author-1', status: BountyStatus.RESOLVED }),
      );

      await expect(
        service.resolve('author-1', 'bounty-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
