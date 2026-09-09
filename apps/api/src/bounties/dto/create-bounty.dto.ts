import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BountyKind } from '../bounty-kind.enum';
import { ServiceCategory } from '../service-category.enum';

// Durees exactes decrites dans le canevas strategique (section 4), voir
// docs/LEAN_CANVAS.md.
export const BOUNTY_DURATIONS_HOURS = [2, 12, 24] as const;

export class CreateBountyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;

  @IsIn(BOUNTY_DURATIONS_HOURS)
  durationHours: number;

  // Marketplace (refonte 2026-09-09) - tous optionnels, defauts geres cote
  // service (voir BountiesService.create()) pour garder le comportement
  // historique inchange quand absents.
  @IsOptional()
  @IsEnum(BountyKind)
  kind?: BountyKind;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  // Borne haute alignee sur numeric(10,2) en base, meme raison que
  // sponsorship/dto/create-sponsorship-request.dto.ts.
  @Max(99999999.99)
  priceMad?: number;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;
}
