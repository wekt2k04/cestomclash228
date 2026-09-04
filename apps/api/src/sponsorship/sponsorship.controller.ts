import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { SponsorshipService } from './sponsorship.service';
import { CreateSponsorshipRequestDto } from './dto/create-sponsorship-request.dto';
import { RejectSponsorshipRequestDto } from './dto/reject-sponsorship-request.dto';

@Controller('sponsorship-requests')
export class SponsorshipController {
  constructor(private readonly sponsorship: SponsorshipService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSponsorshipRequestDto,
  ) {
    return this.sponsorship.create(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.sponsorship.findMine(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  findPending(@CurrentUser() user: AuthenticatedUser) {
    return this.sponsorship.findPending(user.userId);
  }

  // Public, volontairement sans garde : c'est la contrepartie visible du
  // Sponsoring verifie (voir sponsorship.service.ts).
  @Get('approved')
  findApprovedPublic() {
    return this.sponsorship.findApprovedPublic();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sponsorship.findOne(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sponsorship.approve(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectSponsorshipRequestDto,
  ) {
    return this.sponsorship.reject(user.userId, id, dto.reason);
  }
}
