import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bounty } from './entities/bounty.entity';
import { BountyStatus } from './bounty-status.enum';
import { CitiesService } from '../cities/cities.service';
import { CreateBountyDto } from './dto/create-bounty.dto';
import type { BBox } from '../common/bbox';

export interface BountyView {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  cityId: string;
  cityName: string;
  status: BountyStatus;
  authorId: string;
  authorDisplayName: string;
  claimedById: string | null;
  claimedByDisplayName: string | null;
  expiresAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
}

const BBOX_SQL = `ST_Intersects(
  b.location,
  ST_MakeEnvelope($__minLng, $__minLat, $__maxLng, $__maxLat, 4326)::geography
)`;

@Injectable()
export class BountiesService {
  constructor(
    @InjectRepository(Bounty)
    private readonly bounties: Repository<Bounty>,
    private readonly cities: CitiesService,
  ) {}

  async create(authorId: string, dto: CreateBountyDto): Promise<BountyView> {
    const city = await this.cities.findNearest(dto.lat, dto.lng);
    if (!city) {
      throw new NotFoundException('Aucune ville de référence trouvée.');
    }

    const id = crypto.randomUUID();
    await this.bounties.query(
      `INSERT INTO bounties
         (id, "authorId", title, description, location, "cityId", status, "expiresAt")
       VALUES ($1, $2, $3, $4,
               ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, 'open',
               now() + ($8 || ' hours')::interval)`,
      [
        id,
        authorId,
        dto.title,
        dto.description,
        dto.lng,
        dto.lat,
        city.id,
        dto.durationHours,
      ],
    );

    return this.findOne(id);
  }

  async findOne(id: string): Promise<BountyView> {
    await this.materializeExpiry();
    const rows = await this.rawSelect('b.id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('Bounty introuvable.');
    return rows[0];
  }

  async findAll(bbox?: BBox, status?: BountyStatus): Promise<BountyView[]> {
    await this.materializeExpiry();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (bbox) {
      clauses.push(
        BBOX_SQL.replace('$__minLng', '$1')
          .replace('$__minLat', '$2')
          .replace('$__maxLng', '$3')
          .replace('$__maxLat', '$4'),
      );
      params.push(bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat);
    }
    if (status) {
      params.push(status);
      clauses.push(`b.status = $${params.length}`);
    }
    return this.rawSelect(
      clauses.length ? clauses.join(' AND ') : 'TRUE',
      params,
    );
  }

  // Reclamation atomique : une seule requete conditionnelle, jamais un
  // lire-puis-ecrire (evite la course entre deux utilisateurs qui reclament
  // en meme temps - cas limite explicitement demande, voir
  // .claude/agents/critical-logic-tests.md). authorId != userId empeche
  // aussi de reclamer sa propre bounty, dans la meme requete atomique.
  async claim(userId: string, bountyId: string): Promise<BountyView> {
    await this.materializeExpiry();
    // Pour une requete mutante (UPDATE/INSERT/DELETE) avec RETURNING, cette
    // version de TypeORM renvoie un tuple [rows, rowCount] - PAS directement
    // le tableau de lignes comme pour un SELECT (verifie empiriquement, ce
    // n'etait pas le comportement suppose au premier jet : rows.length===0
    // ne declenchait jamais car rows valait [[], 0], donc .length===2). Ne
    // pas "corriger" en repassant a un acces direct sans destructurer.
    const [rows] = await this.bounties.query<[Array<{ id: string }>, number]>(
      `UPDATE bounties
       SET status = 'claimed', "claimedById" = $1
       WHERE id = $2 AND status = 'open' AND "expiresAt" > now() AND "authorId" != $1
       RETURNING id`,
      [userId, bountyId],
    );

    if (rows.length === 0) {
      const bounty = await this.bounties.findOne({ where: { id: bountyId } });
      if (!bounty) throw new NotFoundException('Bounty introuvable.');
      if (bounty.authorId === userId) {
        throw new BadRequestException(
          'Vous ne pouvez pas réclamer votre propre Bounty.',
        );
      }
      if (
        bounty.status !== BountyStatus.OPEN ||
        bounty.expiresAt <= new Date()
      ) {
        throw new ConflictException(
          'Cette Bounty a déjà été réclamée, résolue ou a expiré.',
        );
      }
      // Etat incoherent inattendu - ne devrait pas arriver vu les checks
      // ci-dessus, mais on ne masque jamais un echec silencieusement.
      throw new ConflictException('Impossible de réclamer cette Bounty.');
    }

    return this.findOne(bountyId);
  }

  // Resolution : par l'auteur (sa demande a ete satisfaite) ou la personne
  // qui a reclame (elle confirme avoir aide) - les deux parties peuvent
  // cloturer, decision deliberee plutot qu'un oubli.
  async resolve(userId: string, bountyId: string): Promise<BountyView> {
    await this.materializeExpiry();
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty introuvable.');

    if (bounty.authorId !== userId && bounty.claimedById !== userId) {
      throw new ForbiddenException(
        "Seuls l'auteur ou la personne qui a réclamé cette Bounty peuvent la résoudre.",
      );
    }
    if (bounty.status !== BountyStatus.CLAIMED) {
      throw new ConflictException(
        'Seule une Bounty réclamée peut être marquée résolue.',
      );
    }

    await this.bounties.update(
      { id: bountyId },
      { status: BountyStatus.RESOLVED, resolvedAt: new Date() },
    );
    return this.findOne(bountyId);
  }

  // Materialise en base les bounties OPEN dont l'echeance est passee - pas
  // de scheduler/cron (incompatible avec le scale-to-zero, voir
  // docs/ARCHITECTURE.md) : la verification se fait a la lecture.
  private async materializeExpiry(): Promise<void> {
    await this.bounties.query(
      `UPDATE bounties SET status = 'expired'
       WHERE status = 'open' AND "expiresAt" <= now()`,
    );
  }

  private async rawSelect(
    whereSql: string,
    params: unknown[],
  ): Promise<BountyView[]> {
    const rows: Array<{
      id: string;
      title: string;
      description: string;
      lat: number;
      lng: number;
      cityid: string;
      cityname: string;
      status: BountyStatus;
      authorid: string;
      authordisplayname: string;
      claimedbyid: string | null;
      claimedbydisplayname: string | null;
      expiresat: Date;
      resolvedat: Date | null;
      createdat: Date;
    }> = await this.bounties.query(
      `SELECT
         b.id, b.title, b.description,
         ST_Y(b.location::geometry) AS lat, ST_X(b.location::geometry) AS lng,
         b."cityId" AS cityid, c.name AS cityname, b.status,
         b."authorId" AS authorid, u."displayName" AS authordisplayname,
         b."claimedById" AS claimedbyid, cu."displayName" AS claimedbydisplayname,
         b."expiresAt" AS expiresat, b."resolvedAt" AS resolvedat,
         b."createdAt" AS createdat
       FROM bounties b
       JOIN cities c ON c.id = b."cityId"
       JOIN users u ON u.id = b."authorId"
       LEFT JOIN users cu ON cu.id = b."claimedById"
       WHERE ${whereSql}
       ORDER BY b."expiresAt" ASC`,
      params,
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      lat: Number(r.lat),
      lng: Number(r.lng),
      cityId: r.cityid,
      cityName: r.cityname,
      status: r.status,
      authorId: r.authorid,
      authorDisplayName: r.authordisplayname,
      claimedById: r.claimedbyid,
      claimedByDisplayName: r.claimedbydisplayname,
      expiresAt: r.expiresat,
      resolvedAt: r.resolvedat,
      createdAt: r.createdat,
    }));
  }
}
