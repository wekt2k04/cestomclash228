import { IsEnum, IsOptional } from 'class-validator';
import { BboxQueryDto } from '../../common/bbox';
import { BountyStatus } from '../bounty-status.enum';

// Etend BboxQueryDto plutot que d'ajouter un @Query('status') separe sur le
// controller : le ValidationPipe global (whitelist + forbidNonWhitelisted)
// valide TOUT l'objet query contre le DTO lie a @Query() - un champ present
// dans l'URL mais absent du DTO est rejete ("property status should not
// exist"), meme s'il est cense etre capture par un second decorateur
// @Query('status') a part. Bug reel constate en testant l'app dans un vrai
// navigateur, pas en lisant le code.
export class ListBountiesQueryDto extends BboxQueryDto {
  @IsOptional()
  @IsEnum(BountyStatus)
  status?: BountyStatus;
}
