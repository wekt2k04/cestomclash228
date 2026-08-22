import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PinType } from '../pin-type.enum';

export class CreatePinDto {
  @IsEnum(PinType)
  type: PinType;

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
}
