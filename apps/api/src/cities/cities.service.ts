import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';

// Villes universitaires marocaines ou la diaspora togolaise est presente -
// liste de depart pour le MVP, extensible sans redeploiement via de vraies
// migrations (voir apps/api/src/database/migrations/).
// Coordonnees approximatives du centre-ville (lat, lng) - servent a deriver
// la ville d'un Pin/Bounty par plus-proche-voisin, pas de vraies frontieres
// administratives pour le MVP (voir docs/ARCHITECTURE.md).
const SEED_CITIES: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Rabat', lat: 34.0209, lng: -6.8416 },
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
  { name: 'Marrakech', lat: 31.6295, lng: -7.9811 },
  { name: 'Fès', lat: 34.0331, lng: -5.0003 },
  { name: 'Tanger', lat: 35.7595, lng: -5.834 },
  { name: 'Ifrane', lat: 33.5228, lng: -5.1106 },
  { name: 'Safi', lat: 32.2994, lng: -9.2372 },
  { name: 'Agadir', lat: 30.4278, lng: -9.5981 },
  { name: 'Oujda', lat: 34.6867, lng: -1.9114 },
  { name: 'Kénitra', lat: 34.261, lng: -6.5802 },
  { name: 'Meknès', lat: 33.8935, lng: -5.5473 },
  { name: 'El Jadida', lat: 33.2316, lng: -8.5007 },
];

@Injectable()
export class CitiesService implements OnModuleInit {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(City)
    private readonly cities: Repository<City>,
  ) {}

  async onModuleInit() {
    for (const { name, lat, lng } of SEED_CITIES) {
      const existing = await this.cities.findOne({ where: { name } });
      if (!existing) {
        await this.cities.query(
          `INSERT INTO cities (id, name, "centerPoint")
           VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography)`,
          [crypto.randomUUID(), name, lng, lat],
        );
      } else if (!existing.centerPoint) {
        await this.cities.query(
          `UPDATE cities SET "centerPoint" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
           WHERE id = $3`,
          [lng, lat, existing.id],
        );
      }
    }
    this.logger.log(`Villes disponibles : ${SEED_CITIES.length}`);
  }

  findAll(): Promise<City[]> {
    return this.cities.find({ order: { name: 'ASC' } });
  }

  findById(id: string): Promise<City | null> {
    return this.cities.findOne({ where: { id } });
  }

  // Deduit la ville la plus proche d'un point donne (voisin le plus proche
  // via l'operateur PostGIS <->, s'appuie sur l'index spatial GiST cree par
  // la migration AddSpatialIndexes - avant elle, ce chemin faisait un scan
  // sequentiel complet de "cities" a CHAQUE creation de Pin/Bounty, trouve
  // par architecture-review le 2026-08-25).
  async findNearest(lat: number, lng: number): Promise<City | null> {
    const rows: Array<{ id: string; name: string }> = await this.cities.query(
      `SELECT id, name FROM cities
       WHERE "centerPoint" IS NOT NULL
       ORDER BY "centerPoint" <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       LIMIT 1`,
      [lng, lat],
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  }
}
