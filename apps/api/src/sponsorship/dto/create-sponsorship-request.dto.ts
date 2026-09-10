import {
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { IsPublicHttpsUrlConstraint } from '../../common/validators/is-public-https-url.constraint';

export class CreateSponsorshipRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsNumber()
  @IsPositive()
  // Borne haute alignee sur numeric(10,2) en base (voir
  // entities/sponsorship-request.entity.ts) - sans elle un montant hors bornes
  // declenchait une erreur Postgres non geree (500) plutot qu'un 400 propre.
  @Max(99999999.99)
  amountDeclared: number;

  @IsString()
  @Validate(IsPublicHttpsUrlConstraint)
  proofImageUrl: string;
}
