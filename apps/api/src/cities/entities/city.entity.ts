import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  // Point central approximatif de la ville - sert a deriver la ville d'un
  // Pin/Bounty par ville la plus proche (pas de vraies frontieres
  // administratives pour le MVP, voir docs/ARCHITECTURE.md). Valeur brute
  // WKB retournee par pg - jamais lue directement, toujours via ST_X/ST_Y ou
  // l'operateur <-> dans PinsService.
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  centerPoint: string | null;
}
