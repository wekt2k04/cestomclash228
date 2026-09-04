import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectSponsorshipRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
