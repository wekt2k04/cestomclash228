import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bounty } from './entities/bounty.entity';
import { BountiesService } from './bounties.service';
import { BountiesController } from './bounties.controller';
import { CitiesModule } from '../cities/cities.module';
import { RolesModule } from '../roles/roles.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bounty]),
    CitiesModule,
    RolesModule,
    ChatModule,
  ],
  controllers: [BountiesController],
  providers: [BountiesService],
  exports: [BountiesService],
})
export class BountiesModule {}
