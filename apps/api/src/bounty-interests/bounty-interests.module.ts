import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BountyInterest } from './entities/bounty-interest.entity';
import { Bounty } from '../bounties/entities/bounty.entity';
import { BountyInterestsService } from './bounty-interests.service';
import {
  BountyInterestsCollectionController,
  BountyInterestActionsController,
} from './bounty-interests.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [TypeOrmModule.forFeature([BountyInterest, Bounty]), ChatModule],
  controllers: [
    BountyInterestsCollectionController,
    BountyInterestActionsController,
  ],
  providers: [BountyInterestsService],
  exports: [BountyInterestsService],
})
export class BountyInterestsModule {}
