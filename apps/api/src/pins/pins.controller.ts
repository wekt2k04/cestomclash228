import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { PinsService } from './pins.service';
import { CreatePinDto } from './dto/create-pin.dto';
import { BboxQueryDto, toBBox } from '../common/bbox';

const DEFAULT_CLUSTER_PRECISION_METERS = 500;

@Controller('pins')
export class PinsController {
  constructor(private readonly pins: PinsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePinDto) {
    return this.pins.create(user.userId, dto);
  }

  @Get()
  findAll(@Query() query: BboxQueryDto) {
    return this.pins.findInBBox(toBBox(query));
  }

  @Get('clusters')
  clusters(@Query() query: BboxQueryDto) {
    return this.pins.cluster(
      toBBox(query),
      query.precisionMeters ?? DEFAULT_CLUSTER_PRECISION_METERS,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pins.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.pins.remove(user.userId, id);
  }
}
