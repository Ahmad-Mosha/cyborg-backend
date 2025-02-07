import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AiChatService } from './services/ai-chat.service';
import { GetUser } from '@shared/decorators/get-user.decorator';
import { User } from '@modules/users/entities/user.entity';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('conversations')
  async startConversation(@GetUser() user: User) {
    return await this.aiChatService.startNewConversation(user);
  }

  @Get('conversations')
  async getConversations(@GetUser() user: User) {
    return await this.aiChatService.getConversations(user);
  }

  @Get('conversations/:id')
  async getConversation(
    @GetUser() user: User,
    @Param('id') conversationId: string,
  ) {
    return await this.aiChatService.getConversation(user, conversationId);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @GetUser() user: User,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    return await this.aiChatService.sendMessage(user, conversationId, content);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @GetUser() user: User,
    @Param('id') conversationId: string,
  ) {
    return await this.aiChatService.deleteConversation(user, conversationId);
  }
}