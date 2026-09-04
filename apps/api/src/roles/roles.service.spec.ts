import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RoleScope } from './role-scope.enum';

// Mock minimal du Repository<Role> - seules les 3 methodes reellement
// utilisees par RolesService sont mockees (pas de vraie connexion DB, voir
// mandat critical-logic-tests).
interface MockRepository {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

const makeRole = (overrides: Partial<Role> = {}): Role =>
  ({
    id: 'role-id',
    userId: 'user-id',
    scope: RoleScope.LOCAL,
    cityId: null,
    ...overrides,
  }) as Role;

describe('RolesService', () => {
  let service: RolesService;
  let repo: MockRepository;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: repo },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('assign', () => {
    it("rejette avec ForbiddenException quand l'acteur n'a aucun role", async () => {
      repo.findOne.mockResolvedValueOnce(null); // lookup acteur

      await expect(
        service.assign('actor-1', 'target-1', RoleScope.LOCAL, 'city-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it("rejette avec ForbiddenException quand l'acteur a un role local (pas national)", async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({
          userId: 'actor-1',
          scope: RoleScope.LOCAL,
          cityId: 'city-actor',
        }),
      );

      await expect(
        service.assign('actor-1', 'target-1', RoleScope.LOCAL, 'city-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it("reussit quand l'acteur a un role national et cree le role de la cible", async () => {
      const actorRole = makeRole({
        userId: 'actor-1',
        scope: RoleScope.NATIONAL,
        cityId: null,
      });
      const created = makeRole({
        id: 'new-role-id',
        userId: 'target-1',
        scope: RoleScope.LOCAL,
        cityId: 'city-1',
      });

      repo.findOne
        .mockResolvedValueOnce(actorRole) // lookup acteur
        .mockResolvedValueOnce(null); // lookup cible : aucun role existant
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.assign(
        'actor-1',
        'target-1',
        RoleScope.LOCAL,
        'city-1',
      );

      expect(repo.create).toHaveBeenCalledWith({
        userId: 'target-1',
        scope: RoleScope.LOCAL,
        cityId: 'city-1',
      });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it("rejette avec ForbiddenException quand scope=local et qu'aucun cityId n'est fourni", async () => {
      const actorRole = makeRole({
        userId: 'actor-1',
        scope: RoleScope.NATIONAL,
        cityId: null,
      });
      repo.findOne.mockResolvedValueOnce(actorRole);

      await expect(
        service.assign('actor-1', 'target-1', RoleScope.LOCAL, null),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('cas limite : reassigne un role a un utilisateur qui en a deja un (met a jour, ne duplique pas)', async () => {
      const actorRole = makeRole({
        userId: 'actor-1',
        scope: RoleScope.NATIONAL,
        cityId: null,
      });
      const existingRole = makeRole({
        id: 'existing-role-id',
        userId: 'target-1',
        scope: RoleScope.LOCAL,
        cityId: 'old-city',
      });

      repo.findOne
        .mockResolvedValueOnce(actorRole) // lookup acteur
        .mockResolvedValueOnce(existingRole); // lookup cible : role deja existant
      repo.save.mockImplementation((r: Role) => Promise.resolve(r));

      const result = await service.assign(
        'actor-1',
        'target-1',
        RoleScope.NATIONAL,
        null,
      );

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-role-id',
          userId: 'target-1',
          scope: RoleScope.NATIONAL,
          cityId: null,
        }),
      );
      expect(result.id).toBe('existing-role-id');
      expect(result.scope).toBe(RoleScope.NATIONAL);
      expect(result.cityId).toBeNull();
    });
  });

  describe('canActOnCity', () => {
    it('retourne true pour un role national quelle que soit la ville cible', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.NATIONAL, cityId: null }),
      );

      await expect(service.canActOnCity('user-1', 'city-x')).resolves.toBe(
        true,
      );
    });

    it('retourne false pour un role local ciblant une ville differente de la sienne', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.LOCAL, cityId: 'city-a' }),
      );

      await expect(service.canActOnCity('user-1', 'city-b')).resolves.toBe(
        false,
      );
    });

    it('retourne true pour un role local ciblant exactement sa propre ville', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.LOCAL, cityId: 'city-a' }),
      );

      await expect(service.canActOnCity('user-1', 'city-a')).resolves.toBe(
        true,
      );
    });

    it('retourne false pour un utilisateur sans role du tout', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      await expect(service.canActOnCity('user-1', 'city-a')).resolves.toBe(
        false,
      );
    });
  });

  // Distinct de canActOnCity : un role national ne doit JAMAIS etre
  // considere comme moderateur local, y compris sur une ville "cible" -
  // c'est la difference qui justifie l'existence de cette methode separee
  // (voir commentaire dans roles.service.ts). Introduit en meme temps que
  // la centralisation de PinsService.remove() (etait duplique en inline).
  describe('isLocalModeratorForCity', () => {
    it('retourne FALSE pour un role national, meme sur une ville "cible" arbitraire (contrairement a canActOnCity)', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.NATIONAL, cityId: null }),
      );

      await expect(
        service.isLocalModeratorForCity('user-1', 'city-x'),
      ).resolves.toBe(false);
    });

    it('retourne true pour un role local ciblant exactement sa propre ville', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.LOCAL, cityId: 'city-a' }),
      );

      await expect(
        service.isLocalModeratorForCity('user-1', 'city-a'),
      ).resolves.toBe(true);
    });

    it('retourne false pour un role local ciblant une autre ville', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.LOCAL, cityId: 'city-a' }),
      );

      await expect(
        service.isLocalModeratorForCity('user-1', 'city-b'),
      ).resolves.toBe(false);
    });

    it('retourne false pour un utilisateur sans role du tout', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.isLocalModeratorForCity('user-1', 'city-a'),
      ).resolves.toBe(false);
    });
  });

  describe('requireLocalModerationScope', () => {
    it('leve ForbiddenException quand isLocalModeratorForCity serait false', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.NATIONAL, cityId: null }),
      );

      await expect(
        service.requireLocalModerationScope('user-1', 'city-a'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('resout sans erreur quand isLocalModeratorForCity serait true', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.LOCAL, cityId: 'city-a' }),
      );

      await expect(
        service.requireLocalModerationScope('user-1', 'city-a'),
      ).resolves.toBeUndefined();
    });
  });

  describe('isVerifier', () => {
    it('retourne true pour un role national', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.NATIONAL }),
      );

      await expect(service.isVerifier('user-1')).resolves.toBe(true);
    });

    it('retourne false pour un role local (contrairement a canActOnCity, aucune ville ne le rend verificateur)', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.LOCAL, cityId: 'city-a' }),
      );

      await expect(service.isVerifier('user-1')).resolves.toBe(false);
    });

    it('retourne false pour un utilisateur sans role du tout', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      await expect(service.isVerifier('user-1')).resolves.toBe(false);
    });
  });

  describe('requireVerifierScope', () => {
    it('leve ForbiddenException pour un role local', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.LOCAL, cityId: 'city-a' }),
      );

      await expect(
        service.requireVerifierScope('user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('resout sans erreur pour un role national', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeRole({ scope: RoleScope.NATIONAL }),
      );

      await expect(
        service.requireVerifierScope('user-1'),
      ).resolves.toBeUndefined();
    });
  });
});
