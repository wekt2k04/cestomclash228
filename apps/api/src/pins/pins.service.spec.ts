import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinsService } from './pins.service';
import { Pin } from './entities/pin.entity';
import { CitiesService } from '../cities/cities.service';
import { RolesService } from '../roles/roles.service';
import { RoleScope } from '../roles/role-scope.enum';

// Cible uniquement remove() : la logique de permission (auteur / role local
// dans SA ville / role national volontairement exclu de la suppression
// unilaterale) est la partie a risque de PinsService. create()/findInBBox()/
// cluster() sont du SQL brut PostGIS, deja verifies manuellement contre une
// vraie base (voir .claude/HANDOFF/LOG.md) - pas re-testes ici en unitaire
// (mocker du SQL brut n'apporterait pas de garantie utile).
describe('PinsService.remove', () => {
  let service: PinsService;
  let pinsRepo: { findOne: jest.Mock; delete: jest.Mock; query: jest.Mock };
  let rolesService: { findByUserId: jest.Mock };

  const makePin = (overrides: Partial<Pin> = {}): Pin =>
    ({
      id: 'pin-1',
      authorId: 'author-1',
      cityId: 'city-rabat',
      ...overrides,
    }) as Pin;

  beforeEach(async () => {
    pinsRepo = { findOne: jest.fn(), delete: jest.fn(), query: jest.fn() };
    rolesService = { findByUserId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinsService,
        { provide: getRepositoryToken(Pin), useValue: pinsRepo },
        { provide: CitiesService, useValue: {} },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get<PinsService>(PinsService);
  });

  it('lève NotFoundException si le Pin n’existe pas', async () => {
    pinsRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.remove('user-1', 'pin-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(pinsRepo.delete).not.toHaveBeenCalled();
  });

  it("l'auteur peut toujours supprimer son propre Pin, sans même vérifier son rôle", async () => {
    pinsRepo.findOne.mockResolvedValueOnce(makePin({ authorId: 'author-1' }));

    await service.remove('author-1', 'pin-1');

    expect(pinsRepo.delete).toHaveBeenCalledWith({ id: 'pin-1' });
    expect(rolesService.findByUserId).not.toHaveBeenCalled();
  });

  it('un rôle local peut supprimer un Pin dans SA ville', async () => {
    pinsRepo.findOne.mockResolvedValueOnce(
      makePin({ authorId: 'someone-else', cityId: 'city-rabat' }),
    );
    rolesService.findByUserId.mockResolvedValueOnce({
      scope: RoleScope.LOCAL,
      cityId: 'city-rabat',
    });

    await service.remove('moderator-1', 'pin-1');

    expect(pinsRepo.delete).toHaveBeenCalledWith({ id: 'pin-1' });
  });

  it('un rôle local NE PEUT PAS supprimer un Pin dans une autre ville', async () => {
    pinsRepo.findOne.mockResolvedValueOnce(
      makePin({ authorId: 'someone-else', cityId: 'city-rabat' }),
    );
    rolesService.findByUserId.mockResolvedValueOnce({
      scope: RoleScope.LOCAL,
      cityId: 'city-marrakech',
    });

    await expect(service.remove('moderator-1', 'pin-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(pinsRepo.delete).not.toHaveBeenCalled();
  });

  it("un rôle NATIONAL ne peut PAS supprimer unilatéralement un Pin qu'il n'a pas créé (pouvoir volontairement limité)", async () => {
    pinsRepo.findOne.mockResolvedValueOnce(
      makePin({ authorId: 'someone-else', cityId: 'city-rabat' }),
    );
    rolesService.findByUserId.mockResolvedValueOnce({
      scope: RoleScope.NATIONAL,
      cityId: null,
    });

    await expect(
      service.remove('national-admin', 'pin-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(pinsRepo.delete).not.toHaveBeenCalled();
  });

  it("un membre ordinaire sans rôle ne peut pas supprimer le Pin d'un autre", async () => {
    pinsRepo.findOne.mockResolvedValueOnce(
      makePin({ authorId: 'someone-else', cityId: 'city-rabat' }),
    );
    rolesService.findByUserId.mockResolvedValueOnce(null);

    await expect(service.remove('random-user', 'pin-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(pinsRepo.delete).not.toHaveBeenCalled();
  });
});
