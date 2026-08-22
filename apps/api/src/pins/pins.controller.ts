import {
  BadRequestException,
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
import { BboxQueryDto } from './dto/bbox-query.dto';
import type { BBox } from './pins.service';

const DEFAULT_CLUSTER_PRECISION_METERS = 500;

function toBBox(q: BboxQueryDto): BBox | undefined {
  const { minLng, minLat, maxLng, maxLat } = q;
  if (
    minLng === undefined &&
    minLat === undefined &&
    maxLng === undefined &&
    maxLat === undefined
  ) {
    return undefined;
  }
  if (
    minLng === undefined ||
    minLat === undefined ||
    maxLng === undefined ||
    maxLat === undefined
  ) {
    throw new BadRequestException(
      'bbox incomplet : minLng, minLat, maxLng et maxLat sont tous requis ensemble.',
    );
  }
  return { minLng, minLat, maxLng, maxLat };
}

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
