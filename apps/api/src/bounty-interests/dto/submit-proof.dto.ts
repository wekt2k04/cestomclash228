import { IsString, Validate } from 'class-validator';
import { IsPublicHttpsUrlConstraint } from '../../common/validators/is-public-https-url.constraint';

export class SubmitProofDto {
  @IsString()
  @Validate(IsPublicHttpsUrlConstraint)
  proofImageUrl: string;
}
