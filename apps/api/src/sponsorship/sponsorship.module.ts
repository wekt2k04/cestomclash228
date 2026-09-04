import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SponsorshipRequest } from './entities/sponsorship-request.entity';
import { SponsorshipService } from './sponsorship.service';
import { SponsorshipController } from './sponsorship.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([SponsorshipRequest]), RolesModule],
  controllers: [SponsorshipController],
  providers: [SponsorshipService],
  exports: [SponsorshipService],
})
export class SponsorshipModule {}
