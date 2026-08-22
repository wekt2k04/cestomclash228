import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RolesService } from './roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.roles.findByUserId(user.userId);
  }

  // Reserve aux roles nationaux - applique dans RolesService.assign(), pas
  // seulement ici (jamais confiance a un controle cote route seul).
  @Post('assign')
  assign(@CurrentUser() actor: AuthenticatedUser, @Body() dto: AssignRoleDto) {
    return this.roles.assign(
      actor.userId,
      dto.targetUserId,
      dto.scope,
      dto.cityId ?? null,
    );
  }
}
