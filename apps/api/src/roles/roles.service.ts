import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleScope } from './role-scope.enum';

// Cette classe n'expose volontairement aucune methode de type "supprimer/
// bannir/mettre en quarantaine un utilisateur ou un contenu par decision
// unilaterale d'un role national" - le pouvoir du Bureau Executif central
// est volontairement limite (decision utilisateur du 2026-08-22, voir
// docs/ARCHITECTURE.md). Une future action destructrice devra passer par un
// mecanisme collectif (ex: le seuil anti-brigading multi-villes), jamais par
// une methode "isNational() ? autorise : refuse" ici.
@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  findByUserId(userId: string): Promise<Role | null> {
    return this.roles.findOne({ where: { userId } });
  }

  // Un role national peut assigner un role local a n'importe quel
  // utilisateur (c'est le fonctionnement reel de la federation CESTOM) ainsi
  // que d'autres roles nationaux. Seul un role national existant peut
  // assigner un role - amorce via BOOTSTRAP_ADMIN_EMAIL, voir auth.service.
  async assign(
    actorUserId: string,
    targetUserId: string,
    scope: RoleScope,
    cityId: string | null,
  ): Promise<Role> {
    const actorRole = await this.findByUserId(actorUserId);
    if (!actorRole || actorRole.scope !== RoleScope.NATIONAL) {
      throw new ForbiddenException(
        'Seul un role national peut assigner un role.',
      );
    }
    if (scope === RoleScope.LOCAL && !cityId) {
      throw new ForbiddenException('Un role local requiert une ville.');
    }

    const existing = await this.findByUserId(targetUserId);
    if (existing) {
      existing.scope = scope;
      existing.cityId = scope === RoleScope.LOCAL ? cityId : null;
      return this.roles.save(existing);
    }
    const role = this.roles.create({
      userId: targetUserId,
      scope,
      cityId: scope === RoleScope.LOCAL ? cityId : null,
    });
    return this.roles.save(role);
  }

  async bootstrapNationalRole(userId: string): Promise<Role> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    const role = this.roles.create({
      userId,
      scope: RoleScope.NATIONAL,
      cityId: null,
    });
    return this.roles.save(role);
  }

  // Coeur du RBAC spatial : le scope est evalue sur la VILLE CIBLE de la
  // ressource/action, jamais sur la position GPS live de l'acteur (decision
  // documentee dans docs/ARCHITECTURE.md - un role ne doit pas s'evaporer
  // parce que son titulaire voyage).
  async canActOnCity(userId: string, targetCityId: string): Promise<boolean> {
    const role = await this.findByUserId(userId);
    if (!role) return false;
    if (role.scope === RoleScope.NATIONAL) return true;
    return role.cityId === targetCityId;
  }

  async requireCityScope(userId: string, targetCityId: string): Promise<void> {
    const allowed = await this.canActOnCity(userId, targetCityId);
    if (!allowed) {
      throw new ForbiddenException('Hors de votre périmètre géographique.');
    }
  }

  // Distinct de canActOnCity/requireCityScope : ceux-ci autorisent le role
  // national PARTOUT (usage lecture/scope general). La moderation locale
  // (suppression de contenu) exclut deliberement le national - voir la
  // doctrine en tete de ce fichier ("aucune action destructrice unilaterale
  // par un seul role national"). Ne jamais utiliser requireCityScope pour
  // un controle de suppression/moderation - utiliser ceci a la place.
  async isLocalModeratorForCity(
    userId: string,
    targetCityId: string,
  ): Promise<boolean> {
    const role = await this.findByUserId(userId);
    return role?.scope === RoleScope.LOCAL && role.cityId === targetCityId;
  }

  async requireLocalModerationScope(
    userId: string,
    targetCityId: string,
  ): Promise<void> {
    const allowed = await this.isLocalModeratorForCity(userId, targetCityId);
    if (!allowed) {
      throw new ForbiddenException('Vous ne pouvez pas modérer ce contenu.');
    }
  }

  async getOrThrow(userId: string): Promise<Role> {
    const role = await this.findByUserId(userId);
    if (!role) throw new NotFoundException('Aucun rôle pour cet utilisateur.');
    return role;
  }
}
