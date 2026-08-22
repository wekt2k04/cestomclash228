import { Type } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

// Partage entre pins/ et bounties/ - les deux modules filtrent des
// entites geolocalisees de la meme facon (voir docs/ARCHITECTURE.md sur
// la centralisation de la logique spatiale).
export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export class BboxQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  precisionMeters?: number;
}

export function toBBox(q: BboxQueryDto): BBox | undefined {
  const { minLng, minLat, maxLng, maxLat } = q;
  const provided = [minLng, minLat, maxLng, maxLat].filter(
    (v) => v !== undefined,
  );
  if (provided.length === 0) return undefined;
  if (provided.length < 4) {
    throw new BadRequestException(
      'bbox incomplet : minLng, minLat, maxLng et maxLat sont tous requis ensemble.',
    );
  }
  return {
    minLng: minLng as number,
    minLat: minLat as number,
    maxLng: maxLng as number,
    maxLat: maxLat as number,
  };
}
