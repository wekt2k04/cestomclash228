import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RoleScope } from '../role-scope.enum';

export class AssignRoleDto {
  @IsUUID()
  targetUserId: string;

  @IsEnum(RoleScope)
  scope: RoleScope;

  @IsOptional()
  @IsUUID()
  cityId?: string;
}
