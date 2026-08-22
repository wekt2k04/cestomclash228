import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';

// Villes universitaires marocaines où la diaspora togolaise est presente -
// liste de depart pour le MVP, extensible sans redeploiement via de vraies
// migrations plus tard (voir docs/STACK.md sur synchronize:true).
const SEED_CITIES = [
  'Rabat',
  'Casablanca',
  'Marrakech',
  'Fès',
  'Tanger',
  'Ifrane',
  'Safi',
  'Agadir',
  'Oujda',
  'Kénitra',
  'Meknès',
  'El Jadida',
];

@Injectable()
export class CitiesService implements OnModuleInit {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(City)
    private readonly cities: Repository<City>,
  ) {}

  async onModuleInit() {
    for (const name of SEED_CITIES) {
      const exists = await this.cities.findOne({ where: { name } });
      if (!exists) {
        await this.cities.save(this.cities.create({ name }));
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
}
