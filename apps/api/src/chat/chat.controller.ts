import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

// Route nichee sous /bounties/:bountyId (pas /conversations/:id) - le frontend ne connait
// jamais l'id de Conversation, seulement celui de la Bounty qu'il affiche deja (voir
// BountyChat.tsx). Cohabite sans collision avec BountiesController (bounties.controller.ts) :
// aucune de ses routes ne se termine par /messages.
@Controller('bounties/:bountyId')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('messages')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bountyId') bountyId: string,
  ) {
    return this.chat.listMessages(user.userId, bountyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages')
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bountyId') bountyId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.postMessage(user.userId, bountyId, dto.body);
  }
}
