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
import { BountyInterestsService } from './bounty-interests.service';
import { SubmitProofDto } from './dto/submit-proof.dto';

// Nichee sous /bounties/:bountyId (comme ChatController) - proposer son aide ou lister les
// propositions se fait toujours dans le contexte d'une Bounty precise deja affichee cote client.
@Controller('bounties/:bountyId/interests')
export class BountyInterestsCollectionController {
  constructor(private readonly interests: BountyInterestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  express(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bountyId') bountyId: string,
  ) {
    return this.interests.expressInterest(user.userId, bountyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bountyId') bountyId: string,
  ) {
    return this.interests.findCandidates(user.userId, bountyId);
  }
}

// Route top-level distincte : accepter/transmettre une preuve/confirmer un paiement se fait sur
// UNE proposition precise (son id), le client n'a plus besoin de reconnaitre l'id de la Bounty a
// ce stade (deja recu via la liste ci-dessus).
@Controller('bounty-interests')
export class BountyInterestActionsController {
  constructor(private readonly interests: BountyInterestsService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.interests.accept(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/proof')
  submitProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SubmitProofDto,
  ) {
    return this.interests.submitProof(user.userId, id, dto.proofImageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/confirm-payment')
  confirmPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.interests.confirmPayment(user.userId, id);
  }
}
