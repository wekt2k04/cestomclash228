import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
}
