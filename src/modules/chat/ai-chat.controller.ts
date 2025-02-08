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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ChatMessageDto } from './dto/chat-message.dto';

@ApiTags('AI Chat')
@Controller('ai-chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new AI conversation' })
  @ApiResponse({
    status: 201,
    description: 'The conversation has been successfully created',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startConversation(@GetUser() user: User) {
    return await this.aiChatService.startNewConversation(user);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all AI conversations for the user' })
  @ApiResponse({
    status: 200,
    description: 'List of all conversations',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConversations(@GetUser() user: User) {
    return await this.aiChatService.getConversations(user);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the conversation to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'The conversation details',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @GetUser() user: User,
    @Param('id') conversationId: string,
  ) {
    return await this.aiChatService.getConversation(user, conversationId);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the conversation to send a message to',
  })
  @ApiBody({ type: ChatMessageDto })
  @ApiResponse({
    status: 201,
    description: 'The message has been successfully sent',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @GetUser() user: User,
    @Param('id') conversationId: string,
    @Body() messageDto: ChatMessageDto,
  ) {
    return await this.aiChatService.sendMessage(
      user,
      conversationId,
      messageDto.content,
    );
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the conversation to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'The conversation has been successfully deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(
    @GetUser() user: User,
    @Param('id') conversationId: string,
  ) {
    return await this.aiChatService.deleteConversation(user, conversationId);
  }
}
