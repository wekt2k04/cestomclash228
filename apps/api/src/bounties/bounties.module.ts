import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bounty } from './entities/bounty.entity';
import { BountiesService } from './bounties.service';
import { BountiesController } from './bounties.controller';
import { CitiesModule } from '../cities/cities.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bounty]), CitiesModule, RolesModule],
  controllers: [BountiesController],
  providers: [BountiesService],
  exports: [BountiesService],
})
export class BountiesModule {}
