import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pin } from './entities/pin.entity';
import { CitiesService } from '../cities/cities.service';
import { RolesService } from '../roles/roles.service';
import { CreatePinDto } from './dto/create-pin.dto';
import type { BBox } from '../common/bbox';

export interface PinView {
  id: string;
  type: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  cityId: string;
  cityName: string;
  authorId: string;
  authorDisplayName: string;
  createdAt: Date;
}

export interface PinCluster {
  lat: number;
  lng: number;
  count: number;
  pinIds: string[];
}

const BBOX_SQL = `ST_Intersects(
  p.location,
  ST_MakeEnvelope($__minLng, $__minLat, $__maxLng, $__maxLat, 4326)::geography
)`;

@Injectable()
export class PinsService {
  constructor(
    @InjectRepository(Pin)
    private readonly pins: Repository<Pin>,
    private readonly cities: CitiesService,
    private readonly roles: RolesService,
  ) {}

  async create(authorId: string, dto: CreatePinDto): Promise<PinView> {
    const city = await this.cities.findNearest(dto.lat, dto.lng);
    if (!city) {
      throw new NotFoundException('Aucune ville de référence trouvée.');
    }

    const id = crypto.randomUUID();
    await this.pins.query(
      `INSERT INTO pins (id, "authorId", type, title, description, location, "cityId")
       VALUES ($1, $2, $3, $4, $5,
               ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8)`,
      [
        id,
        authorId,
        dto.type,
        dto.title,
        dto.description,
        dto.lng,
        dto.lat,
        city.id,
      ],
    );

    return this.findOne(id);
  }

  async findOne(id: string): Promise<PinView> {
    const rows = await this.rawSelect('p.id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('Pin introuvable.');
    return rows[0];
  }

  // bbox optionnel : sans lui, retourne tous les Pins (acceptable au volume
  // du MVP - a remplacer par une pagination avant un vrai volume d'usage).
  async findInBBox(bbox?: BBox): Promise<PinView[]> {
    if (!bbox) return this.rawSelect('TRUE', []);
    const sql = BBOX_SQL.replace('$__minLng', '$1')
      .replace('$__minLat', '$2')
      .replace('$__maxLng', '$3')
      .replace('$__maxLat', '$4');
    return this.rawSelect(sql, [
      bbox.minLng,
      bbox.minLat,
      bbox.maxLng,
      bbox.maxLat,
    ]);
  }

  // Clustering approximatif via ST_ClusterDBSCAN (PostGIS) : eps convertit
  // des metres en degres par une approximation standard (1 degre ~ 111 320 m)
  // - suffisant pour regrouper visuellement des pins a l'echelle d'un
  // quartier/ville sur le MVP, pas une precision geodesique exacte (voir
  // docs/ARCHITECTURE.md).
  async cluster(
    bbox: BBox | undefined,
    precisionMeters: number,
  ): Promise<PinCluster[]> {
    const epsDegrees = precisionMeters / 111_320;
    const where = bbox
      ? BBOX_SQL.replace('$__minLng', '$2')
          .replace('$__minLat', '$3')
          .replace('$__maxLng', '$4')
          .replace('$__maxLat', '$5')
      : 'TRUE';
    const params: unknown[] = [epsDegrees];
    if (bbox) params.push(bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat);

    const rows: Array<{
      lat: number;
      lng: number;
      count: string;
      pin_ids: string[];
    }> = await this.pins.query(
      `SELECT
           AVG(ST_Y(p.location::geometry)) AS lat,
           AVG(ST_X(p.location::geometry)) AS lng,
           COUNT(*) AS count,
           ARRAY_AGG(p.id) AS pin_ids
         FROM (
           SELECT p.*, ST_ClusterDBSCAN(p.location::geometry, eps := $1, minpoints := 1)
             OVER () AS cluster_id
           FROM pins p
           WHERE ${where}
         ) p
         GROUP BY p.cluster_id`,
      params,
    );

    return rows.map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      count: Number(r.count),
      pinIds: r.pin_ids,
    }));
  }

  // Suppression : l'auteur peut toujours supprimer son propre Pin. Un role
  // local peut moderer un Pin dans SA ville. Un role national n'a
  // volontairement PAS de suppression unilaterale ailleurs - principe acte
  // dans docs/ARCHITECTURE.md, ne pas "corriger" en autorisant national ici.
  async remove(userId: string, pinId: string): Promise<void> {
    const pin = await this.pins.findOne({ where: { id: pinId } });
    if (!pin) throw new NotFoundException('Pin introuvable.');

    if (pin.authorId === userId) {
      await this.pins.delete({ id: pinId });
      return;
    }

    const isLocalModeratorHere = await this.roles.isLocalModeratorForCity(
      userId,
      pin.cityId,
    );
    if (!isLocalModeratorHere) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce Pin.');
    }
    await this.pins.delete({ id: pinId });
  }

  private async rawSelect(
    whereSql: string,
    params: unknown[],
  ): Promise<PinView[]> {
    const rows: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      lat: number;
      lng: number;
      cityid: string;
      cityname: string;
      authorid: string;
      authordisplayname: string;
      createdat: Date;
    }> = await this.pins.query(
      `SELECT
         p.id, p.type, p.title, p.description,
         ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng,
         p."cityId" AS cityid, c.name AS cityname,
         p."authorId" AS authorid, u."displayName" AS authordisplayname,
         p."createdAt" AS createdat
       FROM pins p
       JOIN cities c ON c.id = p."cityId"
       JOIN users u ON u.id = p."authorId"
       WHERE ${whereSql}
       ORDER BY p."createdAt" DESC`,
      params,
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      lat: Number(r.lat),
      lng: Number(r.lng),
      cityId: r.cityid,
      cityName: r.cityname,
      authorId: r.authorid,
      authorDisplayName: r.authordisplayname,
      createdAt: r.createdat,
    }));
  }
}
