import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { BountiesService } from './bounties.service';
import { CreateBountyDto } from './dto/create-bounty.dto';
import { RateBountyDto } from './dto/rate-bounty.dto';
import { toBBox } from '../common/bbox';
import { ListBountiesQueryDto } from './dto/list-bounties-query.dto';

@Controller('bounties')
export class BountiesController {
  constructor(private readonly bounties: BountiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBountyDto) {
    return this.bounties.create(user.userId, dto);
  }

  @Get()
  findAll(@Query() query: ListBountiesQueryDto) {
    return this.bounties.findAll(toBBox(query), query.status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bounties.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/claim')
  claim(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bounties.claim(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/resolve')
  resolve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bounties.resolve(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/rate')
  rate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RateBountyDto,
  ) {
    return this.bounties.rate(user.userId, id, dto.value, dto.comment);
  }
}
